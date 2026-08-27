import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '../../..');

test('package: GitHub installation declares the repository and prepare hook', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
    repository?: { url?: string };
    scripts?: { prepare?: string };
  };
  assert.equal(packageJson.repository?.url, 'git+https://github.com/agnojf/alson.git');
  assert.equal(packageJson.scripts?.prepare, 'npm run build');
});

test('package: npm pack includes the CLI, catalog, and every skill', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-pack-'));
  const stdout = execFileSync('npm', ['pack', '--json', '--pack-destination', tmp], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  const result = JSON.parse(stdout) as Array<{ filename: string }>;
  assert.equal(result.length, 1);
  const tarball = path.join(tmp, result[0].filename);
  assert.equal(fs.existsSync(tarball), true);

  const listing = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
  assert.match(listing, /package\/bin\/alson/);
  assert.match(listing, /package\/dist\/src\/cli\.js/);
  assert.match(listing, /package\/catalog\.json/);
  assert.match(listing, /package\/skills\/project-intake\/SKILL\.md/);
  assert.match(listing, /package\/skills\/project-intake\/skill\.json/);
  assert.match(listing, /package\/skills\/status-report\/SKILL\.md/);
  assert.match(listing, /package\/skills\/status-report\/skill\.json/);
  assert.match(listing, /package\/skills\/alson-explain\/SKILL\.md/);
  assert.match(listing, /package\/skills\/alson-explain\/skill\.json/);
  assert.match(listing, /package\/skills\/alson-pm-control\/SKILL\.md/);
  assert.match(listing, /package\/skills\/alson-pm-control\/skill\.json/);
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
    env: { ...process.env, ALSON_HOME: home },
    encoding: 'utf8'
  });
  assert.match(help, /alson - search, install, delete, and update agent skills/);

  const list = execFileSync(process.execPath, [path.join(prefix, 'node_modules', '.bin', 'alson'), 'list'], {
    env: { ...process.env, ALSON_HOME: home },
    encoding: 'utf8'
  });
  assert.match(list, /project-intake/);
  assert.match(list, /status-report/);
  assert.match(list, /alson-explain/);
  assert.match(list, /alson-pm-control/);
});
