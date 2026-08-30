import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  addRepositoryParent,
  readRepositoryConfig,
  removeRepositoryParent
} from '../../src/repositories/config.js';
import { discoverRepositories } from '../../src/repositories/discovery.js';

test('repository config: add and remove parent folders', async () => {
  const configHome = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-config-'));
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-parent-'));
  const previous = process.env.ALSON_CONFIG_HOME;
  process.env.ALSON_CONFIG_HOME = configHome;
  try {
    const added = await addRepositoryParent(parent);
    assert.equal(added.added, true);
    assert.equal((await readRepositoryConfig()).parents.includes(fs.realpathSync(parent)), true);

    const duplicate = await addRepositoryParent(parent);
    assert.equal(duplicate.added, false);

    const removed = await removeRepositoryParent(parent);
    assert.equal(removed.removed, true);
    assert.deepEqual((await readRepositoryConfig()).parents, []);
  } finally {
    if (previous === undefined) {
      delete process.env.ALSON_CONFIG_HOME;
    } else {
      process.env.ALSON_CONFIG_HOME = previous;
    }
  }
});

test('repository discovery: finds direct child repositories only and deduplicates paths', async () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-discovery-'));
  const direct = path.join(parent, 'direct-repo');
  const worktree = path.join(parent, 'worktree-repo');
  const nested = path.join(parent, 'group', 'nested-repo');
  fs.mkdirSync(path.join(direct, '.git'), { recursive: true });
  fs.mkdirSync(worktree);
  fs.writeFileSync(path.join(worktree, '.git'), 'gitdir: /tmp/worktree\n');
  fs.mkdirSync(path.join(nested, '.git'), { recursive: true });

  const result = await discoverRepositories([parent, parent]);

  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.repositories.map((repository) => repository.root), [
    fs.realpathSync(direct),
    fs.realpathSync(worktree)
  ]);
});
