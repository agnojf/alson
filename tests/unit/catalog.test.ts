import assert from 'node:assert/strict';
import test from 'node:test';
import { findSkill, searchSkills, type Catalog } from '../../src/catalog/catalog.js';

const catalog: Catalog = {
  version: 1,
  skills: [
    {
      name: 'project-intake',
      version: '1.0.0',
      description: 'Turns vague requests into structured briefs.',
      path: 'skills/project-intake',
      hash: 'aaa'
    },
    {
      name: 'mits',
      version: '1.2.0',
      description: 'Daily priority planning.',
      path: 'skills/mits',
      hash: 'bbb',
      minCliVersion: '1.0.0'
    }
  ]
};

test('findSkill finds by exact name', () => {
  const entry = findSkill(catalog, 'project-intake');
  assert.equal(entry?.version, '1.0.0');
});

test('findSkill returns undefined for unknown names', () => {
  assert.equal(findSkill(catalog, 'nope'), undefined);
});

test('searchSkills matches names case-insensitively', () => {
  assert.equal(searchSkills(catalog, 'PROJECT-Intake').length, 1);
});

test('searchSkills matches descriptions case-insensitively', () => {
  assert.equal(searchSkills(catalog, 'priority').length, 1);
});

test('searchSkills with no match returns empty', () => {
  assert.equal(searchSkills(catalog, 'zzz').length, 0);
});
