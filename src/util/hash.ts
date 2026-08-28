import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export async function listFiles(dir: string, rel = ''): Promise<string[]> {
  const out: string[] = [];
  const items = await fs.promises.readdir(dir, { withFileTypes: true });
  items.sort((a, b) => a.name.localeCompare(b.name));
  for (const item of items) {
    if (item.name === '.DS_Store') continue;
    const rp = rel ? `${rel}/${item.name}` : item.name;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      out.push(...(await listFiles(full, rp)));
    } else {
      out.push(rp);
    }
  }
  return out;
}

export async function packageHash(root: string): Promise<string> {
  const files = await listFiles(root);
  const entries: string[] = [];
  for (const rel of files) {
    const full = path.join(root, rel);
    const st = await fs.promises.lstat(full);
    if (st.isSymbolicLink()) {
      const target = await fs.promises.readlink(full);
      entries.push(`${rel}:link:${target}`);
    } else if (st.isFile()) {
      const buf = await fs.promises.readFile(full);
      const h = createHash('sha256').update(buf).digest('hex');
      entries.push(`${rel}:${h}`);
    }
  }
  return createHash('sha256').update(entries.join('\n')).digest('hex');
}
