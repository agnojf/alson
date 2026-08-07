import assert from 'node:assert/strict';
import test from 'node:test';
import { compareVersions, isValidVersion } from '../../src/util/version.js';

test('isValidVersion accepts semantic versions', () => {
  assert.equal(isValidVersion('1.2.3'), true);
  assert.equal(isValidVersion('0.0.1'), true);
  assert.equal(isValidVersion('1.2.3-beta.1'), true);
  assert.equal(isValidVersion('1.2.3+build5'), true);
});

test('isValidVersion rejects non semantic versions', () => {
  assert.equal(isValidVersion('1.2'), false);
  assert.equal(isValidVersion('1'), false);
  assert.equal(isValidVersion('abc'), false);
  assert.equal(isValidVersion(''), false);
  assert.equal(isValidVersion('1.2.3.4'), false);
});

test('compareVersions orders 1.2.0 before 1.10.0', () => {
  assert.equal(compareVersions('1.2.0', '1.10.0'), -1);
});

test('compareVersions handles equal versions', () => {
  assert.equal(compareVersions('1.2.0', '1.2.0'), 0);
});

test('compareVersions handles descending order', () => {
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
});

test('compareVersions handles partial versions', () => {
  assert.equal(compareVersions('1.2', '1.2.1'), -1);
});
