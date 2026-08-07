import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readState, writeState, EMPTY_STATE } from '../../src/state/installed.js';
import { AlsonError } from '../../src/errors.js';

test('state: missing file reads as empty state', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-state-'));
  process.env.ALSON_HOME = home;
  const state = await readState();
  assert.deepEqual(state, EMPTY_STATE);
});

test('state: write then read round-trips', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-state-'));
  process.env.ALSON_HOME = home;
  const state = {
    version: 1 as const,
    installs: {
      mits: {
        name: 'mits',
        version: '1.0.0',
        hash: 'abc',
        cliVersion: '0.1.0',
        installedAt: new Date().toISOString(),
        files: ['SKILL.md']
      }
    }
  };
  await writeState(state);
  const read = await readState();
  assert.deepEqual(read, state);
});

test('state: corrupt file throws StateCorrupt', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-state-'));
  process.env.ALSON_HOME = home;
  fs.mkdirSync(path.join(home, '.agents', 'alson'), { recursive: true });
  fs.writeFileSync(path.join(home, '.agents', 'alson', 'installed.json'), 'not json{');
  await assert.rejects(() => readState(), (err) => {
    assert.ok(err instanceof AlsonError);
    assert.equal(err.code, 'StateCorrupt');
    return true;
  });
});
