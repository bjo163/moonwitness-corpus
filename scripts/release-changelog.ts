import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { assertReleaseChangePlan, type ReleaseChangePlan } from './release-versioning.js'

export interface ReleaseChangelog {
  markdown: string
  pendingCount: number
  appliedCount: number
}

interface ChangelogEntry {
  file: string
  plan: ReleaseChangePlan
}

interface CorpusRelease {
  version: string
  specVersion: string
}

async function readPlanDirectory(directory: string): Promise<ChangelogEntry[]> {
  let names: string[]
  try {
    names = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)
      .sort()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  const entries: ChangelogEntry[] = []
  for (const file of names) {
    const raw: unknown = JSON.parse(await readFile(path.join(directory, file), 'utf8'))
    assertReleaseChangePlan(raw)
    entries.push({ file, plan: raw })
  }
  return entries
}

function renderEntries(entries: ChangelogEntry[], prefix: string): string[] {
  if (entries.length === 0) return [`_No ${prefix} release plans._`, '']

  const lines: string[] = []
  for (const { file, plan } of entries) {
    lines.push(`### ${plan.summary}`)
    lines.push(`- Plan: \`release/changes/${prefix === 'applied' ? 'applied/' : ''}${file}\``)
    if (plan.corpusRelease) lines.push(`- Aggregate corpus release: **${plan.corpusRelease}**`)
    const packages = Object.entries(plan.packages ?? {}).sort(([left], [right]) => left.localeCompare(right))
    if (packages.length > 0) {
      lines.push('- Packages:')
      for (const [name, bump] of packages) lines.push(`  - \`${name}\`: **${bump}**`)
    }
    lines.push('')
  }
  return lines
}

/**
 * Render a deterministic, human-readable changelog from the release change
 * plans. The output depends only on checked-in plan files and the aggregate
 * corpus version, so repeated runs on the same commit are byte-identical.
 */
export async function renderReleaseChangelog(root = process.cwd()): Promise<ReleaseChangelog> {
  const releasePath = path.join(root, 'release/corpus-release.json')
  const release = JSON.parse(await readFile(releasePath, 'utf8')) as CorpusRelease
  if (!release.version || !release.specVersion) throw new Error('release/corpus-release.json requires version and specVersion')

  const changesDirectory = path.join(root, 'release/changes')
  const pending = await readPlanDirectory(changesDirectory)
  const applied = await readPlanDirectory(path.join(changesDirectory, 'applied'))

  const lines = [
    '# Changelog',
    '',
    'Generated from `release/changes/` by `pnpm release:changelog`. Package versions remain owned',
    'by package manifests and dataset versions by dataset manifests; this file records aggregate',
    'corpus release change plans.',
    '',
    `Current aggregate corpus version: \`${release.version}\` (spec \`${release.specVersion}\`).`,
    '',
    '## Pending changes',
    '',
    ...renderEntries(pending, 'pending'),
    '## Applied changes',
    '',
    ...renderEntries(applied, 'applied')
  ]

  return {
    markdown: `${lines.join('\n').trimEnd()}\n`,
    pendingCount: pending.length,
    appliedCount: applied.length
  }
}
