#!/usr/bin/env node
// apps/web is an independent npm project and is excluded from the pnpm
// workspace ("!apps/web" in pnpm-workspace.yaml), so a root `pnpm install`
// never provides `next`. A partial install then surfaces as the opaque
// "'next' is not recognized as an internal or external command" from
// `pnpm dev`. Fail here with the actual fix instead.
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const manifest = resolve(process.cwd(), 'apps', 'web', 'node_modules', 'next', 'package.json')
const shims = [
  resolve(process.cwd(), 'apps', 'web', 'node_modules', '.bin', 'next'),
  resolve(process.cwd(), 'apps', 'web', 'node_modules', '.bin', 'next.cmd')
]

if (existsSync(manifest) && shims.some(shim => existsSync(shim))) process.exit(0)

const lines = [
  'apps/web dependencies are missing or incomplete (node_modules/next is not installed).',
  'apps/web is an independent npm project, excluded from the pnpm workspace, so a root',
  '`pnpm install` does not install it. Install it once, then re-run `pnpm dev`:',
  '',
  '  cd apps/web',
  '  npm ci',
  '',
  `Checked: ${join('apps', 'web', 'node_modules', 'next', 'package.json')} and node_modules/.bin/next`
]
console.error(lines.join('\n'))
process.exit(1)
