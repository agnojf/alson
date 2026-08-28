"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.materializeSkill = materializeSkill;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
const hash_js_1 = require("../util/hash.js");
const io_js_1 = require("../util/io.js");
const net_js_1 = require("../util/net.js");
const paths_js_1 = require("../util/paths.js");
const validate_js_1 = require("./validate.js");
function safeFilePath(file) {
    return (file.length > 0 &&
        !file.includes('?') &&
        !file.includes('#') &&
        (0, validate_js_1.isSafeRelativePath)(file));
}
function resourceUrl(source, file) {
    if (!safeFilePath(file)) {
        throw new errors_js_1.AlsonError('UnsafePath', `package contains an unsafe path: ${file}`);
    }
    let base;
    try {
        base = new URL(source.endsWith('/') ? source : `${source}/`);
    }
    catch {
        throw new errors_js_1.AlsonError('InvalidPackage', `remote source URL is invalid: ${source}`);
    }
    if (base.protocol !== 'https:' && base.protocol !== 'file:') {
        throw new errors_js_1.AlsonError('InvalidPackage', `remote source URL uses an unsupported protocol: ${base.protocol}`);
    }
    if (base.protocol === 'file:' && process.env.ALSON_ALLOW_FILE_SOURCE !== '1') {
        throw new errors_js_1.AlsonError('InvalidPackage', 'remote source URL must use HTTPS');
    }
    return new URL(file, base).toString();
}
async function validCache(dir, entry) {
    if (!(0, io_js_1.dirExists)(dir)) {
        return false;
    }
    try {
        const manifest = await (0, validate_js_1.validatePackage)(dir, entry.name);
        return manifest.version === entry.version && (await (0, hash_js_1.packageHash)(dir)) === entry.hash;
    }
    catch {
        return false;
    }
}
async function materializeSkill(entry, offline) {
    const cache = (0, paths_js_1.skillCacheDir)(entry.name, entry.version, entry.hash);
    if (await validCache(cache, entry)) {
        return cache;
    }
    await (0, io_js_1.removeIfExists)(cache);
    if (offline) {
        throw new errors_js_1.AlsonError('SkillUnavailable', `${entry.name}@${entry.version} is not available offline. Connect to the internet and retry`);
    }
    if (!entry.source) {
        throw new errors_js_1.AlsonError('InvalidPackage', `${entry.name} package is invalid: remote source is missing`);
    }
    if (!entry.files || entry.files.length === 0) {
        throw new errors_js_1.AlsonError('InvalidPackage', `${entry.name} package is invalid: remote file list is missing`);
    }
    const duplicate = new Set();
    for (const file of entry.files) {
        if (!safeFilePath(file)) {
            throw new errors_js_1.AlsonError('UnsafePath', `package contains an unsafe path: ${file}`);
        }
        if (duplicate.has(file)) {
            throw new errors_js_1.AlsonError('InvalidPackage', `${entry.name} package is invalid: duplicate file ${file}`);
        }
        duplicate.add(file);
    }
    const temporary = `${cache}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
        await node_fs_1.default.promises.mkdir(temporary, { recursive: true });
        for (const file of entry.files) {
            const target = node_path_1.default.join(temporary, file);
            await node_fs_1.default.promises.mkdir(node_path_1.default.dirname(target), { recursive: true });
            let content;
            try {
                content = await (0, net_js_1.readResource)(resourceUrl(entry.source, file));
            }
            catch (err) {
                const reason = err instanceof Error ? err.message : String(err);
                throw new errors_js_1.AlsonError('SkillUnavailable', `unable to download ${entry.name}@${entry.version}: ${reason}. Check your internet connection and retry`);
            }
            await node_fs_1.default.promises.writeFile(target, content);
        }
        await (0, validate_js_1.validatePackage)(temporary, entry.name);
        const actualHash = await (0, hash_js_1.packageHash)(temporary);
        if (actualHash !== entry.hash) {
            throw new errors_js_1.AlsonError('IntegrityMismatch', `${entry.name}@${entry.version} failed integrity verification`);
        }
        await node_fs_1.default.promises.mkdir(node_path_1.default.dirname(cache), { recursive: true });
        await node_fs_1.default.promises.rename(temporary, cache);
        return cache;
    }
    catch (err) {
        await (0, io_js_1.removeIfExists)(temporary);
        if (err instanceof errors_js_1.AlsonError) {
            throw err;
        }
        const reason = err instanceof Error ? err.message : String(err);
        throw new errors_js_1.AlsonError('SkillUnavailable', `unable to cache ${entry.name}@${entry.version}: ${reason}`);
    }
}
