import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trimEnd();
const show = (ref, file) => git('show', ref + ':' + file);
const conflicts = git('diff', '--name-only', '--diff-filter=U').trim().split('\n').filter(Boolean).sort();
const expected = [
  '.github/workflows/upstream-sync.yml',
  'apps/api/src/api.test.ts',
  'datasets/registry.json',
  'docs/ROCKSOUL_INTEROP.md',
  'package.json',
].sort();
assert.deepEqual(conflicts, expected, 'Unexpected merge conflicts; fail closed for manual review');

const mainRegistry = JSON.parse(show('origin/main', 'datasets/registry.json'));
const devRegistry = JSON.parse(show('HEAD', 'datasets/registry.json'));
assert.equal(devRegistry.specVersion, mainRegistry.specVersion);
const devById = new Map(devRegistry.datasets.map((x) => [x.id, x]));
assert.equal(devById.size, devRegistry.datasets.length);
for (const item of mainRegistry.datasets) {
  const value = devById.get(item.id);
  assert.ok(value, 'Main dataset missing from dev: ' + item.id);
  for (const [key, data] of Object.entries(item)) {
    assert.deepEqual(value[key], data, 'Main dataset metadata not preserved: ' + item.id + ':' + key);
  }
}

const mainDoc = show('origin/main', 'docs/ROCKSOUL_INTEROP.md');
const devDoc = show('HEAD', 'docs/ROCKSOUL_INTEROP.md');
const newHeadings = mainDoc.slice(mainDoc.indexOf('## Six-domain ecosystem contract'));
assert.ok(newHeadings.startsWith('## Six-domain ecosystem contract'));
assert.ok(devDoc.includes(newHeadings.trimEnd()), 'Main PERSPECTIVE/CORRELATION sections missing');
assert.ok(devDoc.includes('## AWS legal layer'), 'Dev AWS section missing');

const mainPkg = JSON.parse(show('origin/main', 'package.json'));
const devPkg = JSON.parse(show('HEAD', 'package.json'));
assert.equal(mainPkg.packageManager, devPkg.packageManager);
assert.equal(mainPkg.version, devPkg.version);
const changedScripts = Object.keys(mainPkg.scripts).filter((k) => k in devPkg.scripts && mainPkg.scripts[k] !== devPkg.scripts[k]).sort();
assert.deepEqual(changedScripts, ['check', 'test'], 'Unexpected package script divergence');
for (const [name, body] of Object.entries(mainPkg.scripts)) {
  if (!(name in devPkg.scripts)) devPkg.scripts[name] = body;
}
devPkg.engines = mainPkg.engines; // preserve the stricter reviewed main engine contract

for (const path of [
  '.github/workflows/upstream-sync.yml',
  'apps/api/src/api.test.ts',
  'datasets/registry.json',
  'docs/ROCKSOUL_INTEROP.md',
]) {
  writeFileSync(path, show('HEAD', path) + '\n');
}
writeFileSync('package.json', JSON.stringify(devPkg, null, 2) + '\n');
// Both sets of API regression expectations are retained; the new name is
// deliberate to avoid duplicate TypeScript import declarations.
writeFileSync('apps/api/src/api.main-history.test.ts',
  show('origin/main', 'apps/api/src/api.test.ts') + '\n');
git('add', '--', ...expected, 'apps/api/src/api.main-history.test.ts');
const unresolved = git('diff', '--name-only', '--diff-filter=U').trim();
assert.equal(unresolved, '', 'Unresolved Git conflicts still present');
console.log('Five explicit semantic conflict decisions staged locally in temporary runner.');
console.log('Registry: ' + devRegistry.datasets.length + ' IDs with main metadata preserved.');
console.log('API: dev tests and main-history tests retained independently.');
console.log('Package: dev strict check + main-only research steward script preserved.');
console.log('No commit, tag, branch, push or publication executed.');
