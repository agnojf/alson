import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';
import { atomicWriteFile } from '../util/io.js';
import { catalogCacheFile, findPackageRoot } from '../util/paths.js';
import { readResource } from '../util/net.js';

export interface CatalogEntry {
  name: string;
  version: string;
  description: string;
  path: string;
  hash: string;
  minCliVersion?: string;
  source?: string;
  files?: string[];
}

export interface Catalog {
  version: number;
  skills: CatalogEntry[];
  origin?: 'bundled' | 'remote' | 'cache';
  offline?: boolean;
}

export interface CatalogOptions {
  offline?: boolean;
}

export const DEFAULT_CATALOG_URL =
  'https://raw.githubusercontent.com/agnojf/alson/main/catalog.json';

export function packageRoot(): string {
  return findPackageRoot(__dirname);
}

export function catalogFile(): string {
  return path.join(packageRoot(), 'catalog.json');
}

export function bundledSkillsRoot(): string {
  return path.join(packageRoot(), 'skills');
}

function parseCatalog(raw: string, location: string): Catalog {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    ![1, 2].includes((parsed as Catalog).version) ||
    !Array.isArray((parsed as Catalog).skills)
  ) {
    throw new AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
  }

  const catalog = parsed as Catalog;
  const names = new Set<string>();
  for (const entry of catalog.skills) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.name !== 'string' ||
      typeof entry.version !== 'string' ||
      typeof entry.description !== 'string' ||
      typeof entry.path !== 'string' ||
      typeof entry.hash !== 'string'
    ) {
      throw new AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name) || names.has(entry.name)) {
      throw new AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
    }
    names.add(entry.name);
    if (
      path.posix.isAbsolute(entry.path) ||
      entry.path.includes('\\') ||
      entry.path.split('/').some((segment) => segment === '..')
    ) {
      throw new AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
    }
    if (
      (entry.minCliVersion !== undefined && typeof entry.minCliVersion !== 'string') ||
      (entry.source !== undefined && typeof entry.source !== 'string') ||
      (entry.files !== undefined &&
        (!Array.isArray(entry.files) || entry.files.some((f) => typeof f !== 'string')))
    ) {
      throw new AlsonError('CatalogMissing', `catalog is invalid at ${location}`);
    }
  }
  return catalog;
}

async function readCatalogFile(file: string): Promise<Catalog> {
  let raw: string;
  try {
    raw = await fs.promises.readFile(file, 'utf8');
  } catch {
    throw new AlsonError('CatalogMissing', `catalog not found at ${file}`);
  }
  return parseCatalog(raw, file);
}

async function readBundledCatalog(): Promise<Catalog | undefined> {
  try {
    return await readCatalogFile(catalogFile());
  } catch (err) {
    if (err instanceof AlsonError && err.message.startsWith('catalog not found at ')) {
      return undefined;
    }
    throw err;
  }
}

function remoteEntries(catalog: Catalog, catalogUrl: string): Catalog {
  return {
    ...catalog,
    skills: catalog.skills.map((entry) => ({
      ...entry,
      source: entry.source ?? new URL(`${entry.path.replace(/\/$/, '')}/`, catalogUrl).toString()
    }))
  };
}

async function readCachedCatalog(): Promise<Catalog | undefined> {
  try {
    return await readCatalogFile(catalogCacheFile());
  } catch {
    return undefined;
  }
}

export function offlineMode(options: CatalogOptions = {}): boolean {
  return options.offline === true || ['1', 'true', 'yes'].includes((process.env.ALSON_OFFLINE ?? '').toLowerCase());
}

export async function loadCatalog(options: CatalogOptions = {}): Promise<Catalog> {
  const bundled = await readBundledCatalog();
  const offline = offlineMode(options);
  const catalogUrl = process.env.ALSON_CATALOG_URL ?? DEFAULT_CATALOG_URL;
  if (offline) {
    const cached = await readCachedCatalog();
    if (cached) {
      return { ...remoteEntries(cached, catalogUrl), origin: 'cache', offline: true };
    }
    if (bundled) {
      return { ...bundled, origin: 'bundled', offline: true };
    }
    throw new AlsonError(
      'CatalogUnavailable',
      'skill catalog is unavailable offline. Connect to the internet and retry'
    );
  }

  try {
    const raw = (await readResource(catalogUrl)).toString('utf8');
    const remote = remoteEntries(parseCatalog(raw, catalogUrl), catalogUrl);
    try {
      await atomicWriteFile(catalogCacheFile(), raw);
    } catch {
      // The catalog remains usable when the repository cache cannot be written.
    }
    return { ...remote, origin: 'remote', offline: false };
  } catch (err) {
    if (err instanceof AlsonError && err.code === 'CatalogMissing') {
      throw err;
    }
    const cached = await readCachedCatalog();
    if (cached) {
      return { ...remoteEntries(cached, catalogUrl), origin: 'cache', offline: true };
    }
    if (bundled) {
      return { ...bundled, origin: 'bundled', offline: true };
    }
    const reason = err instanceof Error ? `: ${err.message}` : '';
    throw new AlsonError(
      'CatalogUnavailable',
      `unable to load skill catalog from ${catalogUrl}${reason}. Check your internet connection and retry`
    );
  }
}

export function findSkill(catalog: Catalog, name: string): CatalogEntry | undefined {
  return catalog.skills.find((s) => s.name === name);
}

export function searchSkills(catalog: Catalog, query: string): CatalogEntry[] {
  const q = query.toLowerCase();
  return catalog.skills.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  );
}
