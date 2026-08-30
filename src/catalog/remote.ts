import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';
import { packageHash } from '../util/hash.js';
import { dirExists, removeIfExists } from '../util/io.js';
import { readResource } from '../util/net.js';
import { skillCacheDir, type RepositoryContext } from '../util/paths.js';
import { isSafeRelativePath, validatePackage } from './validate.js';
import type { CatalogEntry } from './catalog.js';

function safeFilePath(file: string): boolean {
  return (
    file.length > 0 &&
    !file.includes('?') &&
    !file.includes('#') &&
    isSafeRelativePath(file)
  );
}

function resourceUrl(source: string, file: string): string {
  if (!safeFilePath(file)) {
    throw new AlsonError('UnsafePath', `package contains an unsafe path: ${file}`);
  }

  let base: URL;
  try {
    base = new URL(source.endsWith('/') ? source : `${source}/`);
  } catch {
    throw new AlsonError('InvalidPackage', `remote source URL is invalid: ${source}`);
  }
  if (base.protocol !== 'https:' && base.protocol !== 'file:') {
    throw new AlsonError('InvalidPackage', `remote source URL uses an unsupported protocol: ${base.protocol}`);
  }
  if (base.protocol === 'file:' && process.env.ALSON_ALLOW_FILE_SOURCE !== '1') {
    throw new AlsonError('InvalidPackage', 'remote source URL must use HTTPS');
  }
  return new URL(file, base).toString();
}

async function validCache(dir: string, entry: CatalogEntry): Promise<boolean> {
  if (!dirExists(dir)) {
    return false;
  }
  try {
    const manifest = await validatePackage(dir, entry.name);
    return manifest.version === entry.version && (await packageHash(dir)) === entry.hash;
  } catch {
    return false;
  }
}

async function materializeToCache(
  entry: CatalogEntry,
  offline: boolean,
  context?: RepositoryContext
): Promise<string> {
  const cache = skillCacheDir(entry.name, entry.version, entry.hash, context);
  if (await validCache(cache, entry)) {
    return cache;
  }
  await removeIfExists(cache);

  if (offline) {
    throw new AlsonError(
      'SkillUnavailable',
      `${entry.name}@${entry.version} is not available offline. Connect to the internet and retry`
    );
  }
  if (!entry.source) {
    throw new AlsonError('InvalidPackage', `${entry.name} package is invalid: remote source is missing`);
  }
  if (!entry.files || entry.files.length === 0) {
    throw new AlsonError('InvalidPackage', `${entry.name} package is invalid: remote file list is missing`);
  }

  const duplicate = new Set<string>();
  for (const file of entry.files) {
    if (!safeFilePath(file)) {
      throw new AlsonError('UnsafePath', `package contains an unsafe path: ${file}`);
    }
    if (duplicate.has(file)) {
      throw new AlsonError('InvalidPackage', `${entry.name} package is invalid: duplicate file ${file}`);
    }
    duplicate.add(file);
  }

  const temporary = `${cache}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await fs.promises.mkdir(temporary, { recursive: true });
    for (const file of entry.files) {
      const target = path.join(temporary, file);
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      let content: Buffer;
      try {
        content = await readResource(resourceUrl(entry.source, file));
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new AlsonError(
          'SkillUnavailable',
          `unable to download ${entry.name}@${entry.version}: ${reason}. Check your internet connection and retry`
        );
      }
      await fs.promises.writeFile(target, content);
    }

    await validatePackage(temporary, entry.name);
    const actualHash = await packageHash(temporary);
    if (actualHash !== entry.hash) {
      throw new AlsonError(
        'IntegrityMismatch',
        `${entry.name}@${entry.version} failed integrity verification`
      );
    }

    await fs.promises.mkdir(path.dirname(cache), { recursive: true });
    await fs.promises.rename(temporary, cache);
    return cache;
  } catch (err) {
    await removeIfExists(temporary);
    if (err instanceof AlsonError) {
      throw err;
    }
    const reason = err instanceof Error ? err.message : String(err);
    throw new AlsonError(
      'SkillUnavailable',
      `unable to cache ${entry.name}@${entry.version}: ${reason}`
    );
  }
}

async function copyToCache(source: string, cache: string): Promise<string> {
  const temporary = `${cache}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await removeIfExists(temporary);
  try {
    await fs.promises.mkdir(path.dirname(cache), { recursive: true });
    await fs.promises.cp(source, temporary, { recursive: true });
    await removeIfExists(cache);
    await fs.promises.rename(temporary, cache);
    return cache;
  } catch (err) {
    await removeIfExists(temporary);
    throw err;
  }
}

export interface MaterializeOptions {
  context?: RepositoryContext;
  sharedPackages?: Map<string, Promise<string>>;
}

export async function materializeSkill(
  entry: CatalogEntry,
  offline: boolean,
  options: MaterializeOptions = {}
): Promise<string> {
  const cache = skillCacheDir(entry.name, entry.version, entry.hash, options.context);
  if (options.sharedPackages) {
    const key = `${entry.name}@${entry.version}:${entry.hash}`;
    let shared = options.sharedPackages.get(key);
    if (!shared) {
      shared = (await validCache(cache, entry))
        ? Promise.resolve(cache)
        : materializeToCache(entry, offline, options.context);
      options.sharedPackages.set(key, shared);
    }
    const source = await shared;
    if (source === cache) {
      return source;
    }
    return copyToCache(source, cache);
  }

  if (await validCache(cache, entry)) {
    return cache;
  }
  return materializeToCache(entry, offline, options.context);
}
