import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '../../..');
const cliJs = path.join(repoRoot, 'dist', 'src', 'cli.js');

function run(args: string[], home: string): { stdout: string; stderr: string; status: number } {
  let stdout = '';
  let stderr = '';
  let status = 0;
  try {
    stdout = execFileSync(process.execPath, [cliJs, ...args], {
      env: { ...process.env, ALSON_HOME: home },
      encoding: 'utf8'
    });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    status = e.status ?? 1;
    stdout = e.stdout ?? '';
    stderr = e.stderr ?? '';
  }
  return { stdout, stderr, status };
}

test('integration: full lifecycle against a temp HOME', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-int-'));
  const skillDir = path.join(home, '.agents', 'skills', 'project-intake');

  const listBefore = run(['list'], home);
  assert.equal(listBefore.status, 0);
  assert.match(listBefore.stdout, /not installed/);

  const install = run(['install', 'project-intake'], home);
  assert.equal(install.status, 0);
  assert.match(install.stdout, /installed project-intake@1\.0\.0/);
  assert.equal(fs.existsSync(path.join(skillDir, 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'alson', 'installed.json')), true);

  const listAfter = run(['list'], home);
  assert.equal(listAfter.status, 0);
  assert.match(listAfter.stdout, /current/);

  const search = run(['search', 'brief'], home);
  assert.equal(search.status, 0);
  assert.match(search.stdout, /project-intake/);

  const reinstall = run(['install', 'project-intake', '--force'], home);
  assert.equal(reinstall.status, 0);
  assert.match(reinstall.stdout, /installed/);

  const update = run(['update', 'project-intake'], home);
  assert.equal(update.status, 0);
  assert.match(update.stdout, /updated to 1\.0\.0|current/);

  const modified = fs.writeFileSync(path.join(skillDir, 'LOCAL-NOTE.md'), 'local edit\n');
  void modified;
  const deleteBlocked = run(['delete', 'project-intake'], home);
  assert.equal(deleteBlocked.status, 1);
  assert.match(deleteBlocked.stderr, /modified locally/);

  fs.rmSync(path.join(skillDir, 'LOCAL-NOTE.md'));

  const deleteForced = run(['delete', 'project-intake', '--force'], home);
  assert.equal(deleteForced.status, 0);
  assert.match(deleteForced.stdout, /removed/);
  assert.equal(fs.existsSync(skillDir), false);

  const deleteAgain = run(['delete', 'project-intake'], home);
  assert.equal(deleteAgain.status, 1);
  assert.match(deleteAgain.stderr, /not installed/);
});

test('integration: unknown skill fails with the contract error', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-int-'));
  const res = run(['install', 'does-not-exist'], home);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /no skill named "does-not-exist"/);
});

test('integration: corrupt state fails loudly without destructive action', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-int-'));
  fs.mkdirSync(path.join(home, '.agents', 'alson'), { recursive: true });
  fs.writeFileSync(path.join(home, '.agents', 'alson', 'installed.json'), 'corrupt{');

  const skillDir = path.join(home, '.agents', 'skills', 'project-intake');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'user data\n');

  const res = run(['delete', 'project-intake'], home);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /state is corrupt/);
  assert.equal(fs.existsSync(path.join(skillDir, 'SKILL.md')), true);
});
