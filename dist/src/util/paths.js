"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoRoot = repoRoot;
exports.contextForRoot = contextForRoot;
exports.currentContext = currentContext;
exports.baseDir = baseDir;
exports.skillsDir = skillsDir;
exports.stateDir = stateDir;
exports.stateFile = stateFile;
exports.stagingDir = stagingDir;
exports.cacheDir = cacheDir;
exports.catalogCacheFile = catalogCacheFile;
exports.skillCacheDir = skillCacheDir;
exports.findPackageRoot = findPackageRoot;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
function repoRoot(from = process.cwd()) {
    let dir = node_path_1.default.resolve(from);
    for (;;) {
        if (node_fs_1.default.existsSync(node_path_1.default.join(dir, '.git'))) {
            return dir;
        }
        const parent = node_path_1.default.dirname(dir);
        if (parent === dir) {
            throw new errors_js_1.AlsonError('NoRepository', `no repository found from ${process.cwd()}. Run alson inside a repository`);
        }
        dir = parent;
    }
}
function contextForRoot(root) {
    return { root: node_path_1.default.resolve(root) };
}
function currentContext() {
    return contextForRoot(process.env.ALSON_HOME || repoRoot());
}
function baseDir(context = currentContext()) {
    return context.root;
}
function skillsDir(context) {
    return node_path_1.default.join(baseDir(context), '.agents', 'skills');
}
function stateDir(context) {
    return node_path_1.default.join(baseDir(context), '.agents', 'alson');
}
function stateFile(context) {
    return node_path_1.default.join(stateDir(context), 'installed.json');
}
function stagingDir(context) {
    return node_path_1.default.join(stateDir(context), 'staging');
}
function cacheDir(context) {
    return node_path_1.default.join(stateDir(context), 'cache');
}
function catalogCacheFile(context) {
    return node_path_1.default.join(cacheDir(context), 'catalog.json');
}
function skillCacheDir(name, version, hash, context) {
    return node_path_1.default.join(cacheDir(context), 'skills', name, `${version}-${hash}`);
}
function findPackageRoot(from) {
    let dir = node_path_1.default.resolve(from);
    for (;;) {
        if (node_fs_1.default.existsSync(node_path_1.default.join(dir, 'package.json'))) {
            return dir;
        }
        const parent = node_path_1.default.dirname(dir);
        if (parent === dir) {
            throw new Error(`package root not found from ${from}`);
        }
        dir = parent;
    }
}
