"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRepos = runRepos;
const errors_js_1 = require("../errors.js");
const config_js_1 = require("../repositories/config.js");
async function runRepos(action, input) {
    switch (action) {
        case 'add': {
            if (!input) {
                throw new errors_js_1.AlsonError('Usage', 'repos add requires a parent folder. Run alson --help for usage');
            }
            const result = await (0, config_js_1.addRepositoryParent)(input);
            console.log(`${result.added ? 'added' : 'already configured'} repository parent ${result.path}`);
            return;
        }
        case 'remove': {
            if (!input) {
                throw new errors_js_1.AlsonError('Usage', 'repos remove requires a parent folder. Run alson --help for usage');
            }
            const result = await (0, config_js_1.removeRepositoryParent)(input);
            console.log(`${result.removed ? 'removed' : 'not configured'} repository parent ${result.path}`);
            return;
        }
        case 'list': {
            const parents = await (0, config_js_1.repositoryParents)();
            if (parents.length === 0) {
                console.log('no repository parent folders configured');
                return;
            }
            for (const parent of parents) {
                console.log(parent);
            }
            return;
        }
        default:
            throw new errors_js_1.AlsonError('Usage', 'repos requires add, remove, or list. Run alson --help for usage');
    }
}
