"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInstall = runInstall;
const node_path_1 = __importDefault(require("node:path"));
const catalog_js_1 = require("../catalog/catalog.js");
const errors_js_1 = require("../errors.js");
const install_js_1 = require("../installer/install.js");
const paths_js_1 = require("../util/paths.js");
const config_js_1 = require("../repositories/config.js");
async function runInstall(args) {
    const context = (0, paths_js_1.currentContext)();
    const catalog = await (0, catalog_js_1.loadCatalog)({ offline: args.offline, context });
    const entry = (0, catalog_js_1.findSkill)(catalog, args.skill);
    if (!entry) {
        throw new errors_js_1.AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
    }
    const dir = await (0, install_js_1.installSkill)(catalog, entry, { force: args.force }, context);
    console.log(`installed ${entry.name}@${entry.version} to ${dir}`);
    try {
        if (await (0, config_js_1.offerRepositoryParent)(context.root)) {
            console.log(`added ${node_path_1.default.dirname(context.root)} to bulk update folders`);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`warning: could not save bulk update folder: ${message}`);
    }
}
