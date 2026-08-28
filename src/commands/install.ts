import { findSkill, loadCatalog } from '../catalog/catalog.js';
import { AlsonError } from '../errors.js';
import { installSkill } from '../installer/install.js';

export interface InstallArgs {
  skill: string;
  force: boolean;
  offline: boolean;
}

export async function runInstall(args: InstallArgs): Promise<void> {
  const catalog = await loadCatalog({ offline: args.offline });
  const entry = findSkill(catalog, args.skill);
  if (!entry) {
    throw new AlsonError('UnknownSkill', `no skill named "${args.skill}" in the catalog`);
  }
  const dir = await installSkill(catalog, entry, { force: args.force });
  console.log(`installed ${entry.name}@${entry.version} to ${dir}`);
}
