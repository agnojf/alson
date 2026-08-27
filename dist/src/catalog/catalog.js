"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageRoot = packageRoot;
exports.catalogFile = catalogFile;
exports.bundledSkillsRoot = bundledSkillsRoot;
exports.loadCatalog = loadCatalog;
exports.findSkill = findSkill;
exports.searchSkills = searchSkills;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
const paths_js_1 = require("../util/paths.js");
function packageRoot() {
    return (0, paths_js_1.findPackageRoot)(__dirname);
}
function catalogFile() {
    return node_path_1.default.join(packageRoot(), 'catalog.json');
}
function bundledSkillsRoot() {
    return node_path_1.default.join(packageRoot(), 'skills');
}
async function loadCatalog() {
    const file = catalogFile();
    let raw;
    try {
        raw = await node_fs_1.default.promises.readFile(file, 'utf8');
    }
    catch {
        throw new errors_js_1.AlsonError('CatalogMissing', `catalog not found at ${file}`);
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new errors_js_1.AlsonError('CatalogMissing', `catalog is invalid at ${file}`);
    }
    if (!parsed ||
        typeof parsed !== 'object' ||
        parsed.version !== 1 ||
        !Array.isArray(parsed.skills)) {
        throw new errors_js_1.AlsonError('CatalogMissing', `catalog is invalid at ${file}`);
    }
    return parsed;
}
function findSkill(catalog, name) {
    return catalog.skills.find((s) => s.name === name);
}
function searchSkills(catalog, query) {
    const q = query.toLowerCase();
    return catalog.skills.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
}
