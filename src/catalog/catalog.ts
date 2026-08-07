import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';
import { findPackageRoot } from '../util/paths.js';

export interface CatalogEntry {
  name: string;
  version: string;
  description: string;
  path: string;
  hash: string;
  minCliVersion?: string;
}

export interface Catalog {
  version: number;
  skills: CatalogEntry[];
}

export function packageRoot(): string {
  return findPackageRoot(__dirname);
}

export function catalogFile(): string {
  return path.join(packageRoot(), 'catalog.json');
}

export function bundledSkillsRoot(): string {
  return path.join(packageRoot(), 'skills');
}

export async function loadCatalog(): Promise<Catalog> {
  const file = catalogFile();
  let raw: string;
  try {
    raw = await fs.promises.readFile(file, 'utf8');
  } catch {
    throw new AlsonError('CatalogMissing', `catalog not found at ${file}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AlsonError('CatalogMissing', `catalog is invalid at ${file}`);
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as Catalog).version !== 1 ||
    !Array.isArray((parsed as Catalog).skills)
  ) {
    throw new AlsonError('CatalogMissing', `catalog is invalid at ${file}`);
  }
  return parsed as Catalog;
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
