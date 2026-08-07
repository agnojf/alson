import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validatePackage } from '../../src/catalog/validate.js';
import { AlsonError } from '../../src/errors.js';

function makePackage(overrides: { name?: string; skillJson?: Record<string, unknown> } = {}): string {
  const name = overrides.name ?? 'demo-skill';
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alson-validate-'));
  const pkg = path.join(dir, name);
  fs.mkdirSync(path.join(pkg, 'references'), { recursive: true });
  fs.writeFileSync(
    path.join(pkg, 'SKILL.md'),
    `---\nname: ${name}\ndescription: A demo skill for validation tests.\n---\n\nRead \`references/guide.md\` for details.\n`
  );
  fs.writeFileSync(path.join(pkg, 'references', 'guide.md'), 'guide\n');
  fs.writeFileSync(
    path.join(pkg, 'skill.json'),
    JSON.stringify({ name, version: '1.0.0', description: 'Demo skill', ...overrides.skillJson })
  );
  return pkg;
}

test('validatePackage accepts a valid package', async () => {
  const pkg = makePackage();
  const manifest = await validatePackage(pkg, 'demo-skill');
  assert.equal(manifest.name, 'demo-skill');
  assert.equal(manifest.version, '1.0.0');
});

test('validatePackage rejects a package missing SKILL.md', async () => {
  const pkg = makePackage();
  fs.rmSync(path.join(pkg, 'SKILL.md'));
  await assert.rejects(() => validatePackage(pkg, 'demo-skill'), (err) => {
    assert.ok(err instanceof AlsonError);
    assert.equal(err.code, 'InvalidPackage');
    return true;
  });
});

test('validatePackage rejects a name mismatch', async () => {
  const pkg = makePackage({ name: 'demo-skill' });
  await assert.rejects(() => validatePackage(pkg, 'other-name'));
});

test('validatePackage rejects a bad version', async () => {
  const pkg = makePackage({ skillJson: { version: '1.0' } });
  await assert.rejects(() => validatePackage(pkg, 'demo-skill'));
});

test('validatePackage rejects a missing reference', async () => {
  const pkg = makePackage();
  fs.writeFileSync(
    path.join(pkg, 'SKILL.md'),
    `---\nname: demo-skill\ndescription: A demo skill.\n---\n\nRead \`references/missing.md\` for details.\n`
  );
  await assert.rejects(() => validatePackage(pkg, 'demo-skill'));
});

test('validatePackage rejects a symlink escaping the package', async () => {
  const pkg = makePackage();
  fs.symlinkSync('/tmp', path.join(pkg, 'escape-link'));
  await assert.rejects(() => validatePackage(pkg, 'demo-skill'));
});
