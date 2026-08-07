import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function homeDir(): string {
  return process.env.ALSON_HOME || os.homedir();
}

export function skillsDir(): string {
  return path.join(homeDir(), '.agents', 'skills');
}

export function stateDir(): string {
  return path.join(homeDir(), '.agents', 'alson');
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
