"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const paths_js_1 = require("../src/util/paths.js");
const io_js_1 = require("../src/util/io.js");
const hash_js_1 = require("../src/util/hash.js");
const validate_js_1 = require("../src/catalog/validate.js");
async function main() {
    const root = (0, paths_js_1.findPackageRoot)(__dirname);
    const skillsRoot = node_path_1.default.join(root, 'skills');
    const entries = [];
    const sourceBase = (process.env.ALSON_SKILL_SOURCE_BASE ??
        'https://raw.githubusercontent.com/agnojf/alson/main/skills').replace(/\/+$/, '');
    const items = await node_fs_1.default.promises.readdir(skillsRoot, { withFileTypes: true });
    const dirs = items
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
        .map((d) => d.name)
        .sort();
    for (const name of dirs) {
        const pkgDir = node_path_1.default.join(skillsRoot, name);
        const manifest = await (0, validate_js_1.validatePackage)(pkgDir, name);
        const hash = await (0, hash_js_1.packageHash)(pkgDir);
        const entry = {
            name,
            version: manifest.version,
            description: manifest.description,
            path: `skills/${name}`,
            hash,
            source: `${sourceBase}/${name}`,
            files: await (0, hash_js_1.listFiles)(pkgDir)
        };
        if (manifest.minCliVersion) {
            entry.minCliVersion = manifest.minCliVersion;
        }
        entries.push(entry);
    }
    const catalog = { version: 2, skills: entries };
    await (0, io_js_1.atomicWriteFile)(node_path_1.default.join(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
    console.log(`catalog: generated ${entries.length} skill(s)`);
}
main().catch((err) => {
    console.error(`catalog generation failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
});
