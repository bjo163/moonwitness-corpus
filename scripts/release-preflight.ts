#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * P8-002..006 preflight: "publish the package" is not one command, and it is not
 * this script's decision either. The repository has no chosen licence
 * (`LICENSES/README.md`), and six packages have no entry point at all, so the
 * honest output is the list of what a release would need — not a publish.
 *
 * `--strict` turns any blocker into a non-zero exit, so a future release pipeline
 * can gate on it once the decisions exist.
 */
export type PackageManifest = Record<string, unknown> & {
  name?: unknown; version?: unknown; private?: unknown; license?: unknown
  main?: unknown; module?: unknown; types?: unknown; exports?: unknown; files?: unknown
}

export type PackageCheck = {name: string; version: string; dir: string; blockers: string[]; warnings: string[]}

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

/** Pure inspection so the rules can be tested without touching the filesystem. */
export function inspectPackage(pkg: PackageManifest, entryExists: (specifier: string) => boolean): {blockers: string[]; warnings: string[]} {
  const blockers: string[] = []
  const warnings: string[] = []
  const name = typeof pkg.name === 'string' ? pkg.name : ''
  if (!name) blockers.push('no package name')
  else if (!name.startsWith('@moonwitness/')) blockers.push('name is outside the @moonwitness scope')
  if (pkg.private === true) blockers.push('marked private')
  if (typeof pkg.version !== 'string' || !SEMVER.test(pkg.version)) blockers.push('version is not semver')
  if (typeof pkg.license !== 'string' || !pkg.license.trim()) blockers.push('no license field (repository licence is undecided)')

  const entries = [pkg.main, pkg.module, pkg.types].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
  if (!entries.length && pkg.exports === undefined) blockers.push('no entry point (main/types/exports)')
  for (const entry of entries) if (!entryExists(entry)) blockers.push('entry file missing: ' + entry)
  if (pkg.exports !== undefined && typeof pkg.exports === 'object') {
    const flat = JSON.stringify(pkg.exports)
    for (const specifier of flat.match(/"\.{1,2}\/[^"]+"/g) ?? []) {
      const value = specifier.slice(1, -1)
      if (!entryExists(value)) blockers.push('export target missing: ' + value)
    }
  }
  if (!Array.isArray(pkg.files) || !pkg.files.length) warnings.push('no files list, so the tarball would include everything')
  if (typeof pkg.main === 'string' && pkg.main.endsWith('.ts')) warnings.push('ships TypeScript source as the entry point')
  return {blockers, warnings}
}

export async function preflight(root = process.cwd(), packageDirs?: readonly string[]): Promise<PackageCheck[]> {
  const dirs = packageDirs ?? ['build', 'cli', 'core', 'corpus', 'ingestion', 'node', 'repository', 'schema', 'sdk', 'server', 'srgbl', 'validator']
  const checks: PackageCheck[] = []
  for (const dir of dirs) {
    const full = resolve(root, 'packages', dir)
    const pkg = JSON.parse(await readFile(join(full, 'package.json'), 'utf8')) as PackageManifest
    // The pure rules run first; file existence is then checked against the real tree.
    const result = inspectPackage(pkg, () => true)
    const missing: string[] = []
    for (const entry of [pkg.main, pkg.module, pkg.types, ...exportTargets(pkg)]) {
      if (typeof entry !== 'string' || !entry) continue
      if (!(await exists(join(full, entry)))) missing.push(entry)
    }
    checks.push({
      name: typeof pkg.name === 'string' ? pkg.name : dir,
      version: typeof pkg.version === 'string' ? pkg.version : '—',
      dir: 'packages/' + dir,
      blockers: [...result.blockers, ...missing.map(entry => 'entry file missing: ' + entry)],
      warnings: result.warnings,
    })
  }
  return checks
}

function exportTargets(pkg: PackageManifest): string[] {
  if (pkg.exports === undefined || typeof pkg.exports !== 'object') return []
  const flat = JSON.stringify(pkg.exports)
  return [...(flat.match(/"\.{1,2}\/[^"]+"/g) ?? [])].map(specifier => specifier.slice(1, -1))
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

export async function main(argv: readonly string[]): Promise<number> {
  const checks = await preflight()
  const publishable = checks.filter(check => check.blockers.length === 0)
  for (const check of checks) {
    console.log((check.blockers.length ? 'BLOCKED ' : 'READY   ') + check.name + '@' + check.version + ' (' + check.dir + ')')
    for (const blocker of check.blockers) console.log('  - ' + blocker)
    for (const warning of check.warnings) console.log('  ! ' + warning)
  }
  console.log('')
  console.log(publishable.length + ' of ' + checks.length + ' packages are publishable as they stand.')
  console.log('A repository-wide licence has not been selected (LICENSES/README.md), so no release may be cut yet.')
  if (argv.includes('--strict') && publishable.length !== checks.length) return 1
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code }).catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
