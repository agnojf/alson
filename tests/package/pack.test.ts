import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '../../..');

test('package: GitHub installation declares the repository and tracked runtime files', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
    repository?: { url?: string };
    scripts?: { prepare?: string };
  };
  assert.equal(packageJson.repository?.url, 'git+https://github.com/agnojf/alson.git');
  assert.equal(packageJson.scripts?.prepare, undefined);
  assert.equal(fs.existsSync(path.join(repoRoot, 'dist', 'src', 'cli.js')), true);
  assert.equal(fs.existsSync(path.join(repoRoot, 'catalog.json')), true);
});

test('package: npm pack includes the CLI, catalog, and every skill', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-pack-'));
  const stdout = execFileSync('npm', ['pack', '--json', '--pack-destination', tmp], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const parsed = JSON.parse(stdout) as Array<{ filename: string }> | Record<string, { filename: string }>;
  const result = Array.isArray(parsed) ? parsed : Object.values(parsed);
  assert.equal(result.length, 1);
  const tarball = path.join(tmp, result[0].filename);
  assert.equal(fs.existsSync(tarball), true);

  const listing = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
  assert.match(listing, /package\/bin\/alson/);
  assert.match(listing, /package\/dist\/src\/cli\.js/);
  assert.match(listing, /package\/catalog\.json/);
  assert.match(listing, /package\/skills\/project-intake\/SKILL\.md/);
  assert.match(listing, /package\/skills\/project-intake\/skill\.json/);
  assert.match(listing, /package\/skills\/alson-workspace-template\/SKILL\.md/);
  assert.match(listing, /package\/skills\/alson-workspace-template\/skill\.json/);
  assert.match(listing, /package\/skills\/alson-explain\/SKILL\.md/);
  assert.match(listing, /package\/skills\/alson-explain\/skill\.json/);
  assert.match(listing, /package\/skills\/alson-pm-control\/SKILL\.md/);
  assert.match(listing, /package\/skills\/alson-pm-control\/skill\.json/);
});

test('package: generated catalog includes independent skill sources and file inventories', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'catalog.json'), 'utf8')) as {
    version: number;
    skills: Array<{ name: string; source?: string; files?: string[] }>;
  };
  assert.equal(catalog.version, 2);
  const projectIntake = catalog.skills.find((skill) => skill.name === 'project-intake');
  assert.ok(projectIntake);
  assert.match(projectIntake.source ?? '', /raw\.githubusercontent\.com\/agnojf\/alson\/main\/skills\/project-intake/);
  assert.deepEqual(projectIntake.files?.includes('SKILL.md'), true);
  assert.deepEqual(projectIntake.files?.includes('skill.json'), true);
});

test('package: a fresh install of the tarball runs alson --help', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-install-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-home-'));
  execFileSync('npm', ['pack', '--json', '--pack-destination', tmp], { cwd: repoRoot, encoding: 'utf8' });
  const tarball = fs.readdirSync(tmp).find((f) => f.endsWith('.tgz'));
  assert.ok(tarball);

  const prefix = path.join(tmp, 'prefix');
  fs.mkdirSync(prefix);
  execFileSync('npm', ['install', '--prefix', prefix, path.join(tmp, tarball)], { encoding: 'utf8' });

  const help = execFileSync(process.execPath, [path.join(prefix, 'node_modules', '.bin', 'alson'), '--help'], {
    env: { ...process.env, ALSON_HOME: home, ALSON_OFFLINE: '1' },
    encoding: 'utf8'
  });
  assert.match(help, /alson - search, install, delete, and update agent skills/);
  assert.match(help, /update --all-repositories/);
  assert.match(help, /repos add <folder>/);

  const list = execFileSync(process.execPath, [path.join(prefix, 'node_modules', '.bin', 'alson'), 'list'], {
    env: { ...process.env, ALSON_HOME: home, ALSON_OFFLINE: '1' },
    encoding: 'utf8'
  });
  assert.match(list, /project-intake/);
  assert.match(list, /alson-workspace-template/);
  assert.match(list, /alson-explain/);
  assert.match(list, /alson-pm-control/);
});
