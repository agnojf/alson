"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installSkill = installSkill;
exports.updateSkill = updateSkill;
exports.deleteSkill = deleteSkill;
exports.computeStatuses = computeStatuses;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
const catalog_js_1 = require("../catalog/catalog.js");
const remote_js_1 = require("../catalog/remote.js");
const validate_js_1 = require("../catalog/validate.js");
const hash_js_1 = require("../util/hash.js");
const io_js_1 = require("../util/io.js");
const paths_js_1 = require("../util/paths.js");
const version_js_1 = require("../util/version.js");
const installed_js_1 = require("../state/installed.js");
const safety_js_1 = require("./safety.js");
const staging_js_1 = require("./staging.js");
async function stagePackage(catalog, entry) {
    const src = catalog.origin === 'remote' || catalog.origin === 'cache'
        ? await (0, remote_js_1.materializeSkill)(entry, catalog.offline ?? false)
        : node_path_1.default.join((0, catalog_js_1.bundledSkillsRoot)(), entry.name);
    const manifest = await (0, validate_js_1.validatePackage)(src, entry.name);
    void manifest;
    const staged = node_path_1.default.join((0, paths_js_1.stagingDir)(), `${entry.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    await (0, staging_js_1.copyDirSafe)(src, staged);
    const stagedHash = await (0, hash_js_1.packageHash)(staged);
    if (stagedHash !== entry.hash) {
        await (0, io_js_1.removeIfExists)(staged);
        throw new errors_js_1.AlsonError('InvalidPackage', `${entry.name} package is invalid: staged content does not match the catalog hash`);
    }
    return staged;
}
async function recordFor(entry, files) {
    return {
        name: entry.name,
        version: entry.version,
        hash: entry.hash,
        cliVersion: await (0, safety_js_1.readCliVersion)(),
        installedAt: new Date().toISOString(),
        files,
        ...(entry.source ? { source: entry.source } : {})
    };
}
async function installSkill(catalog, entry, opts) {
    const dir = (0, safety_js_1.targetDir)(entry.name);
    const state = await (0, installed_js_1.readState)();
    const existing = state.installs[entry.name];
    if ((0, safety_js_1.targetExists)(entry.name) && !existing && !opts.force) {
        throw new errors_js_1.AlsonError('Unmanaged', `${dir} already exists and is not manager-installed. Use --force to replace it`);
    }
    const staged = await stagePackage(catalog, entry);
    if ((0, safety_js_1.targetExists)(entry.name) && existing && !opts.force) {
        const ok = await (0, io_js_1.confirm)(`${entry.name} is already installed (${existing.version}). Overwrite? (y/n)`);
        if (!ok) {
            await (0, io_js_1.removeIfExists)(staged);
            throw new errors_js_1.AlsonError('Usage', 'install cancelled');
        }
    }
    const backup = node_path_1.default.join((0, paths_js_1.stagingDir)(), `${entry.name}-backup-${Date.now()}`);
    const hadTarget = (0, safety_js_1.targetExists)(entry.name);
    if (hadTarget) {
        await node_fs_1.default.promises.rename(dir, backup);
    }
    await node_fs_1.default.promises.mkdir(node_path_1.default.dirname(dir), { recursive: true });
    try {
        await node_fs_1.default.promises.rename(staged, dir);
    }
    catch (err) {
        if (hadTarget) {
            await node_fs_1.default.promises.rename(backup, dir);
        }
        throw err;
    }
    const files = await (0, hash_js_1.listFiles)(dir);
    state.installs[entry.name] = await recordFor(entry, files);
    try {
        await (0, installed_js_1.writeState)(state);
    }
    catch (err) {
        await (0, io_js_1.removeIfExists)(dir);
        if (hadTarget) {
            await node_fs_1.default.promises.rename(backup, dir);
        }
        throw err;
    }
    if (hadTarget) {
        await (0, io_js_1.removeIfExists)(backup);
    }
    return dir;
}
async function updateSkill(catalog, entry, opts) {
    const state = await (0, installed_js_1.readState)();
    const existing = state.installs[entry.name];
    if (!existing) {
        if ((0, safety_js_1.targetExists)(entry.name)) {
            throw new errors_js_1.AlsonError('Unmanaged', `${(0, safety_js_1.targetDir)(entry.name)} is not manager-installed. Refusing to update it`);
        }
        throw new errors_js_1.AlsonError('NotInstalled', `${entry.name} is not installed`);
    }
    if (!opts.force) {
        await (0, safety_js_1.verifyUnmodified)(entry.name, existing, 'update');
    }
    const dir = await installSkill(catalog, entry, { force: true });
    return dir;
}
async function deleteSkill(entryName, opts) {
    const state = await (0, installed_js_1.readState)();
    const record = state.installs[entryName];
    const dir = (0, safety_js_1.targetDir)(entryName);
    if (!record) {
        if ((0, safety_js_1.targetExists)(entryName)) {
            throw new errors_js_1.AlsonError('Unmanaged', `${dir} is not manager-installed. Refusing to delete it`);
        }
        throw new errors_js_1.AlsonError('NotInstalled', `${entryName} is not installed`);
    }
    if (!opts.force) {
        await (0, safety_js_1.verifyUnmodified)(entryName, record, 'delete');
        const ok = await (0, io_js_1.confirm)(`Delete ${entryName}@${record.version} from ${dir}? (y/n)`);
        if (!ok) {
            throw new errors_js_1.AlsonError('Usage', 'delete cancelled');
        }
    }
    const backup = node_path_1.default.join((0, paths_js_1.stagingDir)(), `${entryName}-delete-${Date.now()}`);
    if ((0, safety_js_1.targetExists)(entryName)) {
        await node_fs_1.default.promises.rename(dir, backup);
    }
    delete state.installs[entryName];
    try {
        await (0, installed_js_1.writeState)(state);
    }
    catch (err) {
        await (0, io_js_1.removeIfExists)(dir);
        if ((0, io_js_1.dirExists)(backup)) {
            await node_fs_1.default.promises.rename(backup, dir);
        }
        throw err;
    }
    await (0, io_js_1.removeIfExists)(backup);
    return dir;
}
async function computeStatuses(catalog) {
    const state = await (0, installed_js_1.readState)();
    const cliVersion = await (0, safety_js_1.readCliVersion)();
    const rows = [];
    for (const entry of catalog.skills) {
        const record = state.installs[entry.name];
        let status;
        let installedVersion = null;
        if (entry.minCliVersion && (0, version_js_1.compareVersions)(cliVersion, entry.minCliVersion) < 0) {
            status = 'incompatible';
        }
        else if (!record) {
            status = (0, safety_js_1.targetExists)(entry.name) ? 'unmanaged' : 'not installed';
        }
        else if (!(0, safety_js_1.targetExists)(entry.name)) {
            status = 'not installed';
            installedVersion = record.version;
        }
        else {
            installedVersion = record.version;
            const hash = await (0, hash_js_1.packageHash)((0, safety_js_1.targetDir)(entry.name));
            if (hash !== record.hash) {
                status = 'modified';
            }
            else if ((0, version_js_1.compareVersions)(record.version, entry.version) < 0) {
                status = 'update available';
            }
            else {
                status = 'current';
            }
        }
        rows.push({
            name: entry.name,
            bundledVersion: entry.version,
            installedVersion,
            description: entry.description,
            status
        });
    }
    return rows;
}
