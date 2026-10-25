import assert from 'node:assert/strict'
import test from 'node:test'
import { inspectPackage, packWarnings, preflight, summarizePack, type PackageManifest } from './release-preflight.js'

/**
 * The preflight exists because P8-002..006 cannot be closed by publishing: no
 * repository licence has been chosen. It must therefore be strict about what a
 * release needs and honest about why it is not one.
 */
const complete: PackageManifest = {
  name: '@moonwitness/corpus-core', version: '0.1.0', license: 'UNLICENSED-PENDING',
  main: './dist/index.js', types: './dist/index.d.ts', files: ['dist'],
}

test('a complete manifest has no blockers', () => {
  assert.deepEqual(inspectPackage(complete, () => true), {blockers: [], warnings: []})
})

test('identity, licence and entry point are all required', () => {
  const result = inspectPackage({name: 'corpus-core', version: '1.0', private: true}, () => true)
  assert.match(result.blockers.join('; '), /outside the @moonwitness scope/)
  assert.match(result.blockers.join('; '), /marked private/)
  assert.match(result.blockers.join('; '), /not semver/)
  assert.match(result.blockers.join('; '), /no license field/)
  assert.match(result.blockers.join('; '), /no entry point/)
})

test('a declared entry that does not exist is a blocker, not a warning', () => {
  const result = inspectPackage({...complete, exports: {'.': './dist/index.js'}}, specifier => specifier !== './dist/index.js')
  assert.match(result.blockers.join('; '), /entry file missing/)
  assert.match(result.blockers.join('; '), /export target missing/)
})

test('shipping TypeScript source and an unbounded tarball are warnings, not blockers', () => {
  const result = inspectPackage({...complete, main: './src/index.ts', files: []}, () => true)
  assert.deepEqual(result.blockers, [])
  assert.match(result.warnings.join('; '), /TypeScript source/)
  assert.match(result.warnings.join('; '), /files list/)
})

test('the real tree has no publishable package yet, and says why', async () => {
  const checks = await preflight()
  assert.equal(checks.length, 12)
  const srgbl = checks.find(check => check.name === '@moonwitness/srgbl')
  assert.ok(srgbl, 'the srgbl package must be inspected')
  assert.match(srgbl!.blockers.join('; '), /marked private/)
  assert.ok(checks.every(check => check.blockers.length > 0), 'no package may claim to be publishable while the licence is undecided')
})

test('a tarball that would carry tests and sources is reported as such', () => {
  const summary = summarizePack(
    ['package.json', 'src/index.ts', 'src/index.test.ts', 'dist/index.js', 'dist/index.d.ts'],
    900, 4200)
  assert.equal(summary.fileCount, 5)
  assert.deepEqual(summary.testFiles, ['src/index.test.ts'])
  assert.deepEqual(summary.notDist, ['src/index.ts', 'src/index.test.ts'])
})

test('pack warnings name tests always, and stray files only when the manifest is unbounded', () => {
  const summary = summarizePack(['package.json', 'src/index.ts', 'src/index.test.ts'], 900, 4200)
  const unbounded = packWarnings(summary, {name: '@moonwitness/x', version: '0.0.0-research.1'})
  assert.match(unbounded.join('; '), /1 test file\(s\) would ship/)
  assert.match(unbounded.join('; '), /2 file\(s\) outside dist\//)
  const bounded = packWarnings(summary, {name: '@moonwitness/x', version: '0.0.0-research.1', files: ['dist']})
  assert.deepEqual(bounded, ['1 test file(s) would ship: src/index.test.ts'])
})
