import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(__dirname, '../../..');
const cliJs = path.join(repoRoot, 'dist', 'src', 'cli.js');

function makeRepo(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-repo-'));
  fs.mkdirSync(path.join(repo, '.git'));
  return repo;
}

function run(args: string[], cwd: string): { stdout: string; stderr: string; status: number } {
  let stdout = '';
  let stderr = '';
  let status = 0;
  try {
    stdout = execFileSync(process.execPath, [cliJs, ...args], {
      cwd,
      env: { ...process.env, ALSON_HOME: '', ALSON_OFFLINE: '1' },
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

test('integration: install, list, and state are repository-local', () => {
  const repo = makeRepo();
  const res = run(['install', 'project-intake'], repo);
  assert.equal(res.status, 0);
  assert.match(res.stdout, /installed project-intake@1\.0\.0/);
  assert.equal(fs.existsSync(path.join(repo, '.agents', 'skills', 'project-intake', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(repo, '.agents', 'alson', 'installed.json')), true);

  const list = run(['list'], repo);
  assert.equal(list.status, 0);
  assert.match(list.stdout, /current/);
});

test('integration: repositories are isolated', () => {
  const repoA = makeRepo();
  const repoB = makeRepo();

  const installA = run(['install', 'project-intake'], repoA);
  assert.equal(installA.status, 0);
  assert.equal(fs.existsSync(path.join(repoB, '.agents')), false);

  const listB = run(['list'], repoB);
  assert.equal(listB.status, 0);
  assert.match(listB.stdout, /not installed/);

  const installB = run(['install', 'project-intake'], repoB);
  assert.equal(installB.status, 0);

  const deleteA = run(['delete', 'project-intake', '--force'], repoA);
  assert.equal(deleteA.status, 0);
  assert.equal(fs.existsSync(path.join(repoA, '.agents', 'skills', 'project-intake')), false);
  assert.equal(fs.existsSync(path.join(repoB, '.agents', 'skills', 'project-intake')), true);
});

test('integration: running from a subdirectory resolves the repository root', () => {
  const repo = makeRepo();
  const sub = path.join(repo, 'src', 'deep');
  fs.mkdirSync(sub, { recursive: true });

  const res = run(['install', 'project-intake'], sub);
  assert.equal(res.status, 0);
  assert.equal(fs.existsSync(path.join(repo, '.agents', 'skills', 'project-intake', 'SKILL.md')), true);
});

test('integration: outside a repository every command fails', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-norepo-'));
  for (const args of [['list'], ['install', 'project-intake']]) {
    const res = run(args, dir);
    assert.equal(res.status, 1);
    assert.match(res.stderr, /no repository found/);
  }
});
