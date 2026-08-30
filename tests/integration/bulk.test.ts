import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { listFiles, packageHash } from '../../src/util/hash.js';

const repoRoot = path.resolve(__dirname, '../../..');
const cliJs = path.join(repoRoot, 'dist', 'src', 'cli.js');

function makeRepo(parent: string, name: string): string {
  const repo = path.join(parent, name);
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
  return repo;
}

function run(
  args: string[],
  cwd: string,
  configHome: string,
  catalogUrl: string
): { stdout: string; stderr: string; status: number } {
  try {
    const stdout = execFileSync(process.execPath, [cliJs, ...args], {
      cwd,
      env: {
        ...process.env,
        ALSON_HOME: '',
        ALSON_CONFIG_HOME: configHome,
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

async function writeSkillPackage(
  packageRoot: string,
  version: string,
  body: string
): Promise<{ hash: string; files: string[] }> {
  const skillDir = path.join(packageRoot, 'demo-skill');
  await fs.promises.mkdir(skillDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(skillDir, 'SKILL.md'),
    `---\nname: demo-skill\ndescription: A bulk update test skill.\n---\n\n${body}\n`
  );
  await fs.promises.writeFile(
    path.join(skillDir, 'skill.json'),
    JSON.stringify({ name: 'demo-skill', version, description: 'A bulk update test skill.' })
  );
  return { hash: await packageHash(skillDir), files: await listFiles(skillDir) };
}

async function writeCatalog(
  file: string,
  packageRoot: string,
  version: string,
  hash: string,
  files: string[]
): Promise<void> {
  await fs.promises.writeFile(
    file,
    JSON.stringify({
      version: 2,
      skills: [
        {
          name: 'demo-skill',
          version,
          description: 'A bulk update test skill.',
          path: 'skills/demo-skill',
          source: `${pathToFileURL(path.join(packageRoot, 'demo-skill')).toString()}/`,
          files,
          hash
        }
      ]
    })
  );
}

test('integration: bulk update requires configured parent folders', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-bulk-empty-'));
  const result = run(
    ['update', '--all-repositories', '--dry-run'],
    root,
    path.join(root, 'config'),
    'file:///not-used/catalog.json'
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /no repository parent folders configured/);
});

test('integration: bulk update previews, confirms once, and isolates repositories', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-bulk-'));
  const configHome = path.join(root, 'config');
  const parentA = path.join(root, 'github');
  const parentB = path.join(root, 'work');
  const remoteRoot = path.join(root, 'remote');
  const catalogFile = path.join(remoteRoot, 'catalog.json');
  fs.mkdirSync(parentA, { recursive: true });
  fs.mkdirSync(parentB, { recursive: true });
  fs.mkdirSync(remoteRoot, { recursive: true });

  const repoA = makeRepo(parentA, 'repo-a');
  const repoB = makeRepo(parentB, 'repo-b');
  const emptyRepo = makeRepo(parentB, 'empty-repo');
  const first = await writeSkillPackage(remoteRoot, '1.0.0', 'Version one.');
  await writeCatalog(catalogFile, remoteRoot, '1.0.0', first.hash, first.files);
  const catalogUrl = pathToFileURL(catalogFile).toString();

  assert.equal(run(['repos', 'add', parentA], root, configHome, catalogUrl).status, 0);
  assert.equal(run(['repos', 'add', parentB], root, configHome, catalogUrl).status, 0);
  assert.equal(run(['install', 'demo-skill'], repoA, configHome, catalogUrl).status, 0);
  assert.equal(run(['install', 'demo-skill'], repoB, configHome, catalogUrl).status, 0);

  const second = await writeSkillPackage(remoteRoot, '1.1.0', 'Version two.');
  await writeCatalog(catalogFile, remoteRoot, '1.1.0', second.hash, second.files);

  const preview = run(['update', '--all-repositories', '--dry-run'], root, configHome, catalogUrl);
  assert.equal(preview.status, 0);
  assert.match(preview.stdout, /repo-a: demo-skill 1\.0\.0 -> 1\.1\.0 update available/);
  assert.match(preview.stdout, /repo-b: demo-skill 1\.0\.0 -> 1\.1\.0 update available/);
  assert.match(preview.stdout, /empty-repo: no managed skills/);
  assert.match(preview.stdout, /dry run: no changes made/);
  assert.match(fs.readFileSync(path.join(repoA, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version one/);

  const nonInteractive = run(['update', '--all-repositories'], root, configHome, catalogUrl);
  assert.equal(nonInteractive.status, 1);
  assert.match(nonInteractive.stderr, /requires --yes/);
  assert.match(fs.readFileSync(path.join(repoB, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version one/);

  const update = run(['update', '--all-repositories', '--yes'], root, configHome, catalogUrl);
  assert.equal(update.status, 0);
  assert.match(update.stdout, /updated: 2/);
  assert.match(update.stdout, /no managed skills: 1/);
  assert.match(fs.readFileSync(path.join(repoA, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version two/);
  assert.match(fs.readFileSync(path.join(repoB, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version two/);

  fs.rmSync(
    path.join(repoB, '.agents', 'alson', 'cache', 'skills', 'demo-skill', `1.1.0-${second.hash}`),
    { recursive: true, force: true }
  );
  const offlineReuse = run(
    ['update', '--all-repositories', '--all', '--yes', '--offline'],
    root,
    configHome,
    catalogUrl
  );
  assert.equal(offlineReuse.status, 0);
  assert.equal(
    fs.existsSync(path.join(repoB, '.agents', 'alson', 'cache', 'skills', 'demo-skill', `1.1.0-${second.hash}`)),
    true
  );

  await fs.promises.writeFile(
    path.join(repoA, '.agents', 'skills', 'demo-skill', 'SKILL.md'),
    'local change\n'
  );
  const third = await writeSkillPackage(remoteRoot, '1.2.0', 'Version three.');
  await writeCatalog(catalogFile, remoteRoot, '1.2.0', third.hash, third.files);

  const protectedUpdate = run(['update', '--all-repositories', '--yes'], root, configHome, catalogUrl);
  assert.equal(protectedUpdate.status, 1);
  assert.match(protectedUpdate.stdout, /repo-a: demo-skill blocked: local changes/);
  assert.match(protectedUpdate.stdout, /repo-b: demo-skill 1\.1\.0 -> 1\.2\.0 updated/);
  assert.match(fs.readFileSync(path.join(repoA, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /local change/);
  assert.match(fs.readFileSync(path.join(repoB, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version three/);

  const forcedUpdate = run(['update', '--all-repositories', '--yes', '--force'], root, configHome, catalogUrl);
  assert.equal(forcedUpdate.status, 0);
  assert.match(fs.readFileSync(path.join(repoA, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version three/);
  assert.equal(fs.existsSync(path.join(emptyRepo, '.agents')), false);
});

test('integration: bulk update continues after a repository state failure', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-bulk-failure-'));
  const configHome = path.join(root, 'config');
  const parent = path.join(root, 'repositories');
  const remoteRoot = path.join(root, 'remote');
  const catalogFile = path.join(remoteRoot, 'catalog.json');
  fs.mkdirSync(parent, { recursive: true });
  fs.mkdirSync(remoteRoot, { recursive: true });

  const brokenRepo = makeRepo(parent, 'broken-repo');
  const healthyRepo = makeRepo(parent, 'healthy-repo');
  const first = await writeSkillPackage(remoteRoot, '1.0.0', 'Version one.');
  await writeCatalog(catalogFile, remoteRoot, '1.0.0', first.hash, first.files);
  const catalogUrl = pathToFileURL(catalogFile).toString();

  assert.equal(run(['repos', 'add', parent], root, configHome, catalogUrl).status, 0);
  assert.equal(run(['install', 'demo-skill'], brokenRepo, configHome, catalogUrl).status, 0);
  assert.equal(run(['install', 'demo-skill'], healthyRepo, configHome, catalogUrl).status, 0);

  const second = await writeSkillPackage(remoteRoot, '1.1.0', 'Version two.');
  await writeCatalog(catalogFile, remoteRoot, '1.1.0', second.hash, second.files);
  await fs.promises.writeFile(path.join(brokenRepo, '.agents', 'alson', 'installed.json'), 'corrupt{');

  const result = run(['update', '--all-repositories', '--yes'], root, configHome, catalogUrl);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /broken-repo: failed: installed state is corrupt/);
  assert.match(result.stdout, /healthy-repo: demo-skill 1\.0\.0 -> 1\.1\.0 updated/);
  assert.match(fs.readFileSync(path.join(brokenRepo, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version one/);
  assert.match(fs.readFileSync(path.join(healthyRepo, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /Version two/);
});
