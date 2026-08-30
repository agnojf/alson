"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runUpdate = runUpdate;
const catalog_js_1 = require("../catalog/catalog.js");
const errors_js_1 = require("../errors.js");
const install_js_1 = require("../installer/install.js");
const installed_js_1 = require("../state/installed.js");
const io_js_1 = require("../util/io.js");
const paths_js_1 = require("../util/paths.js");
const version_js_1 = require("../util/version.js");
const config_js_1 = require("../repositories/config.js");
const discovery_js_1 = require("../repositories/discovery.js");
async function runUpdate(args) {
    if (args.allRepositories) {
        await runBulkUpdate(args);
        return;
    }
    const context = (0, paths_js_1.currentContext)();
    const catalog = await (0, catalog_js_1.loadCatalog)({ offline: args.offline, context });
    let targets;
    if (args.skill) {
        if (!(0, catalog_js_1.findSkill)(catalog, args.skill)) {
            throw new errors_js_1.AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
        }
        targets = [args.skill];
    }
    else {
        const rows = await (0, install_js_1.computeStatuses)(catalog, context);
        targets = rows
            .filter((r) => (args.all ? r.status !== 'not installed' && r.status !== 'unmanaged' && r.status !== 'incompatible' : r.status === 'update available'))
            .map((r) => r.name);
    }
    let failed = false;
    for (const name of targets) {
        const entry = (0, catalog_js_1.findSkill)(catalog, name);
        if (!entry) {
            continue;
        }
        try {
            const dir = await (0, install_js_1.updateSkill)(catalog, entry, { force: args.force }, context);
            console.log(`${name}: updated to ${entry.version} at ${dir}`);
        }
        catch (err) {
            if (err instanceof errors_js_1.AlsonError) {
                if (err.code === 'ModifiedInstall' ||
                    err.code === 'NotInstalled' ||
                    err.code === 'Unmanaged' ||
                    err.code === 'SkillUnavailable' ||
                    err.code === 'IntegrityMismatch' ||
                    err.code === 'InvalidPackage') {
                    failed = true;
                    console.error(`error: ${err.message}`);
                    continue;
                }
            }
            failed = true;
            console.error(`error: update of ${name} failed; prior version restored`);
        }
    }
    if (failed) {
        process.exitCode = 1;
    }
}
async function planRepository(catalog, repository, args) {
    const context = (0, paths_js_1.contextForRoot)(repository.root);
    try {
        const state = await (0, installed_js_1.readState)(context);
        const rows = await (0, install_js_1.computeStatuses)(catalog, context);
        const hasManagedSkills = Object.keys(state.installs).length > 0;
        const plan = {
            root: repository.root,
            hasManagedSkills,
            updates: [],
            blocked: [],
            notInstalled: [],
            current: false
        };
        for (const row of rows) {
            const entry = catalog.skills.find((skill) => skill.name === row.name);
            const record = state.installs[row.name];
            if (!entry) {
                continue;
            }
            if (args.skill) {
                if (row.name !== args.skill) {
                    continue;
                }
                if (!record) {
                    plan.notInstalled.push({
                        name: row.name,
                        reason: row.status === 'unmanaged' ? 'unmanaged' : 'not installed'
                    });
                    continue;
                }
                if (row.status === 'modified' && !args.force) {
                    plan.blocked.push({ name: row.name, reason: 'local changes' });
                    continue;
                }
                plan.updates.push({ root: repository.root, name: row.name, from: record.version, entry, context });
                continue;
            }
            if (!record) {
                continue;
            }
            if (row.status === 'modified' && !args.force) {
                plan.blocked.push({ name: row.name, reason: 'local changes' });
                continue;
            }
            const modifiedWithUpdate = row.status === 'modified' && (0, version_js_1.compareVersions)(record.version, entry.version) < 0;
            if (row.status === 'update available' ||
                modifiedWithUpdate ||
                (args.all && (row.status === 'current' || row.status === 'modified'))) {
                plan.updates.push({ root: repository.root, name: row.name, from: record.version, entry, context });
            }
            else if (row.status === 'modified') {
                plan.blocked.push({ name: row.name, reason: 'local changes' });
            }
        }
        plan.current = hasManagedSkills && plan.updates.length === 0 && plan.blocked.length === 0 && plan.notInstalled.length === 0;
        return plan;
    }
    catch (err) {
        return {
            root: repository.root,
            hasManagedSkills: false,
            updates: [],
            blocked: [],
            notInstalled: [],
            current: false,
            error: err instanceof Error ? err.message : String(err)
        };
    }
}
function printPlan(plan, skill) {
    if (plan.error) {
        console.log(`${plan.root}: failed: ${plan.error}`);
        return;
    }
    if (!plan.hasManagedSkills) {
        console.log(`${plan.root}: no managed skills`);
        return;
    }
    let printed = false;
    for (const update of plan.updates) {
        console.log(`${plan.root}: ${update.name} ${update.from} -> ${update.entry.version} update available`);
        printed = true;
    }
    for (const blocked of plan.blocked) {
        console.log(`${plan.root}: ${blocked.name} blocked: ${blocked.reason}`);
        printed = true;
    }
    for (const item of plan.notInstalled) {
        console.log(`${plan.root}: ${skill ?? item.name} ${item.reason}`);
        printed = true;
    }
    if (!printed) {
        console.log(`${plan.root}: current`);
    }
}
function errorMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
async function loadBulkCatalog(repositories, args) {
    if (!args.offline) {
        return (0, catalog_js_1.loadCatalog)({
            offline: false,
            context: (0, paths_js_1.contextForRoot)(repositories[0].root),
            cache: !args.dryRun
        });
    }
    let bundled;
    let lastError;
    for (const repository of repositories) {
        try {
            const candidate = await (0, catalog_js_1.loadCatalog)({
                offline: true,
                context: (0, paths_js_1.contextForRoot)(repository.root),
                cache: false
            });
            if (candidate.origin === 'cache') {
                return candidate;
            }
            bundled ??= candidate;
        }
        catch (err) {
            lastError = err;
        }
    }
    if (bundled) {
        return bundled;
    }
    throw lastError ?? new errors_js_1.AlsonError('CatalogUnavailable', 'skill catalog is unavailable offline. Connect to the internet and retry');
}
async function runBulkUpdate(args) {
    const parents = await (0, config_js_1.repositoryParents)();
    if (parents.length === 0) {
        throw new errors_js_1.AlsonError('Usage', 'no repository parent folders configured. Run alson repos add <folder>');
    }
    const discovery = await (0, discovery_js_1.discoverRepositories)(parents);
    for (const issue of discovery.issues) {
        console.error(`warning: ${issue.message}`);
    }
    if (discovery.repositories.length === 0) {
        console.log('No repositories found in the configured parent folders.');
        if (discovery.issues.length > 0) {
            process.exitCode = 1;
        }
        return;
    }
    const catalog = await loadBulkCatalog(discovery.repositories, args);
    if (args.skill && !(0, catalog_js_1.findSkill)(catalog, args.skill)) {
        throw new errors_js_1.AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
    }
    const plans = await Promise.all(discovery.repositories.map((repository) => planRepository(catalog, repository, args)));
    console.log(`Found ${plans.length} repositories.`);
    for (const plan of plans) {
        printPlan(plan, args.skill);
    }
    const plannedUpdates = plans.flatMap((plan) => plan.updates);
    let blocked = plans.reduce((count, plan) => count + plan.blocked.length, 0);
    let failed = discovery.issues.length + plans.filter((plan) => plan.error !== undefined).length;
    if (args.dryRun) {
        console.log('dry run: no changes made');
        if (blocked > 0 || failed > 0) {
            process.exitCode = 1;
        }
        return;
    }
    if (plannedUpdates.length === 0) {
        console.log('No eligible updates found.');
        if (blocked > 0 || failed > 0) {
            process.exitCode = 1;
        }
        return;
    }
    if (!args.yes) {
        if (!process.stdin.isTTY) {
            throw new errors_js_1.AlsonError('Usage', 'bulk update requires --yes in a non-interactive terminal');
        }
        const repositoryCount = new Set(plannedUpdates.map((update) => update.root)).size;
        const ok = await (0, io_js_1.confirm)(`Update ${plannedUpdates.length} skill${plannedUpdates.length === 1 ? '' : 's'} across ${repositoryCount} repositor${repositoryCount === 1 ? 'y' : 'ies'}? (y/n)`);
        if (!ok) {
            throw new errors_js_1.AlsonError('Usage', 'bulk update cancelled');
        }
    }
    const sharedPackages = new Map();
    let updated = 0;
    for (const plan of plans) {
        for (const update of plan.updates) {
            try {
                await (0, install_js_1.updateSkill)(catalog, update.entry, { force: args.force, sharedPackages }, update.context);
                console.log(`${update.root}: ${update.name} ${update.from} -> ${update.entry.version} updated`);
                updated += 1;
            }
            catch (err) {
                const message = errorMessage(err);
                if (err instanceof errors_js_1.AlsonError && err.code === 'ModifiedInstall') {
                    blocked += 1;
                    console.error(`error: ${update.root}: ${update.name} blocked: ${message}`);
                }
                else {
                    failed += 1;
                    console.error(`error: ${update.root}: ${update.name} failed: ${message}`);
                }
            }
        }
    }
    console.log('Summary:');
    console.log(`  updated: ${updated}`);
    console.log(`  current: ${plans.filter((plan) => plan.current).length}`);
    console.log(`  no managed skills: ${plans.filter((plan) => !plan.error && !plan.hasManagedSkills).length}`);
    console.log(`  blocked: ${blocked}`);
    console.log(`  failed: ${failed}`);
    if (blocked > 0 || failed > 0) {
        process.exitCode = 1;
    }
}
