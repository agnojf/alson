"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_util_1 = require("node:util");
const errors_js_1 = require("./errors.js");
const list_js_1 = require("./commands/list.js");
const search_js_1 = require("./commands/search.js");
const install_js_1 = require("./commands/install.js");
const delete_js_1 = require("./commands/delete.js");
const update_js_1 = require("./commands/update.js");
const safety_js_1 = require("./installer/safety.js");
const HELP = `alson - search, install, delete, and update agent skills

Usage:
  alson list                     Show every available skill and its status
  alson search [query]           Search available skills by name or description
  alson install <skill>          Install an available skill
  alson delete <skill>           Remove an installed skill
  alson update [skill]           Update installed skills to available versions
  alson update --all             Update every installed skill
  alson --offline <command>      Use only the local catalog and cache
  alson --version                Print the CLI version
  alson --help                   Show this help

Options:
  --force   Bypass safety checks and confirmations
  --offline Do not access the network
`;
async function main() {
    let values;
    let positionals;
    try {
        const parsed = (0, node_util_1.parseArgs)({
            options: {
                help: { type: 'boolean', short: 'h' },
                version: { type: 'boolean' },
                force: { type: 'boolean', short: 'f' },
                all: { type: 'boolean' },
                offline: { type: 'boolean' }
            },
            allowPositionals: true,
            strict: true
        });
        values = parsed.values;
        positionals = parsed.positionals;
    }
    catch {
        throw new errors_js_1.AlsonError('Usage', `unknown option. Run alson --help for usage`);
    }
    if (values.version) {
        console.log(await (0, safety_js_1.readCliVersion)());
        return;
    }
    if (values.help) {
        process.stdout.write(HELP);
        return;
    }
    const [command, ...rest] = positionals;
    switch (command) {
        case undefined:
            process.stdout.write(HELP);
            return;
        case 'list':
            await (0, list_js_1.runList)({ offline: !!values.offline });
            return;
        case 'search':
            await (0, search_js_1.runSearch)(rest[0], { offline: !!values.offline });
            return;
        case 'install': {
            const skill = rest[0];
            if (!skill) {
                throw new errors_js_1.AlsonError('Usage', `install requires a skill name. Run alson --help for usage`);
            }
            await (0, install_js_1.runInstall)({ skill, force: !!values.force, offline: !!values.offline });
            return;
        }
        case 'delete': {
            const skill = rest[0];
            if (!skill) {
                throw new errors_js_1.AlsonError('Usage', `delete requires a skill name. Run alson --help for usage`);
            }
            await (0, delete_js_1.runDelete)({ skill, force: !!values.force });
            return;
        }
        case 'update': {
            await (0, update_js_1.runUpdate)({
                skill: rest[0],
                all: !!values.all,
                force: !!values.force,
                offline: !!values.offline
            });
            return;
        }
        default:
            throw new errors_js_1.AlsonError('UnknownCommand', `unknown command "${command}". Run alson --help for usage`);
    }
}
main().catch((err) => {
    if (err instanceof errors_js_1.AlsonError) {
        console.error(`error: ${err.message}`);
    }
    else {
        console.error(`error: unexpected failure: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exitCode = 1;
});
