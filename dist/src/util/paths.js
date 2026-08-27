"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoRoot = repoRoot;
exports.baseDir = baseDir;
exports.skillsDir = skillsDir;
exports.stateDir = stateDir;
exports.stateFile = stateFile;
exports.stagingDir = stagingDir;
exports.findPackageRoot = findPackageRoot;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
function repoRoot() {
    let dir = node_path_1.default.resolve(process.cwd());
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
function baseDir() {
    return process.env.ALSON_HOME || repoRoot();
}
function skillsDir() {
    return node_path_1.default.join(baseDir(), '.agents', 'skills');
}
function stateDir() {
    return node_path_1.default.join(baseDir(), '.agents', 'alson');
}
function stateFile() {
    return node_path_1.default.join(stateDir(), 'installed.json');
}
function stagingDir() {
    return node_path_1.default.join(stateDir(), 'staging');
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
