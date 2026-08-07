import fs from 'node:fs';
import path from 'node:path';
import { AlsonError } from '../errors.js';

export async function copyDirSafe(src: string, dest: string): Promise<void> {
  const srcReal = await fs.promises.realpath(src);
  await fs.promises.mkdir(dest, { recursive: true });
  const items = await fs.promises.readdir(src, { withFileTypes: true });
  for (const item of items) {
    const from = path.join(src, item.name);
    const to = path.join(dest, item.name);
    if (item.isSymbolicLink()) {
      const target = await fs.promises.readlink(from);
      const resolved = path.resolve(path.dirname(from), target);
      const resolvedReal = await fs.promises.realpath(resolved);
      if (!resolvedReal.startsWith(srcReal + path.sep)) {
        throw new AlsonError('UnsafePath', `package contains a symbolic link escaping the package: ${item.name}`);
      }
      await fs.promises.symlink(target, to);
    } else if (item.isDirectory()) {
      await copyDirSafe(from, to);
    } else if (item.isFile()) {
      await fs.promises.copyFile(from, to);
    }
  }
}
