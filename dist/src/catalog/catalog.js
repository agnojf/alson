"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CATALOG_URL = void 0;
exports.packageRoot = packageRoot;
exports.catalogFile = catalogFile;
exports.bundledSkillsRoot = bundledSkillsRoot;
exports.offlineMode = offlineMode;
exports.loadCatalog = loadCatalog;
exports.findSkill = findSkill;
exports.searchSkills = searchSkills;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const errors_js_1 = require("../errors.js");
const io_js_1 = require("../util/io.js");
const paths_js_1 = require("../util/paths.js");
const net_js_1 = require("../util/net.js");
exports.DEFAULT_CATALOG_URL = 'https://raw.githubusercontent.com/agnojf/alson/main/catalog.json';
function packageRoot() {
    return (0, paths_js_1.findPackageRoot)(__dirname);
}
function catalogFile() {
    return node_path_1.default.join(packageRoot(), 'catalog.json');
}
function bundledSkillsRoot() {
    return node_path_1.default.join(packageRoot(), 'skills');
}
function parseCatalog(raw, location) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new errors_js_1.AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
    }
    if (!parsed ||
        typeof parsed !== 'object' ||
        ![1, 2].includes(parsed.version) ||
        !Array.isArray(parsed.skills)) {
        throw new errors_js_1.AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
    }
    const catalog = parsed;
    const names = new Set();
    for (const entry of catalog.skills) {
        if (!entry ||
            typeof entry !== 'object' ||
            typeof entry.name !== 'string' ||
            typeof entry.version !== 'string' ||
            typeof entry.description !== 'string' ||
            typeof entry.path !== 'string' ||
            typeof entry.hash !== 'string') {
            throw new errors_js_1.AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name) || names.has(entry.name)) {
            throw new errors_js_1.AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
        }
        names.add(entry.name);
        if (node_path_1.default.posix.isAbsolute(entry.path) ||
            entry.path.includes('\\') ||
            entry.path.split('/').some((segment) => segment === '..')) {
            throw new errors_js_1.AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
        }
        if ((entry.minCliVersion !== undefined && typeof entry.minCliVersion !== 'string') ||
            (entry.source !== undefined && typeof entry.source !== 'string') ||
            (entry.files !== undefined &&
                (!Array.isArray(entry.files) || entry.files.some((f) => typeof f !== 'string')))) {
            throw new errors_js_1.AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
        }
    }
    return catalog;
}
async function readCatalogFile(file) {
    let raw;
    try {
        raw = await node_fs_1.default.promises.readFile(file, 'utf8');
    }
    catch {
        throw new errors_js_1.AlsonError('CatalogMissing', `catalog not found at ${file}`);
    }
    return parseCatalog(raw, file);
}
async function readBundledCatalog() {
    try {
        return await readCatalogFile(catalogFile());
    }
    catch (err) {
        if (err instanceof errors_js_1.AlsonError && err.message.startsWith('catalog not found at ')) {
            return undefined;
        }
        throw err;
    }
}
function remoteEntries(catalog, catalogUrl) {
    return {
        ...catalog,
        skills: catalog.skills.map((entry) => ({
            ...entry,
            source: entry.source ?? new URL(`${entry.path.replace(/\/$/, '')}/`, catalogUrl).toString()
        }))
    };
}
async function readCachedCatalog(context) {
    try {
        return await readCatalogFile((0, paths_js_1.catalogCacheFile)(context));
    }
    catch {
        return undefined;
    }
}
function offlineMode(options = {}) {
    return options.offline === true || ['1', 'true', 'yes'].includes((process.env.ALSON_OFFLINE ?? '').toLowerCase());
}
async function loadCatalog(options = {}) {
    const bundled = await readBundledCatalog();
    const offline = offlineMode(options);
    const catalogUrl = process.env.ALSON_CATALOG_URL ?? exports.DEFAULT_CATALOG_URL;
    if (offline) {
        const cached = await readCachedCatalog(options.context);
        if (cached) {
            return { ...remoteEntries(cached, catalogUrl), origin: 'cache', offline: true };
        }
        if (bundled) {
            return { ...bundled, origin: 'bundled', offline: true };
        }
        throw new errors_js_1.AlsonError('CatalogUnavailable', 'skill catalog is unavailable offline. Connect to the internet and retry');
    }
    try {
        const raw = (await (0, net_js_1.readResource)(catalogUrl)).toString('utf8');
        const remote = remoteEntries(parseCatalog(raw, catalogUrl), catalogUrl);
        if (options.cache !== false) {
            try {
                await (0, io_js_1.atomicWriteFile)((0, paths_js_1.catalogCacheFile)(options.context), raw);
            }
            catch {
                // The catalog remains usable when the repository cache cannot be written.
            }
        }
        return { ...remote, origin: 'remote', offline: false };
    }
    catch (err) {
        if (err instanceof errors_js_1.AlsonError && err.code === 'CatalogMissing') {
            throw err;
        }
        const cached = await readCachedCatalog(options.context);
        if (cached) {
            return { ...remoteEntries(cached, catalogUrl), origin: 'cache', offline: true };
        }
        if (bundled) {
            return { ...bundled, origin: 'bundled', offline: true };
        }
        const reason = err instanceof Error ? `: ${err.message}` : '';
        throw new errors_js_1.AlsonError('CatalogUnavailable', `unable to load skill catalog from ${catalogUrl}${reason}. Check your internet connection and retry`);
    }
}
function findSkill(catalog, name) {
    return catalog.skills.find((s) => s.name === name);
}
function searchSkills(catalog, query) {
    const q = query.toLowerCase();
    return catalog.skills.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
}
