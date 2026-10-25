#!/usr/bin/env node
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const execFile = promisify(execFileCallback)

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

/** What a real tarball would carry, which is not the same question as what the manifest says. */
export type PackSummary = {fileCount: number; size: number; unpackedSize: number; testFiles: string[]; notDist: string[]}

type PackMeasurement = {ok: true; pkg: PackageManifest; summary: PackSummary} | {ok: false; reason: string}

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
  for (const target of exportTargets(pkg)) if (!entryExists(target)) blockers.push('export target missing: ' + target)
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

const ALWAYS_SHIPPED = new Set(['package.json', 'README.md', 'readme.md', 'LICENSE', 'LICENCE'])

/** `npm pack --dry-run` names every file, so "no files list" becomes countable. */
export function summarizePack(files: readonly string[], size: number, unpackedSize: number): PackSummary {
  const testFiles = files.filter(file => /\.test\.(?:[cm]?[jt]sx?)$/.test(file) || /(?:^|\/)tests?\//.test(file))
  // Anything outside dist/ that npm would not ship on its own is a file nobody decided to ship.
  const notDist = files.filter(file => !ALWAYS_SHIPPED.has(file) && !file.startsWith('dist/'))
  return {fileCount: files.length, size, unpackedSize, testFiles, notDist}
}

export function packWarnings(summary: PackSummary, pkg: PackageManifest): string[] {
  const warnings: string[] = []
  if (summary.testFiles.length)
    warnings.push(summary.testFiles.length + ' test file(s) would ship: ' + summary.testFiles.slice(0, 3).join(', '))
  // A manifest that lists its files is expected to agree with the tarball.
  if (!Array.isArray(pkg.files) && summary.notDist.length)
    warnings.push(summary.notDist.length + ' file(s) outside dist/ would ship (' + summary.unpackedSize + ' unpacked bytes)')
  return warnings
}

function exportTargets(pkg: PackageManifest): string[] {
  // Export *keys* look like paths too (`"./key-registry"`), so only the values
  // are targets; matching the serialised object once reported every key as a
  // missing file.
  const targets = new Set<string>()
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      if (node.startsWith('./')) targets.add(node)
      return
    }
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (node && typeof node === 'object') for (const value of Object.values(node)) walk(value)
  }
  walk(pkg.exports)
  return [...targets]
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * Ask npm what it would actually put in the tarball. `--dry-run` is what keeps
 * this honest: nothing is written, and no lifecycle script runs.
 */
async function measurePack(dir: string): Promise<PackMeasurement> {
  const cli = await npmCli()
  const [file, prefix] = cli ? [process.execPath, [cli]] : ['npm', []]
  try {
    const {stdout} = await execFile(file, [...prefix, 'pack', '--dry-run', '--json', '--ignore-scripts'],
      {cwd: resolve(dir), maxBuffer: 8 * 1024 * 1024})
    const parsed = JSON.parse(stdout) as Array<{files?: Array<{path?: unknown}>; size?: unknown; unpackedSize?: unknown}>
    const result = parsed[0]
    if (!result) return {ok: false, reason: 'npm returned no tarball description'}
    const files = (result.files ?? []).map(file => String(file.path ?? '')).filter(Boolean)
    const pkg = JSON.parse(await readFile(join(resolve(dir), 'package.json'), 'utf8')) as PackageManifest
    return {ok: true, pkg, summary: summarizePack(files, Number(result.size ?? 0), Number(result.unpackedSize ?? 0))}
  } catch (error) {
    return {ok: false, reason: error instanceof Error ? error.message.split('\n')[0] : String(error)}
  }
}

/**
 * Locate npm's own entry point, so `--pack` measures the tarball with the same
 * npm on every platform. On Windows `npm` is a `.cmd` shim, which `execFile`
 * refuses to spawn without a shell, and spawning a shell to measure a package is
 * not worth the quoting risk; `null` falls back to a plain `npm` on PATH.
 */
async function npmCli(): Promise<string | null> {
  const cli = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
  return (await exists(cli)) ? cli : null
}

export async function main(argv: readonly string[]): Promise<number> {
  const checks = await preflight()
  const publishable = checks.filter(check => check.blockers.length === 0)
  for (const check of checks) {
    console.log((check.blockers.length ? 'BLOCKED ' : 'READY   ') + check.name + '@' + check.version + ' (' + check.dir + ')')
    for (const blocker of check.blockers) console.log('  - ' + blocker)
    for (const warning of check.warnings) console.log('  ! ' + warning)
  }
  if (argv.includes('--pack')) {
    console.log('')
    console.log('npm pack --dry-run (scripts are not run, nothing is written):')
    for (const check of checks) {
      const measured = await measurePack(check.dir)
      if (!measured.ok) {
        console.log('  ' + check.name + ': pack dry-run failed (' + measured.reason + ')')
        continue
      }
      const {pkg, summary} = measured
      console.log('  ' + check.name + ': ' + summary.fileCount + ' file(s), ' + summary.size + ' packed bytes, ' + summary.unpackedSize + ' unpacked')
      for (const warning of packWarnings(summary, pkg)) console.log('    ! ' + warning)
    }
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
