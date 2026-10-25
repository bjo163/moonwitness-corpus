import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  assertPublishable, main, readCorpusHash, sealDocument, verifySealed, writeSealed, type SealDocument,
} from './key-witness-seal.js'

/** The one document a person can copy when writing a real one. */
const FIXTURE = fileURLToPath(new URL('../fixtures/key-witness/seal-document.json', import.meta.url))

/**
 * The CLI is the only way an index reaches `dist/key-witness/index.json`, so these
 * tests cover the two ways it could go wrong: sealing a document the API would
 * refuse, and letting a synthetic fixture become the served index.
 */
const HASH = 'a'.repeat(64)
const LICENSE = {kind: 'original-creative', attestedBy: 'mw:agent:curator', licenseId: 'CC-BY-4.0'} as const

function document(overrides: Partial<SealDocument> = {}): SealDocument {
  const passageId = 'mw:passage:islam:quran:2:286'
  const key = {
    id: 'mw:assessment:key:islam-quran-2-286:1', key: 'hope', scheme: 'semantic-core:v0',
    method: 'srgbl-v8:key-direction:v0', assessor: 'mw:agent:a', reviewStatus: 'reviewed' as const,
  }
  return {
    methodVersion: 'srgbl-v8:key-direction:v0',
    deepLinkBase: 'https://moonwitness.example/app/',
    entries: [{
      passageId,
      editionId: 'mw:edition:synthetic:test-witness',
      artifactId: 'mw:artifact:synthetic:test-leaf',
      contentId: 'mw:content:synthetic:test-witness:ar',
      textRights: 'restricted',
      annotationLicense: LICENSE,
      keys: [key],
      messages: [{
        id: 'mw:message:islam-quran-2-286', message: 'SYNTHETIC reading - not scripture.',
        boundaryNote: 'Not a universal promise.', reviewStatus: 'reviewed', reviewer: 'mw:agent:reviewer',
        sourceKeyAssessmentIds: [key.id],
      }],
      provenanceIds: ['mw:provenance:synthetic:editorial'],
      evidenceIds: ['mw:evidence:synthetic:1'],
    }],
    synthetic: true,
    ...overrides,
  }
}

async function withCatalog(run: (catalogPath: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'mw-seal-'))
  try {
    const catalogPath = join(dir, 'corpus-catalog.json')
    // Same shape and trust rule the API reads: schemaVersion 1 plus a sha256.
    await writeFile(catalogPath, JSON.stringify({schemaVersion: 1, corpusHash: HASH}), 'utf8')
    await run(catalogPath)
  } finally {
    await rm(dir, {recursive: true, force: true})
  }
}

test('a document is sealed with the trusted corpus hash and can be exported', async () => {
  await withCatalog(async catalogPath => {
    assert.equal(await readCorpusHash(catalogPath), HASH)
    const sealed = await sealDocument(document(), catalogPath)
    assert.equal(sealed.index.corpusHash, HASH)
    assert.equal(sealed.recordCount, 1)
    assert.ok(sealed.bytes > 0)
    // The seal is a hash of the projection, so it changes when the bytes change.
    const again = await sealDocument(document({deepLinkBase: 'https://moonwitness.example/other/'}), catalogPath)
    assert.notEqual(again.index.indexSha256, sealed.index.indexSha256)
  })
})

test('a catalog without the expected schema is not trusted', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mw-seal-'))
  try {
    const bad = join(dir, 'catalog.json')
    await writeFile(bad, JSON.stringify({corpusHash: HASH}), 'utf8')
    await assert.rejects(() => readCorpusHash(bad), /Trusted corpus catalog is unavailable/)
  } finally {
    await rm(dir, {recursive: true, force: true})
  }
})

test('a synthetic document may not be written into dist without an override', () => {
  assert.throws(() => assertPublishable(document(), 'dist/key-witness/index.json'), /synthetic seal document/)
  assert.doesNotThrow(() => assertPublishable(document(), 'tmp/key-witness/index.json'))
  assert.doesNotThrow(() => assertPublishable(document(), 'dist/key-witness/index.json', true))
  assert.doesNotThrow(() => assertPublishable(document({synthetic: false}), 'dist/key-witness/index.json'))
})

test('a written seal verifies, and a different corpus is refused', async () => {
  await withCatalog(async catalogPath => {
    const sealed = await sealDocument(document(), catalogPath)
    const dir = await mkdtemp(join(tmpdir(), 'mw-seal-out-'))
    try {
      const out = join(dir, 'index.json')
      await writeSealed(sealed, out)
      assert.deepEqual(await verifySealed(out, catalogPath), {recordCount: 1, corpusHash: HASH})
      const otherCatalog = join(dir, 'other.json')
      await writeFile(otherCatalog, JSON.stringify({schemaVersion: 1, corpusHash: 'b'.repeat(64)}), 'utf8')
      await assert.rejects(() => verifySealed(out, otherCatalog), /corpus/)
    } finally {
      await rm(dir, {recursive: true, force: true})
    }
  })
})

test('the checked-in fixture seals through the CLI and verifies against the catalog', async () => {
  await withCatalog(async catalogPath => {
    const dir = await mkdtemp(join(tmpdir(), 'mw-seal-cli-'))
    try {
      const out = join(dir, 'index.json')
      assert.equal(await main(['--records', FIXTURE, '--out', out, '--catalog', catalogPath]), 0)
      const written = JSON.parse(await readFile(out, 'utf8')) as {corpusHash: string; entries: unknown[]}
      assert.equal(written.corpusHash, HASH)
      assert.equal(written.entries.length, 2)
      assert.equal(await main(['--check', out, '--catalog', catalogPath]), 0)
    } finally {
      await rm(dir, {recursive: true, force: true})
    }
  })
})

test('the CLI cannot publish the fixture as the served index', async () => {
  // No catalog is read before the synthetic guard, so this proves the ordering too.
  await assert.rejects(() => main(['--records', FIXTURE, '--out', 'dist/key-witness/index.json']), /synthetic/)
})

test('the CLI refuses to guess its arguments', async () => {
  assert.equal(await main([]), 2)
})

test('a draft message is refused at seal time, so the CLI cannot publish it', async () => {
  await withCatalog(async catalogPath => {
    const doc = document()
    doc.entries[0].messages = [{...doc.entries[0].messages![0], reviewStatus: 'draft'}]
    await assert.rejects(() => sealDocument(doc, catalogPath), /draft/)
  })
})
