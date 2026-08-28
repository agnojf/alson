import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { packageHash, listFiles } from '../../src/util/hash.js';

const repoRoot = path.resolve(__dirname, '../../..');
const cliJs = path.join(repoRoot, 'dist', 'src', 'cli.js');

function run(args: string[], home: string, catalogUrl: string): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execFileSync(process.execPath, [cliJs, ...args], {
      env: {
        ...process.env,
        ALSON_HOME: home,
        ALSON_CATALOG_URL: catalogUrl,
        ALSON_OFFLINE: '',
        ALSON_ALLOW_FILE_SOURCE: '1'
      },
      encoding: 'utf8'
    });
    return { stdout, stderr: '', status: 0 };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', status: e.status ?? 1 };
  }
}

async function writeSkillPackage(root: string, version: string, body: string): Promise<{ hash: string; files: string[] }> {
  const skillDir = path.join(root, 'demo-skill');
  await fs.promises.mkdir(skillDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(skillDir, 'SKILL.md'),
    `---\nname: demo-skill\ndescription: A remote demo skill.\n---\n\n${body}\n`
  );
  await fs.promises.writeFile(
    path.join(skillDir, 'skill.json'),
    JSON.stringify({ name: 'demo-skill', version, description: 'A remote demo skill.' })
  );
  const files = await listFiles(skillDir);
  return { hash: await packageHash(skillDir), files };
}

async function writeCatalog(file: string, packageRoot: string, version: string, hash: string, files: string[]): Promise<void> {
  const source = `${pathToFileURL(path.join(packageRoot, 'demo-skill')).toString()}/`;
  await fs.promises.writeFile(
    file,
    JSON.stringify({
      version: 2,
      skills: [
        {
          name: 'demo-skill',
          version,
          description: 'A remote demo skill.',
          path: 'skills/demo-skill',
          source,
          files,
          hash
        }
      ]
    })
  );
}

test('integration: existing skills update from a remote catalog without updating the CLI', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-remote-home-'));
  const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-remote-skills-'));
  const catalogFile = path.join(remoteRoot, 'catalog.json');

  const first = await writeSkillPackage(remoteRoot, '1.0.0', 'Version one.');
  await writeCatalog(catalogFile, remoteRoot, '1.0.0', first.hash, first.files);
  const catalogUrl = pathToFileURL(catalogFile).toString();

  const install = run(['install', 'demo-skill'], home, catalogUrl);
  assert.equal(install.status, 0);
  assert.match(install.stdout, /installed demo-skill@1\.0\.0/);
  assert.match(fs.readFileSync(path.join(home, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version one/);

  const second = await writeSkillPackage(remoteRoot, '1.1.0', 'Version two.');
  await writeCatalog(catalogFile, remoteRoot, '1.1.0', second.hash, second.files);

  const update = run(['update', 'demo-skill'], home, catalogUrl);
  assert.equal(update.status, 0);
  assert.match(update.stdout, /updated to 1\.1\.0/);
  assert.match(fs.readFileSync(path.join(home, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version two/);

  const state = JSON.parse(
    fs.readFileSync(path.join(home, '.agents', 'alson', 'installed.json'), 'utf8')
  ) as { installs: { 'demo-skill': { version: string; cliVersion: string; source?: string } } };
  assert.equal(state.installs['demo-skill'].version, '1.1.0');
  assert.equal(state.installs['demo-skill'].cliVersion, '0.5.0');
  assert.equal(state.installs['demo-skill'].source?.startsWith('file://'), true);
});

test('integration: cached remote packages can be used offline', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-cache-home-'));
  const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-cache-skills-'));
  const catalogFile = path.join(remoteRoot, 'catalog.json');
  const packageVersion = await writeSkillPackage(remoteRoot, '1.0.0', 'Cached content.');
  await writeCatalog(catalogFile, remoteRoot, '1.0.0', packageVersion.hash, packageVersion.files);
  const catalogUrl = pathToFileURL(catalogFile).toString();

  const install = run(['install', 'demo-skill'], home, catalogUrl);
  assert.equal(install.status, 0);

  const offline = run(['update', 'demo-skill', '--offline'], home, 'file:///does-not-exist/catalog.json');
  assert.equal(offline.status, 0);
  assert.match(offline.stdout, /updated to 1\.0\.0/);
});

test('integration: an uncached remote package fails clearly offline', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-offline-home-'));
  const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-offline-skills-'));
  const catalogFile = path.join(remoteRoot, 'catalog.json');
  const packageVersion = await writeSkillPackage(remoteRoot, '1.0.0', 'Remote only.');
  await writeCatalog(catalogFile, remoteRoot, '1.0.0', packageVersion.hash, packageVersion.files);
  const catalogUrl = pathToFileURL(catalogFile).toString();

  const refresh = run(['list'], home, catalogUrl);
  assert.equal(refresh.status, 0);

  const offlineInstall = run(
    ['install', 'demo-skill', '--offline'],
    home,
    'file:///does-not-exist/catalog.json'
  );
  assert.equal(offlineInstall.status, 1);
  assert.match(offlineInstall.stderr, /not available offline/);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'demo-skill')), false);
});

test('integration: update --all exits nonzero when a skill update fails', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-update-status-home-'));
  const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-update-status-skills-'));
  const catalogFile = path.join(remoteRoot, 'catalog.json');
  const packageVersion = await writeSkillPackage(remoteRoot, '1.0.0', 'Stable content.');
  await writeCatalog(catalogFile, remoteRoot, '1.0.0', packageVersion.hash, packageVersion.files);
  const catalogUrl = pathToFileURL(catalogFile).toString();

  const install = run(['install', 'demo-skill'], home, catalogUrl);
  assert.equal(install.status, 0);

  await writeCatalog(catalogFile, remoteRoot, '1.1.0', '0'.repeat(64), packageVersion.files);
  const update = run(['update', '--all'], home, catalogUrl);
  assert.equal(update.status, 1);
  assert.match(update.stderr, /integrity verification|update of demo-skill failed/);
  assert.match(fs.readFileSync(path.join(home, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Stable content/);
});
