"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_REPOSITORY_CONFIG = void 0;
exports.repositoryConfigFile = repositoryConfigFile;
exports.readRepositoryConfig = readRepositoryConfig;
exports.addRepositoryParent = addRepositoryParent;
exports.removeRepositoryParent = removeRepositoryParent;
exports.repositoryParents = repositoryParents;
exports.isRepositoryConfigured = isRepositoryConfigured;
exports.offerRepositoryParent = offerRepositoryParent;
const node_os_1 = __importDefault(require("node:os"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
const io_js_1 = require("../util/io.js");
exports.EMPTY_REPOSITORY_CONFIG = { version: 1, parents: [] };
function repositoryConfigFile() {
    const configHome = process.env.ALSON_CONFIG_HOME || process.env.XDG_CONFIG_HOME || node_path_1.default.join(node_os_1.default.homedir(), '.config');
    return node_path_1.default.join(node_path_1.default.resolve(configHome), 'alson', 'config.json');
}
async function readRepositoryConfig() {
    const file = repositoryConfigFile();
    let raw;
    try {
        raw = await node_fs_1.default.promises.readFile(file, 'utf8');
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return structuredClone(exports.EMPTY_REPOSITORY_CONFIG);
        }
        throw err;
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed ||
            typeof parsed !== 'object' ||
            parsed.version !== 1 ||
            !Array.isArray(parsed.parents) ||
            parsed.parents.some((parent) => typeof parent !== 'string' || !node_path_1.default.isAbsolute(parent))) {
            throw new Error('unexpected configuration shape');
        }
        return {
            version: 1,
            parents: [...new Set(parsed.parents)]
        };
    }
    catch {
        throw new errors_js_1.AlsonError('ConfigCorrupt', `repository configuration is corrupt at ${file}. Fix or remove it, then retry`);
    }
}
async function canonicalDirectory(input) {
    const resolved = node_path_1.default.resolve(input);
    try {
        const stat = await node_fs_1.default.promises.stat(resolved);
        if (!stat.isDirectory()) {
            throw new errors_js_1.AlsonError('Usage', `${resolved} is not a directory`);
        }
        return await node_fs_1.default.promises.realpath(resolved);
    }
    catch (err) {
        if (err instanceof errors_js_1.AlsonError) {
            throw err;
        }
        const reason = err instanceof Error ? `: ${err.message}` : '';
        throw new errors_js_1.AlsonError('Usage', `unable to access repository parent ${resolved}${reason}`);
    }
}
async function writeRepositoryConfig(config) {
    await (0, io_js_1.atomicWriteFile)(repositoryConfigFile(), JSON.stringify(config, null, 2) + '\n');
}
async function addRepositoryParent(input) {
    const parent = await canonicalDirectory(input);
    const config = await readRepositoryConfig();
    if (config.parents.includes(parent)) {
        return { path: parent, added: false };
    }
    await writeRepositoryConfig({ version: 1, parents: [...config.parents, parent].sort() });
    return { path: parent, added: true };
}
async function removeRepositoryParent(input) {
    const resolved = node_path_1.default.resolve(input);
    const config = await readRepositoryConfig();
    const canonical = await node_fs_1.default.promises.realpath(resolved).catch(() => resolved);
    const pathToRemove = config.parents.find((parent) => parent === canonical || parent === resolved) ?? canonical;
    if (!config.parents.includes(pathToRemove)) {
        return { path: pathToRemove, removed: false };
    }
    await writeRepositoryConfig({
        version: 1,
        parents: config.parents.filter((parent) => parent !== pathToRemove)
    });
    return { path: pathToRemove, removed: true };
}
async function repositoryParents() {
    return (await readRepositoryConfig()).parents;
}
async function isRepositoryConfigured(root) {
    const config = await readRepositoryConfig();
    const canonicalRoot = await node_fs_1.default.promises.realpath(root).catch(() => node_path_1.default.resolve(root));
    return config.parents.includes(canonicalRoot) || config.parents.includes(node_path_1.default.dirname(canonicalRoot));
}
async function offerRepositoryParent(root) {
    if (!process.stdin.isTTY || (await isRepositoryConfigured(root))) {
        return false;
    }
    const canonicalRoot = await node_fs_1.default.promises.realpath(root).catch(() => node_path_1.default.resolve(root));
    const parent = node_path_1.default.dirname(canonicalRoot);
    const shouldAdd = await (0, io_js_1.confirm)(`Add ${parent} to bulk update folders? (y/n)`);
    if (!shouldAdd) {
        return false;
    }
    return (await addRepositoryParent(parent)).added;
}
