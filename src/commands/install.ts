import path from 'node:path';
import { findSkill, loadCatalog } from '../catalog/catalog.js';
import { AlsonError } from '../errors.js';
import { installSkill } from '../installer/install.js';
import { currentContext } from '../util/paths.js';
import { offerRepositoryParent } from '../repositories/config.js';

export interface InstallArgs {
  skill: string;
  force: boolean;
  offline: boolean;
}

export async function runInstall(args: InstallArgs): Promise<void> {
  const context = currentContext();
  const catalog = await loadCatalog({ offline: args.offline, context });
  const entry = findSkill(catalog, args.skill);
  if (!entry) {
    throw new AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
  }
  const dir = await installSkill(catalog, entry, { force: args.force }, context);
  console.log(`installed ${entry.name}@${entry.version} to ${dir}`);
  try {
    if (await offerRepositoryParent(context.root)) {
      console.log(`added ${path.dirname(context.root)} to bulk update folders`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`warning: could not save bulk update folder: ${message}`);
  }
}
