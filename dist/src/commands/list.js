"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runList = runList;
const catalog_js_1 = require("../catalog/catalog.js");
const install_js_1 = require("../installer/install.js");
const table_js_1 = require("./table.js");
async function runList(options = {}) {
    const catalog = await (0, catalog_js_1.loadCatalog)({ offline: options.offline });
    const rows = await (0, install_js_1.computeStatuses)(catalog);
    (0, table_js_1.printTable)(['Name', 'Available', 'Installed', 'Status'], rows.map((r) => [r.name, r.bundledVersion, r.installedVersion ?? '-', r.status]));
}
