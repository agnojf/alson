"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFrontmatter = parseFrontmatter;
exports.extractReferencePaths = extractReferencePaths;
exports.isSafeRelativePath = isSafeRelativePath;
exports.validatePackage = validatePackage;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
const version_js_1 = require("../util/version.js");
function parseFrontmatter(content) {
    const m = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
    if (!m) {
        return {};
    }
    const out = {};
    for (const line of m[1].split(/\r?\n/)) {
        const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
        if (kv) {
            out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
        }
    }
    return out;
}
function extractReferencePaths(skillMd) {
    const paths = new Set();
    const codeRe = /`(references\/[^`\s]+)`/g;
    const linkRe = /\[[^\]]*\]\((references\/[^)\s]+)\)/g;
    for (const m of skillMd.matchAll(codeRe)) {
        paths.add(m[1]);
    }
    for (const m of skillMd.matchAll(linkRe)) {
        paths.add(m[1]);
    }
    return [...paths];
}
function isSafeRelativePath(p) {
    if (node_path_1.default.isAbsolute(p) || p.includes('\\')) {
        return false;
    }
    const norm = node_path_1.default.posix.normalize(p);
    if (norm.startsWith('..')) {
        return false;
    }
    return !norm.split('/').some((seg) => seg === '..');
}
async function validatePackage(pkgDir, name) {
    const invalid = (reason) => {
        throw new errors_js_1.AlsonError('InvalidPackage', `${name} package is invalid: ${reason}`);
    };
    const skillMdPath = node_path_1.default.join(pkgDir, 'SKILL.md');
    const skillJsonPath = node_path_1.default.join(pkgDir, 'skill.json');
    if (!node_fs_1.default.existsSync(skillMdPath) || !node_fs_1.default.existsSync(skillJsonPath)) {
        invalid('SKILL.md and skill.json are required');
    }
    const front = parseFrontmatter(await node_fs_1.default.promises.readFile(skillMdPath, 'utf8'));
    let rawJson;
    try {
        rawJson = JSON.parse(await node_fs_1.default.promises.readFile(skillJsonPath, 'utf8'));
    }
    catch {
        invalid('skill.json is not valid JSON');
    }
    if (rawJson === null || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
        invalid('skill.json must contain an object');
    }
    const manifest = rawJson;
    const sfName = manifest.name;
    const version = manifest.version;
    if (typeof sfName !== 'string' || sfName !== name) {
        invalid(`skill.json name "${String(sfName)}" does not match folder name "${name}"`);
    }
    if (front.name !== name) {
        invalid(`SKILL.md name "${String(front.name)}" does not match folder name "${name}"`);
    }
    if (typeof front.description !== 'string' || front.description.length === 0) {
        invalid('description is required in SKILL.md frontmatter');
    }
    if (typeof manifest.description !== 'string' || manifest.description.length === 0) {
        invalid('description is required in skill.json');
    }
    if (typeof version !== 'string' || !(0, version_js_1.isValidVersion)(version)) {
        invalid(`version "${String(version)}" is not a semantic version`);
    }
    const versionStr = version;
    if (manifest.minCliVersion !== undefined) {
        if (typeof manifest.minCliVersion !== 'string' || !(0, version_js_1.isValidVersion)(manifest.minCliVersion)) {
            invalid(`minCliVersion "${String(manifest.minCliVersion)}" is not a semantic version`);
        }
    }
    const skillMd = await node_fs_1.default.promises.readFile(skillMdPath, 'utf8');
    for (const ref of extractReferencePaths(skillMd)) {
        if (!isSafeRelativePath(ref)) {
            invalid(`reference path is unsafe: ${ref}`);
        }
        if (!node_fs_1.default.existsSync(node_path_1.default.join(pkgDir, ref))) {
            invalid(`reference not found: ${ref}`);
        }
    }
    const pkgReal = await node_fs_1.default.promises.realpath(pkgDir);
    const stack = [pkgDir];
    while (stack.length > 0) {
        const dir = stack.pop();
        const items = await node_fs_1.default.promises.readdir(dir, { withFileTypes: true });
        for (const item of items) {
            const full = node_path_1.default.join(dir, item.name);
            if (item.isDirectory()) {
                stack.push(full);
                continue;
            }
            if (item.isSymbolicLink()) {
                const real = await node_fs_1.default.promises.realpath(full);
                if (real !== pkgReal && !real.startsWith(pkgReal + node_path_1.default.sep)) {
                    invalid(`symbolic link escapes the package: ${item.name}`);
                }
            }
        }
    }
    return {
        name,
        version: versionStr,
        description: String(manifest.description),
        minCliVersion: typeof manifest.minCliVersion === 'string' ? manifest.minCliVersion : undefined
    };
}
