import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { renderReleaseChangelog } from './release-changelog.js'

const root = process.cwd()
const target = path.join(root, 'CHANGELOG.md')
const check = process.argv.includes('--check')
const { markdown, pendingCount, appliedCount } = await renderReleaseChangelog(root)

if (check) {
  let current = ''
  try {
    current = await readFile(target, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (current !== markdown) {
    console.error('CHANGELOG.md is stale; run pnpm release:changelog and commit the result')
    process.exitCode = 1
  } else {
    console.log(`CHANGELOG.md is current (${pendingCount} pending, ${appliedCount} applied plans)`)
  }
} else {
  await writeFile(target, markdown, 'utf8')
  console.log(`Wrote CHANGELOG.md (${pendingCount} pending, ${appliedCount} applied plans)`)
}
