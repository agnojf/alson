import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';
import { isValidVersion } from '../util/version.js';

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  minCliVersion?: string;
}

export function parseFrontmatter(content: string): Record<string, string> {
  const m = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
  if (!m) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (kv) {
      out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

export function extractReferencePaths(skillMd: string): string[] {
  const paths = new Set<string>();
  const codeRe = /`(references\/[^`\s]+)`/g;
  const linkRe = /\[[^\]]*\]\((references\/[^)\s]+)\)/g;
  for (const m of skillMd.matchAll(codeRe)) {
    paths.add(m[1]);
  }
  for (const m of skillMd.matchAll(linkRe)) {
    paths.add(m[1]);
  }
  return [...paths];
}

function isSafeRelativePath(p: string): boolean {
  if (path.isAbsolute(p)) {
    return false;
  }
  const norm = path.posix.normalize(p);
  if (norm.startsWith('..')) {
    return false;
  }
  return !norm.split('/').some((seg) => seg === '..');
}

export async function validatePackage(pkgDir: string, name: string): Promise<SkillManifest> {
  const invalid = (reason: string): never => {
    throw new AlsonError('InvalidPackage', `${name} package is invalid: ${reason}`);
  };

  const skillMdPath = path.join(pkgDir, 'SKILL.md');
  const skillJsonPath = path.join(pkgDir, 'skill.json');
  if (!fs.existsSync(skillMdPath) || !fs.existsSync(skillJsonPath)) {
    invalid('SKILL.md and skill.json are required');
  }

  const front = parseFrontmatter(await fs.promises.readFile(skillMdPath, 'utf8'));
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(await fs.promises.readFile(skillJsonPath, 'utf8')) as unknown;
  } catch {
    invalid('skill.json is not valid JSON');
  }
  if (rawJson === null || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
    invalid('skill.json must contain an object');
  }
  const manifest = rawJson as Record<string, unknown>;

  const sfName = manifest.name;
  const version = manifest.version;
  if (typeof sfName !== 'string' || sfName !== name) {
    invalid(`skill.json name "${String(sfName)}" does not match folder name "${name}"`);
  }
  if (front.name !== name) {
    invalid(`SKILL.md name "${String(front.name)}" does not match folder name "${name}"`);
  }
  if (typeof front.description !== 'string' || front.description.length === 0) {
    invalid('description is required in SKILL.md frontmatter');
  }
  if (typeof manifest.description !== 'string' || manifest.description.length === 0) {
    invalid('description is required in skill.json');
  }
  if (typeof version !== 'string' || !isValidVersion(version)) {
    invalid(`version "${String(version)}" is not a semantic version`);
  }
  const versionStr = version as string;
  if (manifest.minCliVersion !== undefined) {
    if (typeof manifest.minCliVersion !== 'string' || !isValidVersion(manifest.minCliVersion)) {
      invalid(`minCliVersion "${String(manifest.minCliVersion)}" is not a semantic version`);
    }
  }

  const skillMd = await fs.promises.readFile(skillMdPath, 'utf8');
  for (const ref of extractReferencePaths(skillMd)) {
    if (!isSafeRelativePath(ref)) {
      invalid(`reference path is unsafe: ${ref}`);
    }
    if (!fs.existsSync(path.join(pkgDir, ref))) {
      invalid(`reference not found: ${ref}`);
    }
  }

  const pkgReal = await fs.promises.realpath(pkgDir);
  const stack = [pkgDir];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    const items = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (item.isSymbolicLink()) {
        const real = await fs.promises.realpath(full);
        if (real !== pkgReal && !real.startsWith(pkgReal + path.sep)) {
          invalid(`symbolic link escapes the package: ${item.name}`);
        }
      }
    }
  }

  return {
    name,
    version: versionStr,
    description: String(manifest.description),
    minCliVersion: typeof manifest.minCliVersion === 'string' ? manifest.minCliVersion : undefined
  };
}
