"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSearch = runSearch;
const catalog_js_1 = require("../catalog/catalog.js");
const errors_js_1 = require("../errors.js");
const install_js_1 = require("../installer/install.js");
const table_js_1 = require("./table.js");
const list_js_1 = require("./list.js");
async function runSearch(query, options = {}) {
    const catalog = await (0, catalog_js_1.loadCatalog)({ offline: options.offline });
    if (query === undefined || query.trim() === '') {
        await (0, list_js_1.runList)(options);
        return;
    }
    const matches = (0, catalog_js_1.searchSkills)(catalog, query);
    if (matches.length === 0) {
        throw new errors_js_1.AlsonError('Usage', `no skills match "${query}"`);
    }
    const statuses = await (0, install_js_1.computeStatuses)({ version: catalog.version, skills: matches });
    (0, table_js_1.printTable)(['Name', 'Version', 'Description', 'Status'], statuses.map((r) => [r.name, r.bundledVersion, r.description ?? '', r.status]));
}
