import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';
import { atomicWriteFile, confirm } from '../util/io.js';

export interface RepositoryConfig {
  version: 1;
  parents: string[];
}

export const EMPTY_REPOSITORY_CONFIG: RepositoryConfig = { version: 1, parents: [] };

export function repositoryConfigFile(): string {
  const configHome =
    process.env.ALSON_CONFIG_HOME || process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(path.resolve(configHome), 'alson', 'config.json');
}

export async function readRepositoryConfig(): Promise<RepositoryConfig> {
  const file = repositoryConfigFile();
  let raw: string;
  try {
    raw = await fs.promises.readFile(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return structuredClone(EMPTY_REPOSITORY_CONFIG);
    }
    throw err;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      (parsed as RepositoryConfig).version !== 1 ||
      !Array.isArray((parsed as RepositoryConfig).parents) ||
      (parsed as RepositoryConfig).parents.some((parent) => typeof parent !== 'string' || !path.isAbsolute(parent))
    ) {
      throw new Error('unexpected configuration shape');
    }
    return {
      version: 1,
      parents: [...new Set((parsed as RepositoryConfig).parents)]
    };
  } catch {
    throw new AlsonError(
      'ConfigCorrupt',
      `repository configuration is corrupt at ${file}. Fix or remove it, then retry`
    );
  }
}

async function canonicalDirectory(input: string): Promise<string> {
  const resolved = path.resolve(input);
  try {
    const stat = await fs.promises.stat(resolved);
    if (!stat.isDirectory()) {
      throw new AlsonError('Usage', `${resolved} is not a directory`);
    }
    return await fs.promises.realpath(resolved);
  } catch (err) {
    if (err instanceof AlsonError) {
      throw err;
    }
    const reason = err instanceof Error ? `: ${err.message}` : '';
    throw new AlsonError('Usage', `unable to access repository parent ${resolved}${reason}`);
  }
}

async function writeRepositoryConfig(config: RepositoryConfig): Promise<void> {
  await atomicWriteFile(repositoryConfigFile(), JSON.stringify(config, null, 2) + '\n');
}

export async function addRepositoryParent(input: string): Promise<{ path: string; added: boolean }> {
  const parent = await canonicalDirectory(input);
  const config = await readRepositoryConfig();
  if (config.parents.includes(parent)) {
    return { path: parent, added: false };
  }
  await writeRepositoryConfig({ version: 1, parents: [...config.parents, parent].sort() });
  return { path: parent, added: true };
}

export async function removeRepositoryParent(input: string): Promise<{ path: string; removed: boolean }> {
  const resolved = path.resolve(input);
  const config = await readRepositoryConfig();
  const canonical = await fs.promises.realpath(resolved).catch(() => resolved);
  const pathToRemove = config.parents.find((parent) => parent === canonical || parent === resolved) ?? canonical;
  if (!config.parents.includes(pathToRemove)) {
    return { path: pathToRemove, removed: false };
  }
  await writeRepositoryConfig({
    version: 1,
    parents: config.parents.filter((parent) => parent !== pathToRemove)
  });
  return { path: pathToRemove, removed: true };
}

export async function repositoryParents(): Promise<string[]> {
  return (await readRepositoryConfig()).parents;
}

export async function isRepositoryConfigured(root: string): Promise<boolean> {
  const config = await readRepositoryConfig();
  const canonicalRoot = await fs.promises.realpath(root).catch(() => path.resolve(root));
  return config.parents.includes(path.dirname(canonicalRoot));
}

export async function offerRepositoryParent(root: string): Promise<boolean> {
  if (!process.stdin.isTTY || (await isRepositoryConfigured(root))) {
    return false;
  }

  const canonicalRoot = await fs.promises.realpath(root).catch(() => path.resolve(root));
  const parent = path.dirname(canonicalRoot);
  const shouldAdd = await confirm(`Add ${parent} to bulk update folders? (y/n)`);
  if (!shouldAdd) {
    return false;
  }
  return (await addRepositoryParent(parent)).added;
}
