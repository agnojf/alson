import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';
import { packageHash } from '../util/hash.js';
import { dirExists } from '../util/io.js';
import { findPackageRoot, skillsDir } from '../util/paths.js';
import type { InstallRecord } from '../state/installed.js';

export function targetDir(name: string): string {
  return path.join(skillsDir(), name);
}

export function targetExists(name: string): boolean {
  return dirExists(targetDir(name));
}

export async function verifyUnmodified(name: string, record: InstallRecord, action: 'delete' | 'update'): Promise<void> {
  const dir = targetDir(name);
  if (!dirExists(dir)) {
    return;
  }
  const hash = await packageHash(dir);
  if (hash !== record.hash) {
    const verb = action === 'delete' ? 'delete' : 'update';
    throw new AlsonError('ModifiedInstall', `${name} was modified locally. Use --force to ${verb} it`);
  }
}

export async function readCliVersion(): Promise<string> {
  const root = findPackageRoot(__dirname);
  const pkg = JSON.parse(
    await fs.promises.readFile(path.join(root, 'package.json'), 'utf8')
  ) as { version?: string };
  return pkg.version ?? '0.0.0';
}
