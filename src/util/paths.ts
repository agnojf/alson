import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';

export function repoRoot(): string {
  let dir = path.resolve(process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new AlsonError(
        'NoRepository',
        `no repository found from ${process.cwd()}. Run alson inside a repository`
      );
    }
    dir = parent;
  }
}

export function baseDir(): string {
  return process.env.ALSON_HOME || repoRoot();
}

export function skillsDir(): string {
  return path.join(baseDir(), '.agents', 'skills');
}

export function stateDir(): string {
  return path.join(baseDir(), '.agents', 'alson');
}

export function stateFile(): string {
  return path.join(stateDir(), 'installed.json');
}

export function stagingDir(): string {
  return path.join(stateDir(), 'staging');
}

export function findPackageRoot(from: string): string {
  let dir = path.resolve(from);
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`package root not found from ${from}`);
    }
    dir = parent;
  }
}
