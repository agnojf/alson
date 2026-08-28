"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInstall = runInstall;
const catalog_js_1 = require("../catalog/catalog.js");
const errors_js_1 = require("../errors.js");
const install_js_1 = require("../installer/install.js");
async function runInstall(args) {
    const catalog = await (0, catalog_js_1.loadCatalog)({ offline: args.offline });
    const entry = (0, catalog_js_1.findSkill)(catalog, args.skill);
    if (!entry) {
        throw new errors_js_1.AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
    }
    const dir = await (0, install_js_1.installSkill)(catalog, entry, { force: args.force });
    console.log(`installed ${entry.name}@${entry.version} to ${dir}`);
}
