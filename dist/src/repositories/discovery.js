"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverRepositories = discoverRepositories;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
async function isRepository(directory) {
    try {
        await node_fs_1.default.promises.access(node_path_1.default.join(directory, '.git'));
        return true;
    }
    catch {
        return false;
    }
}
async function discoverRepositories(parents) {
    const repositories = [];
    const issues = [];
    const seen = new Set();
    for (const parent of parents) {
        if (await isRepository(parent)) {
            try {
                const root = await node_fs_1.default.promises.realpath(parent);
                if (!seen.has(root)) {
                    seen.add(root);
                    repositories.push({ root, parent });
                }
            }
            catch (err) {
                const reason = err instanceof Error ? `: ${err.message}` : '';
                issues.push({ parent, message: `unable to resolve repository ${parent}${reason}` });
            }
        }
        let entries;
        try {
            entries = await node_fs_1.default.promises.readdir(parent, { withFileTypes: true });
        }
        catch (err) {
            const reason = err instanceof Error ? `: ${err.message}` : '';
            issues.push({ parent, message: `unable to read repository parent ${parent}${reason}` });
            continue;
        }
        entries.sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }
            const candidate = node_path_1.default.join(parent, entry.name);
            if (!(await isRepository(candidate))) {
                continue;
            }
            try {
                const root = await node_fs_1.default.promises.realpath(candidate);
                if (seen.has(root)) {
                    continue;
                }
                seen.add(root);
                repositories.push({ root, parent });
            }
            catch (err) {
                const reason = err instanceof Error ? `: ${err.message}` : '';
                issues.push({ parent: candidate, message: `unable to resolve repository ${candidate}${reason}` });
            }
        }
    }
    repositories.sort((a, b) => a.root.localeCompare(b.root));
    return { repositories, issues };
}
