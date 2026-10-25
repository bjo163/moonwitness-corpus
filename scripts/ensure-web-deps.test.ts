import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./ensure-web-deps.mjs', import.meta.url))

function write(file: string) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, '{}\n')
}

/** A throwaway repository root containing only the apps/web files a layout asks for. */
function makeRepo(layout: { marker?: boolean; manifest?: boolean; shim?: boolean }) {
  const root = mkdtempSync(join(tmpdir(), 'mw-web-deps-'))
  const web = join(root, 'apps', 'web')
  mkdirSync(web, { recursive: true })
  writeFileSync(join(web, 'package.json'), '{}\n')
  if (layout.marker) write(join(web, 'node_modules', '.package-lock.json'))
  if (layout.manifest) write(join(web, 'node_modules', 'next', 'package.json'))
  if (layout.shim) write(join(web, 'node_modules', '.bin', 'next.cmd'))
  return root
}

function check(root: string) {
  const run = spawnSync(process.execPath, [script, '--check'], { cwd: root, encoding: 'utf8' })
  return { status: run.status, stderr: run.stderr }
}

test('a complete apps/web install passes the check silently', () => {
  const root = makeRepo({ marker: true, manifest: true, shim: true })
  try {
    const result = check(root)
    assert.equal(result.status, 0)
    assert.equal(result.stderr, '')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a fresh clone reports the missing install instead of the opaque next error', () => {
  const root = makeRepo({})
  try {
    const result = check(root)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /node_modules\/\.package-lock\.json is absent/)
    assert.match(result.stderr, /node_modules\/next\/package\.json is absent/)
    assert.match(result.stderr, /npm ci/)
    // --check must never repair: running npm ci here would create this marker.
    assert.equal(existsSync(join(root, 'apps', 'web', 'node_modules', '.package-lock.json')), false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('an interrupted npm ci is detected through the missing next shim', () => {
  // This is the exact shape that produced "[web] 'next' is not recognized":
  // the next package directory survives, its .bin shim does not.
  const root = makeRepo({ marker: true, manifest: true, shim: false })
  try {
    const result = check(root)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /node_modules\/\.bin\/next is absent/)
    assert.doesNotMatch(result.stderr, /node_modules\/next\/package\.json is absent/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('a missing next package is reported even when the install marker exists', () => {
  const root = makeRepo({ marker: true, manifest: false, shim: true })
  try {
    const result = check(root)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /node_modules\/next\/package\.json is absent/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('running outside the repository root fails with the cwd, not an install', () => {
  const root = mkdtempSync(join(tmpdir(), 'mw-web-deps-'))
  try {
    const result = check(root)
    assert.equal(result.status, 2)
    assert.match(result.stderr, /run this script from the repository root/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
