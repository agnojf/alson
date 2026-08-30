import { findSkill, loadCatalog, type Catalog, type CatalogEntry } from '../catalog/catalog.js';
import { AlsonError } from '../errors.js';
import { computeStatuses, updateSkill } from '../installer/install.js';
import { readState } from '../state/installed.js';
import { confirm } from '../util/io.js';
import { contextForRoot, currentContext, type RepositoryContext } from '../util/paths.js';
import { compareVersions } from '../util/version.js';
import { repositoryParents } from '../repositories/config.js';
import { discoverRepositories, type DiscoveredRepository } from '../repositories/discovery.js';

export interface UpdateArgs {
  skill?: string;
  all: boolean;
  force: boolean;
  offline: boolean;
  allRepositories?: boolean;
  dryRun?: boolean;
  yes?: boolean;
}

export async function runUpdate(args: UpdateArgs): Promise<void> {
  if (args.allRepositories) {
    await runBulkUpdate(args);
    return;
  }

  const context = currentContext();
  const catalog = await loadCatalog({ offline: args.offline, context });

  let targets: string[];
  if (args.skill) {
    if (!findSkill(catalog, args.skill)) {
      throw new AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
    }
    targets = [args.skill];
  } else {
    const rows = await computeStatuses(catalog, context);
    targets = rows
      .filter((r) => (args.all ? r.status !== 'not installed' && r.status !== 'unmanaged' && r.status !== 'incompatible' : r.status === 'update available'))
      .map((r) => r.name);
  }

  let failed = false;
  for (const name of targets) {
    const entry = findSkill(catalog, name);
    if (!entry) {
      continue;
    }
    try {
      const dir = await updateSkill(catalog, entry, { force: args.force }, context);
      console.log(`${name}: updated to ${entry.version} at ${dir}`);
    } catch (err) {
      if (err instanceof AlsonError) {
        if (
          err.code === 'ModifiedInstall' ||
          err.code === 'NotInstalled' ||
          err.code === 'Unmanaged' ||
          err.code === 'SkillUnavailable' ||
          err.code === 'IntegrityMismatch' ||
          err.code === 'InvalidPackage'
        ) {
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

interface PlannedUpdate {
  root: string;
  name: string;
  from: string;
  entry: CatalogEntry;
  context: RepositoryContext;
}

interface PlannedBlock {
  name: string;
  reason: string;
}

interface PlannedNotInstalled {
  name: string;
  reason: 'not installed' | 'unmanaged';
}

interface RepositoryPlan {
  root: string;
  hasManagedSkills: boolean;
  updates: PlannedUpdate[];
  blocked: PlannedBlock[];
  notInstalled: PlannedNotInstalled[];
  current: boolean;
  error?: string;
}

async function planRepository(
  catalog: Catalog,
  repository: DiscoveredRepository,
  args: UpdateArgs
): Promise<RepositoryPlan> {
  const context = contextForRoot(repository.root);
  try {
    const state = await readState(context);
    const rows = await computeStatuses(catalog, context);
    const hasManagedSkills = Object.keys(state.installs).length > 0;
    const plan: RepositoryPlan = {
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

      const modifiedWithUpdate =
        row.status === 'modified' && compareVersions(record.version, entry.version) < 0;
      const forceModified = args.force && row.status === 'modified';
      if (
        row.status === 'update available' ||
        modifiedWithUpdate ||
        forceModified ||
        (args.all && (row.status === 'current' || row.status === 'modified'))
      ) {
        plan.updates.push({ root: repository.root, name: row.name, from: record.version, entry, context });
      } else if (row.status === 'modified') {
        plan.blocked.push({ name: row.name, reason: 'local changes' });
      }
    }

    plan.current = hasManagedSkills && plan.updates.length === 0 && plan.blocked.length === 0 && plan.notInstalled.length === 0;
    return plan;
  } catch (err) {
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

function printPlan(plan: RepositoryPlan, skill: string | undefined): void {
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

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function loadBulkCatalog(
  repositories: DiscoveredRepository[],
  args: UpdateArgs
): Promise<Catalog> {
  if (!args.offline) {
    return loadCatalog({
      offline: false,
      context: contextForRoot(repositories[0].root),
      cache: !args.dryRun
    });
  }

  let bundled: Catalog | undefined;
  let lastError: unknown;
  for (const repository of repositories) {
    try {
      const candidate = await loadCatalog({
        offline: true,
        context: contextForRoot(repository.root),
        cache: false
      });
      if (candidate.origin === 'cache') {
        return candidate;
      }
      bundled ??= candidate;
    } catch (err) {
      lastError = err;
    }
  }
  if (bundled) {
    return bundled;
  }
  throw lastError ?? new AlsonError('CatalogUnavailable', 'skill catalog is unavailable offline. Connect to the internet and retry');
}

async function runBulkUpdate(args: UpdateArgs): Promise<void> {
  const parents = await repositoryParents();
  if (parents.length === 0) {
    throw new AlsonError('Usage', 'no repository parent folders configured. Run alson repos add <folder>');
  }

  const discovery = await discoverRepositories(parents);
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
  if (args.skill && !findSkill(catalog, args.skill)) {
    throw new AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
  }

  const plans = await Promise.all(
    discovery.repositories.map((repository) => planRepository(catalog, repository, args))
  );
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
      throw new AlsonError('Usage', 'bulk update requires --yes in a non-interactive terminal');
    }
    const repositoryCount = new Set(plannedUpdates.map((update) => update.root)).size;
    const ok = await confirm(
      `Update ${plannedUpdates.length} skill${plannedUpdates.length === 1 ? '' : 's'} across ${repositoryCount} repositor${repositoryCount === 1 ? 'y' : 'ies'}? (y/n)`
    );
    if (!ok) {
      throw new AlsonError('Usage', 'bulk update cancelled');
    }
  }

  const sharedPackages = new Map<string, Promise<string>>();
  let updated = 0;
  for (const plan of plans) {
    for (const update of plan.updates) {
      try {
        await updateSkill(
          catalog,
          update.entry,
          { force: args.force, sharedPackages },
          update.context
        );
        console.log(`${update.root}: ${update.name} ${update.from} -> ${update.entry.version} updated`);
        updated += 1;
      } catch (err) {
        const message = errorMessage(err);
        if (err instanceof AlsonError && err.code === 'ModifiedInstall') {
          blocked += 1;
          console.error(`error: ${update.root}: ${update.name} blocked: ${message}`);
        } else {
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
