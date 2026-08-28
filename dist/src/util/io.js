"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.atomicWriteFile = atomicWriteFile;
exports.removeIfExists = removeIfExists;
exports.dirExists = dirExists;
exports.fileExists = fileExists;
exports.confirm = confirm;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_readline_1 = __importDefault(require("node:readline"));
async function atomicWriteFile(file, data) {
    const dir = node_path_1.default.dirname(file);
    await node_fs_1.default.promises.mkdir(dir, { recursive: true });
    const tmp = node_path_1.default.join(dir, `.${node_path_1.default.basename(file)}.${process.pid}.${Date.now()}.tmp`);
    await node_fs_1.default.promises.writeFile(tmp, data);
    await node_fs_1.default.promises.rename(tmp, file);
}
async function removeIfExists(p) {
    await node_fs_1.default.promises.rm(p, { recursive: true, force: true });
}
function dirExists(p) {
    try {
        return node_fs_1.default.statSync(p).isDirectory();
    }
    catch {
        return false;
    }
}
function fileExists(p) {
    try {
        return node_fs_1.default.statSync(p).isFile();
    }
    catch {
        return false;
    }
}
async function confirm(prompt) {
    if (!process.stdin.isTTY) {
        return false;
    }
    const rl = node_readline_1.default.createInterface({ input: process.stdin, output: process.stderr });
    const answer = await new Promise((resolve) => {
        rl.question(`${prompt} `, resolve);
    });
    rl.close();
    return ['y', 'yes'].includes(answer.trim().toLowerCase());
}
