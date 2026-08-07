import fs from 'node:fs';
import path from 'node:path';
import { findPackageRoot } from '../src/util/paths.js';
import { atomicWriteFile } from '../src/util/io.js';
import { packageHash } from '../src/util/hash.js';
import { validatePackage } from '../src/catalog/validate.js';

async function main(): Promise<void> {
  const root = findPackageRoot(__dirname);
  const skillsRoot = path.join(root, 'skills');
  const entries = [];

  const items = await fs.promises.readdir(skillsRoot, { withFileTypes: true });
  const dirs = items
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();

  for (const name of dirs) {
    const pkgDir = path.join(skillsRoot, name);
    const manifest = await validatePackage(pkgDir, name);
    const hash = await packageHash(pkgDir);
    const entry: Record<string, string> = {
      name,
      version: manifest.version,
      description: manifest.description,
      path: `skills/${name}`,
      hash
    };
    if (manifest.minCliVersion) {
      entry.minCliVersion = manifest.minCliVersion;
    }
    entries.push(entry);
  }

  const catalog = { version: 1, skills: entries };
  await atomicWriteFile(path.join(root, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  console.log(`catalog: generated ${entries.length} skill(s)`);
}

main().catch((err) => {
  console.error(`catalog generation failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
