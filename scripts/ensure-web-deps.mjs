#!/usr/bin/env node
// apps/web is an independent npm project and is excluded from the pnpm
// workspace ("!apps/web" in pnpm-workspace.yaml), so a root `pnpm install`
// never provides `next`. `npm ci` also deletes node_modules before it installs,
// so an interrupted install leaves a tree that exists but has no `next` binary,
// which `pnpm dev` reports only as the opaque
// "[web] 'next' is not recognized as an internal or external command".
// This script detects that state and repairs it, so `pnpm dev` runs from a
// fresh clone. `--check` reports without touching the filesystem.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'

const checkOnly = process.argv.includes('--check')
const webDir = resolve(process.cwd(), 'apps', 'web')

if (!existsSync(join(webDir, 'package.json'))) {
  console.error('apps/web/package.json is missing: run this script from the repository root.')
  process.exit(2)
}

/** Everything that a usable apps/web install must contain, with the reason it matters. */
function problems() {
  const found = []
  if (!existsSync(join(webDir, 'node_modules', '.package-lock.json')))
    found.push('node_modules/.package-lock.json is absent, so no npm install ever completed')
  if (!existsSync(join(webDir, 'node_modules', 'next', 'package.json')))
    found.push('node_modules/next/package.json is absent, so the next binary does not exist')
  else if (!['next', 'next.cmd'].some(shim => existsSync(join(webDir, 'node_modules', '.bin', shim))))
    found.push('node_modules/.bin/next is absent, so the shell cannot find the next command')
  return found
}

function explain(found, reason) {
  const lines = [reason, ...found.map(reason => '  - ' + reason), '',
    'apps/web is excluded from the pnpm workspace, so a root `pnpm install` never installs it.',
    'The install must be run inside apps/web and must run to completion:',
    '',
    '  cd apps/web',
    '  npm ci',
    '']
  console.error(lines.join('\n'))
}

const initial = problems()
if (!initial.length) process.exit(0)
if (checkOnly) {
  explain(initial, 'apps/web dependencies are missing or incomplete:')
  process.exit(1)
}

explain(initial, 'apps/web dependencies are missing or incomplete; installing them now:')
const install = spawnSync('npm ci', { cwd: webDir, stdio: 'inherit', shell: true })
if (install.error || install.status !== 0) {
  console.error(`\nnpm ci failed inside apps/web (${install.error?.message ?? 'exit ' + install.status}).`)
  process.exit(1)
}

const remaining = problems()
if (remaining.length) {
  explain(remaining, 'npm ci completed but apps/web is still incomplete:')
  process.exit(1)
}
