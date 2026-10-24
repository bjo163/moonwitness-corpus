import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { renderReleaseChangelog } from './release-changelog.js'
import { applyReleaseChangePlan, bumpSemver, type ReleaseChangePlan } from './release-versioning.js'

const PLAN_FORMAT = 'moonwitness-release-change-v1'

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mw-release-'))
  await mkdir(path.join(root, 'release/changes/applied'), { recursive: true })
  await mkdir(path.join(root, 'packages/core'), { recursive: true })
  await writeFile(
    path.join(root, 'release/package-contract.json'),
    `${JSON.stringify({
      format: 'moonwitness-package-contract-v1',
      scope: '@moonwitness',
      registry: 'https://registry.npmjs.org/',
      npmPublishEnabled: false,
      packages: [{ path: 'packages/core', name: '@moonwitness/corpus-core' }]
    })}\n`
  )
  await writeFile(
    path.join(root, 'release/corpus-release.json'),
    `${JSON.stringify({ format: 'moonwitness-corpus-release-version-v1', version: '0.1.0', specVersion: '0.1' })}\n`
  )
  await writeFile(
    path.join(root, 'packages/core/package.json'),
    `${JSON.stringify({ name: '@moonwitness/corpus-core', version: '1.2.3' })}\n`
  )
  return root
}

async function writePlan(root: string, name: string, plan: ReleaseChangePlan): Promise<string> {
  const target = path.join(root, 'release/changes', name)
  await writeFile(target, `${JSON.stringify(plan)}\n`)
  return target
}

async function readVersions(root: string): Promise<{ packageVersion: string; corpusVersion: string }> {
  const manifest = JSON.parse(await readFile(path.join(root, 'packages/core/package.json'), 'utf8'))
  const release = JSON.parse(await readFile(path.join(root, 'release/corpus-release.json'), 'utf8'))
  return { packageVersion: manifest.version, corpusVersion: release.version }
}

describe('release gates', () => {
  it('an empty change set never bumps package or corpus versions', async () => {
    const root = await fixture()
    await applyReleaseChangePlan(root, await writePlan(root, 'empty.json', { format: PLAN_FORMAT, summary: 'No-op release check' }))
    assert.deepEqual(await readVersions(root), { packageVersion: '1.2.3', corpusVersion: '0.1.0' })
  })

  it('an invalid plan fails before mutating any version or consuming the plan', async () => {
    const root = await fixture()
    const planPath = await writePlan(root, 'invalid.json', {
      format: PLAN_FORMAT,
      summary: 'Invalid bump',
      packages: { '@moonwitness/corpus-core': 'huge' as never }
    })
    await assert.rejects(() => applyReleaseChangePlan(root, planPath), /Invalid bump/u)
    assert.deepEqual(await readVersions(root), { packageVersion: '1.2.3', corpusVersion: '0.1.0' })
    assert.equal(JSON.parse(await readFile(planPath, 'utf8')).format, PLAN_FORMAT)
  })

  it('reapplying the same plan cannot bump twice', async () => {
    const root = await fixture()
    const planPath = await writePlan(root, 'patch.json', {
      format: PLAN_FORMAT,
      summary: 'Patch release',
      packages: { '@moonwitness/corpus-core': 'patch' },
      corpusRelease: 'patch'
    })
    await applyReleaseChangePlan(root, planPath)
    assert.deepEqual(await readVersions(root), { packageVersion: '1.2.4', corpusVersion: '0.1.1' })
    await assert.rejects(() => applyReleaseChangePlan(root, planPath), /ENOENT/u)
    assert.deepEqual(await readVersions(root), { packageVersion: '1.2.4', corpusVersion: '0.1.1' })
  })

  it('selects independent patch, minor and major versions', () => {
    assert.equal(bumpSemver('1.2.3', 'patch'), '1.2.4')
    assert.equal(bumpSemver('1.2.3', 'minor'), '1.3.0')
    assert.equal(bumpSemver('1.2.3', 'major'), '2.0.0')
  })

  it('renders a deterministic human-readable changelog from pending and applied plans', async () => {
    const root = await fixture()
    await writePlan(root, 'pending.json', {
      format: PLAN_FORMAT,
      summary: 'Add a pending corpus change',
      packages: { '@moonwitness/corpus-core': 'minor' }
    })
    await writeFile(
      path.join(root, 'release/changes/applied/2026-01-01.json'),
      `${JSON.stringify({
        format: PLAN_FORMAT,
        summary: 'Previous corpus correction',
        corpusRelease: 'patch'
      })}\n`
    )

    const first = await renderReleaseChangelog(root)
    const second = await renderReleaseChangelog(root)
    assert.equal(first.markdown, second.markdown)
    assert.equal(first.pendingCount, 1)
    assert.equal(first.appliedCount, 1)
    assert.match(first.markdown, /Add a pending corpus change/u)
    assert.match(first.markdown, /Previous corpus correction/u)
    assert.match(first.markdown, /Current aggregate corpus version: `0\.1\.0`/u)
    assert.doesNotMatch(first.markdown, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/u)
  })

  it('keeps release verification read-only and changelog-checked', async () => {
    const workflow = await readFile(path.resolve('.github/workflows/release.yml'), 'utf8')
    assert.match(workflow, /contents: read/u)
    assert.match(workflow, /pnpm release:changelog:check/u)
    assert.match(workflow, /pnpm release:verify/u)
    assert.doesNotMatch(workflow, /git push|git tag|npm publish|gh release create/u)
  })

  it('keeps GitHub Release publication explicit, idempotent and opt-in', async () => {
    const workflow = await readFile(path.resolve('.github/workflows/publish-browser-db.yml'), 'utf8')
    assert.match(workflow, /default: false/u)
    assert.match(workflow, /if: inputs\.publish == true/u)
    assert.match(workflow, /gh release view/u)
    assert.match(workflow, /--clobber/u)
    assert.doesNotMatch(workflow, /^\s*push:/mu)
  })
})
