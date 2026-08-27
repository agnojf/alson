"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUpdate = runUpdate;
const catalog_js_1 = require("../catalog/catalog.js");
const errors_js_1 = require("../errors.js");
const install_js_1 = require("../installer/install.js");
async function runUpdate(args) {
    const catalog = await (0, catalog_js_1.loadCatalog)();
    let targets;
    if (args.skill) {
        if (!(0, catalog_js_1.findSkill)(catalog, args.skill)) {
            throw new errors_js_1.AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
        }
        targets = [args.skill];
    }
    else {
        const rows = await (0, install_js_1.computeStatuses)(catalog);
        targets = rows
            .filter((r) => (args.all ? r.status !== 'not installed' && r.status !== 'unmanaged' && r.status !== 'incompatible' : r.status === 'update available'))
            .map((r) => r.name);
    }
    for (const name of targets) {
        const entry = (0, catalog_js_1.findSkill)(catalog, name);
        if (!entry) {
            continue;
        }
        try {
            const dir = await (0, install_js_1.updateSkill)(catalog, entry, { force: args.force });
            console.log(`${name}: updated to ${entry.version} at ${dir}`);
        }
        catch (err) {
            if (err instanceof errors_js_1.AlsonError) {
                if (err.code === 'ModifiedInstall' || err.code === 'NotInstalled' || err.code === 'Unmanaged') {
                    console.error(`error: ${err.message}`);
                    continue;
                }
            }
            console.error(`error: update of ${name} failed; prior version restored`);
        }
    }
}
