"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = listFiles;
exports.packageHash = packageHash;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
async function listFiles(dir, rel = '') {
    const out = [];
    const items = await node_fs_1.default.promises.readdir(dir, { withFileTypes: true });
    items.sort((a, b) => a.name.localeCompare(b.name));
    for (const item of items) {
        if (item.name === '.DS_Store')
            continue;
        const rp = rel ? `${rel}/${item.name}` : item.name;
        const full = node_path_1.default.join(dir, item.name);
        if (item.isDirectory()) {
            out.push(...(await listFiles(full, rp)));
        }
        else {
            out.push(rp);
        }
    }
    return out;
}
async function packageHash(root) {
    const files = await listFiles(root);
    const entries = [];
    for (const rel of files) {
        const full = node_path_1.default.join(root, rel);
        const st = await node_fs_1.default.promises.lstat(full);
        if (st.isSymbolicLink()) {
            const target = await node_fs_1.default.promises.readlink(full);
            entries.push(`${rel}:link:${target}`);
        }
        else if (st.isFile()) {
            const buf = await node_fs_1.default.promises.readFile(full);
            const h = (0, node_crypto_1.createHash)('sha256').update(buf).digest('hex');
            entries.push(`${rel}:${h}`);
        }
    }
    return (0, node_crypto_1.createHash)('sha256').update(entries.join('\n')).digest('hex');
}
