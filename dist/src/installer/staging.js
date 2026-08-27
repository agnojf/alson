"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyDirSafe = copyDirSafe;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
async function copyDirSafe(src, dest) {
    const srcReal = await node_fs_1.default.promises.realpath(src);
    await node_fs_1.default.promises.mkdir(dest, { recursive: true });
    const items = await node_fs_1.default.promises.readdir(src, { withFileTypes: true });
    for (const item of items) {
        const from = node_path_1.default.join(src, item.name);
        const to = node_path_1.default.join(dest, item.name);
        if (item.isSymbolicLink()) {
            const target = await node_fs_1.default.promises.readlink(from);
            const resolved = node_path_1.default.resolve(node_path_1.default.dirname(from), target);
            const resolvedReal = await node_fs_1.default.promises.realpath(resolved);
            if (!resolvedReal.startsWith(srcReal + node_path_1.default.sep)) {
                throw new errors_js_1.AlsonError('UnsafePath', `package contains a symbolic link escaping the package: ${item.name}`);
            }
            await node_fs_1.default.promises.symlink(target, to);
        }
        else if (item.isDirectory()) {
            await copyDirSafe(from, to);
        }
        else if (item.isFile()) {
            await node_fs_1.default.promises.copyFile(from, to);
        }
    }
}
