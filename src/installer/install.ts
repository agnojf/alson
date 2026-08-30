import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';
import type { Catalog, CatalogEntry } from '../catalog/catalog.js';
import { bundledSkillsRoot } from '../catalog/catalog.js';
import { materializeSkill } from '../catalog/remote.js';
import { validatePackage } from '../catalog/validate.js';
import { packageHash, listFiles } from '../util/hash.js';
import { confirm, dirExists, removeIfExists } from '../util/io.js';
import { stagingDir, type RepositoryContext } from '../util/paths.js';
import { compareVersions } from '../util/version.js';
import { readState, writeState, type InstallRecord } from '../state/installed.js';
import { readCliVersion, targetDir, targetExists, verifyUnmodified } from './safety.js';
import { copyDirSafe } from './staging.js';

async function stagePackage(
  catalog: Catalog,
  entry: CatalogEntry,
  opts: InstallOptions,
  context?: RepositoryContext
): Promise<string> {
  const src =
    catalog.origin === 'remote' || catalog.origin === 'cache'
      ? await materializeSkill(entry, catalog.offline ?? false, {
          context,
          sharedPackages: opts.sharedPackages
        })
      : path.join(bundledSkillsRoot(), entry.name);
  const manifest = await validatePackage(src, entry.name);
  void manifest;
  const staged = path.join(
    stagingDir(context),
    `${entry.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  await copyDirSafe(src, staged);
  const stagedHash = await packageHash(staged);
  if (stagedHash !== entry.hash) {
    await removeIfExists(staged);
    throw new AlsonError('InvalidPackage', `${entry.name} package is invalid: staged content does not match the catalog hash`);
  }
  return staged;
}

async function recordFor(entry: CatalogEntry, files: string[]): Promise<InstallRecord> {
  return {
    name: entry.name,
    version: entry.version,
    hash: entry.hash,
    cliVersion: await readCliVersion(),
    installedAt: new Date().toISOString(),
    files,
    ...(entry.source ? { source: entry.source } : {})
  };
}

export interface InstallOptions {
  force: boolean;
  sharedPackages?: Map<string, Promise<string>>;
}

export async function installSkill(
  catalog: Catalog,
  entry: CatalogEntry,
  opts: InstallOptions,
  context?: RepositoryContext
): Promise<string> {
  const dir = targetDir(entry.name, context);
  const state = await readState(context);
  const existing = state.installs[entry.name];

  if (targetExists(entry.name, context) && !existing && !opts.force) {
    throw new AlsonError(
      'Unmanaged',
      `${dir} already exists and is not manager-installed. Use --force to replace it`
    );
  }

  const staged = await stagePackage(catalog, entry, opts, context);

  if (targetExists(entry.name, context) && existing && !opts.force) {
    const ok = await confirm(`${entry.name} is already installed (${existing.version}). Overwrite? (y/n)`);
    if (!ok) {
      await removeIfExists(staged);
      throw new AlsonError('Usage', 'install cancelled');
    }
  }

  const backup = path.join(stagingDir(context), `${entry.name}-backup-${Date.now()}`);
  const hadTarget = targetExists(entry.name, context);
  if (hadTarget) {
    await fs.promises.rename(dir, backup);
  }
  await fs.promises.mkdir(path.dirname(dir), { recursive: true });
  try {
    await fs.promises.rename(staged, dir);
  } catch (err) {
    if (hadTarget) {
      await fs.promises.rename(backup, dir);
    }
    throw err;
  }

  const files = await listFiles(dir);
  state.installs[entry.name] = await recordFor(entry, files);
  try {
    await writeState(state, context);
  } catch (err) {
    await removeIfExists(dir);
    if (hadTarget) {
      await fs.promises.rename(backup, dir);
    }
    throw err;
  }
  if (hadTarget) {
    await removeIfExists(backup);
  }
  return dir;
}

export async function updateSkill(
  catalog: Catalog,
  entry: CatalogEntry,
  opts: InstallOptions,
  context?: RepositoryContext
): Promise<string> {
  const state = await readState(context);
  const existing = state.installs[entry.name];
  if (!existing) {
    if (targetExists(entry.name, context)) {
      throw new AlsonError(
        'Unmanaged',
        `${targetDir(entry.name, context)} is not manager-installed. Refusing to update it`
      );
    }
    throw new AlsonError('NotInstalled', `${entry.name} is not installed`);
  }
  if (!opts.force) {
    await verifyUnmodified(entry.name, existing, 'update', context);
  }

  const dir = await installSkill(catalog, entry, { force: true, sharedPackages: opts.sharedPackages }, context);
  return dir;
}

export interface DeleteOptions {
  force: boolean;
}

export async function deleteSkill(
  entryName: string,
  opts: DeleteOptions,
  context?: RepositoryContext
): Promise<string> {
  const state = await readState(context);
  const record = state.installs[entryName];
  const dir = targetDir(entryName, context);
  if (!record) {
    if (targetExists(entryName, context)) {
      throw new AlsonError('Unmanaged', `${dir} is not manager-installed. Refusing to delete it`);
    }
    throw new AlsonError('NotInstalled', `${entryName} is not installed`);
  }
  if (!opts.force) {
    await verifyUnmodified(entryName, record, 'delete', context);
    const ok = await confirm(`Delete ${entryName}@${record.version} from ${dir}? (y/n)`);
    if (!ok) {
      throw new AlsonError('Usage', 'delete cancelled');
    }
  }

  const backup = path.join(stagingDir(context), `${entryName}-delete-${Date.now()}`);
  if (targetExists(entryName, context)) {
    await fs.promises.rename(dir, backup);
  }
  delete state.installs[entryName];
  try {
    await writeState(state, context);
  } catch (err) {
    await removeIfExists(dir);
    if (dirExists(backup)) {
      await fs.promises.rename(backup, dir);
    }
    throw err;
  }
  await removeIfExists(backup);
  return dir;
}

export interface SkillStatus {
  name: string;
  bundledVersion: string;
  installedVersion: string | null;
  description?: string;
  status: string;
}

export async function computeStatuses(
  catalog: Catalog,
  context?: RepositoryContext
): Promise<SkillStatus[]> {
  const state = await readState(context);
  const cliVersion = await readCliVersion();
  const rows: SkillStatus[] = [];
  for (const entry of catalog.skills) {
    const record = state.installs[entry.name];
    let status: string;
    let installedVersion: string | null = null;
    if (entry.minCliVersion && compareVersions(cliVersion, entry.minCliVersion) < 0) {
      status = 'incompatible';
    } else if (!record) {
      status = targetExists(entry.name, context) ? 'unmanaged' : 'not installed';
    } else if (!targetExists(entry.name, context)) {
      status = 'not installed';
      installedVersion = record.version;
    } else {
      installedVersion = record.version;
      const hash = await packageHash(targetDir(entry.name, context));
      if (hash !== record.hash) {
        status = 'modified';
      } else if (record.hash !== entry.hash || compareVersions(record.version, entry.version) < 0) {
        status = 'update available';
      } else {
        status = 'current';
      }
    }
    rows.push({
      name: entry.name,
      bundledVersion: entry.version,
      installedVersion,
      description: entry.description,
      status
    });
  }
  return rows;
}
