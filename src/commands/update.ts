import { findSkill, loadCatalog } from '../catalog/catalog.js';
import { AlsonError } from '../errors.js';
import { computeStatuses, updateSkill } from '../installer/install.js';

export interface UpdateArgs {
  skill?: string;
  all: boolean;
  force: boolean;
  offline: boolean;
}

export async function runUpdate(args: UpdateArgs): Promise<void> {
  const catalog = await loadCatalog({ offline: args.offline });

  let targets: string[];
  if (args.skill) {
    if (!findSkill(catalog, args.skill)) {
      throw new AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
    }
    targets = [args.skill];
  } else {
    const rows = await computeStatuses(catalog);
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
      const dir = await updateSkill(catalog, entry, { force: args.force });
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
