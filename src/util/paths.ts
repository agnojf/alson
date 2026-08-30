import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';

export interface RepositoryContext {
  root: string;
}

export function repoRoot(from: string = process.cwd()): string {
  let dir = path.resolve(from);
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

export function contextForRoot(root: string): RepositoryContext {
  return { root: path.resolve(root) };
}

export function currentContext(): RepositoryContext {
  return contextForRoot(process.env.ALSON_HOME || repoRoot());
}

export function baseDir(context: RepositoryContext = currentContext()): string {
  return context.root;
}

export function skillsDir(context?: RepositoryContext): string {
  return path.join(baseDir(context), '.agents', 'skills');
}

export function stateDir(context?: RepositoryContext): string {
  return path.join(baseDir(context), '.agents', 'alson');
}

export function stateFile(context?: RepositoryContext): string {
  return path.join(stateDir(context), 'installed.json');
}

export function stagingDir(context?: RepositoryContext): string {
  return path.join(stateDir(context), 'staging');
}

export function cacheDir(context?: RepositoryContext): string {
  return path.join(stateDir(context), 'cache');
}

export function catalogCacheFile(context?: RepositoryContext): string {
  return path.join(cacheDir(context), 'catalog.json');
}

export function skillCacheDir(
  name: string,
  version: string,
  hash: string,
  context?: RepositoryContext
): string {
  return path.join(cacheDir(context), 'skills', name, `${version}-${hash}`);
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
