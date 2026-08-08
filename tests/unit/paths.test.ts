import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { AlsonError } from '../../src/errors.js';
import { baseDir, repoRoot, skillsDir, stagingDir, stateDir, stateFile } from '../../src/util/paths.js';

test('paths: resolves the nearest ancestor with a .git directory', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-repo-'));
  fs.mkdirSync(path.join(repo, '.git'));
  const sub = path.join(repo, 'a', 'b');
  fs.mkdirSync(sub, { recursive: true });
  const prev = process.cwd();
  try {
    process.chdir(sub);
    const expected = fs.realpathSync(repo);
    assert.equal(repoRoot(), expected);
    assert.equal(skillsDir(), path.join(expected, '.agents', 'skills'));
    assert.equal(stateDir(), path.join(expected, '.agents', 'alson'));
    assert.equal(stateFile(), path.join(expected, '.agents', 'alson', 'installed.json'));
    assert.equal(stagingDir(), path.join(expected, '.agents', 'alson', 'staging'));
  } finally {
    process.chdir(prev);
  }
});

test('paths: fails outside a repository with NoRepository', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-norepo-'));
  const prev = process.cwd();
  try {
    process.chdir(dir);
    assert.throws(() => repoRoot(), (err) => {
      assert.ok(err instanceof AlsonError);
      assert.equal(err.code, 'NoRepository');
      return true;
    });
  } finally {
    process.chdir(prev);
  }
});

test('paths: ALSON_HOME overrides the repository root', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-home-'));
  const prev = process.env.ALSON_HOME;
  process.env.ALSON_HOME = home;
  try {
    assert.equal(baseDir(), home);
    assert.equal(skillsDir(), path.join(home, '.agents', 'skills'));
    assert.equal(stateFile(), path.join(home, '.agents', 'alson', 'installed.json'));
  } finally {
    if (prev === undefined) {
      delete process.env.ALSON_HOME;
    } else {
      process.env.ALSON_HOME = prev;
    }
  }
});
