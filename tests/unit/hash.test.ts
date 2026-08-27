import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { packageHash } from '../../src/util/hash.js';

test('hash: identical packages hash identically', async () => {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-hash-a-'));
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-hash-b-'));
  for (const dir of [a, b]) {
    fs.mkdirSync(path.join(dir, 'references'));
    fs.writeFileSync(path.join(dir, 'SKILL.md'), 'same content\n');
    fs.writeFileSync(path.join(dir, 'references', 'guide.md'), 'guide content\n');
  }
  const ha = await packageHash(a);
  const hb = await packageHash(b);
  assert.equal(ha, hb);
});

test('hash: a changed file changes the hash', async () => {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-hash-c-'));
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-hash-d-'));
  for (const dir of [a, b]) {
    fs.writeFileSync(path.join(dir, 'SKILL.md'), 'same\n');
  }
  fs.writeFileSync(path.join(a, 'SKILL.md'), 'different\n');
  assert.notEqual(await packageHash(a), await packageHash(b));
});

test('hash: ignores Finder metadata files', async () => {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-hash-e-'));
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-hash-f-'));
  for (const dir of [a, b]) {
    fs.writeFileSync(path.join(dir, 'SKILL.md'), 'same\n');
  }
  fs.writeFileSync(path.join(a, '.DS_Store'), 'metadata from one machine\n');
  fs.writeFileSync(path.join(b, '.DS_Store'), 'metadata from another machine\n');
  assert.equal(await packageHash(a), await packageHash(b));
});
