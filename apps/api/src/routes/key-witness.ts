import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import type { CanonicalId } from '@moonwitness/corpus-core'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  buildKeyWitnessExport, verifyKeyWitnessIndex,
  type KeyWitnessExportManifest, type KeyWitnessIndex
} from '@moonwitness/srgbl/key-witness'
import type { CitationBundle } from '@moonwitness/srgbl/citation'

const MAX_INDEX_BYTES = 20 * 1024 * 1024

type LoadedIndex = {
  index: KeyWitnessIndex
  jsonl: string
  manifest: KeyWitnessExportManifest
  records: CitationBundle[]
}

/** The corpus identity comes from the generated catalog, never from the index itself. */
async function catalogCorpusHash(): Promise<string> {
  const catalogPath = resolve(process.env.SRGBL_CORPUS_CATALOG_PATH || 'apps/web/public/corpus-catalog.json')
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8')) as { schemaVersion?: unknown; corpusHash?: unknown }
  if (catalog.schemaVersion !== 1 || typeof catalog.corpusHash !== 'string') {
    throw new Error('Trusted corpus catalog is unavailable')
  }
  return catalog.corpusHash
}

/** A missing index is 404; an unreadable, stale, tampered or orphaned index is 503. */
async function loadKeyWitness(app: FastifyInstance): Promise<LoadedIndex | null> {
  const filename = resolve(process.env.KEY_WITNESS_INDEX_PATH || 'dist/key-witness/index.json')
  let raw: string
  try {
    const info = await stat(filename)
    if (!info.isFile() || info.size > MAX_INDEX_BYTES) throw new Error('Key-witness index exceeds configured limit')
    raw = await readFile(filename, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
  const index = verifyKeyWitnessIndex(JSON.parse(raw), await catalogCorpusHash())
  // An entry for a passage the canonical repository does not hold is not served.
  const orphans = index.entries.filter(entry => !app.repo.getPassageWithContents(entry.passageId as CanonicalId))
  if (orphans.length) throw new Error('key-witness index references unknown passages: ' + orphans.map(entry => entry.passageId).join(','))
  const exported = buildKeyWitnessExport(index)
  if (exported.jsonl === null || exported.manifest === null) throw new Error(exported.errors.join('; '))
  return {index, jsonl: exported.jsonl, manifest: exported.manifest, records: exported.records}
}

async function safeLoadKeyWitness(app: FastifyInstance) {
  try { return {loaded: await loadKeyWitness(app), error: false} } catch { return {loaded: null, error: true} }
}

const NOT_MATERIALIZED = {
  success: false,
  error: 'key_witness_not_materialized',
  note: 'No sealed key-witness index exists; this endpoint never fabricates a key, a message or an export.'
}

/** Read-only derived key/message layer (P18-020). It serves reviewed derived
 * records only: no canonical text without clearance, no score, no verdict. */
export const keyWitnessRoutes: FastifyPluginAsync = async app => {
  app.get('/research/key-witness/manifest', {
    schema: {
      tags: ['Research: Key Witness'],
      summary: 'Sealed derived key/message export manifest',
      description: 'Read-only. Reports the record count, both formats and the export checksum; carries no score.'
    }
  }, async (_request, reply) => {
    const {loaded, error} = await safeLoadKeyWitness(app)
    if (error) return reply.code(503).send({success: false, error: 'key_witness_index_integrity_failure'})
    if (!loaded) return reply.code(404).send(NOT_MATERIALIZED)
    return {
      success: true,
      ...loaded.manifest,
      note: 'Derived records only. JSONL is the issued format; no Parquet file exists and no score is exported.'
    }
  })

  app.get('/research/key-witness/passages/:id', {
    schema: {
      tags: ['Research: Key Witness'],
      summary: 'Cited keys and reviewed messages for one passage',
      description: 'Read-only. Returns the citation bundle for the passage; text appears only when its licence is cleared.',
      params: {type: 'object', required: ['id'], properties: {id: {type: 'string', minLength: 1}}}
    }
  }, async (request, reply) => {
    const {id} = request.params as {id: string}
    if (!id.startsWith('mw:passage:') || id.length > 255) return reply.code(400).send({success: false, error: 'invalid_passage_id'})
    const {loaded, error} = await safeLoadKeyWitness(app)
    if (error) return reply.code(503).send({success: false, error: 'key_witness_index_integrity_failure'})
    if (!loaded) return reply.code(404).send(NOT_MATERIALIZED)
    if (!app.repo.getPassageWithContents(id as CanonicalId)) {
      return reply.code(404).send({success: false, error: 'passage_not_found', id})
    }
    const record = loaded.records.find(citation => citation.passageId === id)
    if (!record) return reply.code(404).send({success: false, error: 'no_key_witness_record_for_passage', passageId: id})
    return {
      success: true,
      passageId: id,
      corpusHash: loaded.index.corpusHash,
      methodVersion: loaded.index.methodVersion,
      citation: record
    }
  })

  app.get('/research/key-witness/export.jsonl', {
    schema: {
      tags: ['Research: Key Witness'],
      summary: 'The derived key/message export as JSON Lines',
      description: 'Read-only. One canonical mw:citation:v0 object per line, exactly the bytes the manifest checksums.'
    }
  }, async (_request, reply) => {
    const {loaded, error} = await safeLoadKeyWitness(app)
    if (error) return reply.code(503).send({success: false, error: 'key_witness_index_integrity_failure'})
    if (!loaded) return reply.code(404).send(NOT_MATERIALIZED)
    return reply
      .code(200)
      .header('content-type', 'application/x-ndjson; charset=utf-8')
      .header('x-corpus-hash', loaded.manifest.corpusHash)
      .header('x-export-sha256', loaded.manifest.jsonlSha256)
      .send(loaded.jsonl)
  })
}
