import type { FastifyPluginAsync } from 'fastify'
import type { CanonicalId } from '@moonwitness/corpus-core'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { SRGBL_LEVELS } from '@moonwitness/srgbl'
import { adaptPassageSources, type CorpusPassageDetail } from '@moonwitness/srgbl/sources'
import { verifyReviewedPublication } from '@moonwitness/srgbl/publication'
import type { ResearchPublication } from '@moonwitness/srgbl/derived'

function sourceRefs(record: unknown): { artifact?: string; provenance?: string } {
  if (!record || typeof record !== 'object') return {}
  const extensions = (record as { extensions?: unknown }).extensions
  if (!extensions || typeof extensions !== 'object') return {}
  const source = (extensions as { source?: unknown }).source
  if (!source || typeof source !== 'object') return {}
  const { artifact, provenance } = source as { artifact?: unknown; provenance?: unknown }
  return {
    artifact: typeof artifact === 'string' ? artifact : undefined,
    provenance: typeof provenance === 'string' ? provenance : undefined
  }
}

/** No review index is trusted without the independently generated local corpus catalog.
 * Filesystem write permissions and editorial review remain the actual trust boundary:
 * a SHA-256 checksum detects drift but does NOT authenticate a reviewer. */
async function readReviewedIndex(): Promise<ResearchPublication | null> {
  const filename=resolve(process.env.SRGBL_REVIEWED_PATH || 'dist/srgbl/reviewed.json')
  let raw: string
  try {
    const info=await stat(filename)
    if(!info.isFile() || info.size > 5 * 1024 * 1024) throw new Error('Reviewed SRGBL snapshot exceeds configured limit')
    raw=await readFile(filename,'utf8')
  } catch(e) {
    if((e as NodeJS.ErrnoException).code==='ENOENT') return null
    throw e
  }
  const catalogPath=resolve(process.env.SRGBL_CORPUS_CATALOG_PATH || 'apps/web/public/corpus-catalog.json')
  const catalog=JSON.parse(await readFile(catalogPath,'utf8')) as {schemaVersion?: unknown;corpusHash?: unknown}
  if(catalog.schemaVersion !== 1 || typeof catalog.corpusHash !== 'string') {
    throw new Error('Trusted corpus catalog is unavailable')
  }
  return verifyReviewedPublication(JSON.parse(raw),catalog.corpusHash)
}

/** Invalid or stale reviewed snapshot is an explicit 503, never a published claim. */
async function safeReviewedIndex() {
  try { return {index:await readReviewedIndex(),error:false} }
  catch { return {index:null,error:true} }
}

/** Read-only S1 research trace: NEVER calculates theological truth or leaks texts
 * with unknown licensing. Actual SRGBL derived scores require reviewed materialization. */
export const srgblResearchRoutes: FastifyPluginAsync = async app => {
  app.get('/research/srgbl/manifest', {
    schema: { tags: ['Research: SRGBL v8'], summary: 'SRGBL v8 research implementation status' }
  }, async (_request, reply) => {
    const {index:reviewed,error}=await safeReviewedIndex()
    if(error) return reply.code(503).send({
      success:false,model:'SRGBL',researchStatus:'reviewed-publication-invalid',
      reviewedAnalysisMaterialized:false,publicGlobalScriptureScoring:false
    })
    return {
      success: true,
      model: 'SRGBL', methodVersion: 'v8-research-proposal',
      levelNames: SRGBL_LEVELS,
      publicGlobalScriptureScoring: false,
      researchStatus: reviewed?.publicSummaries.length ? 'reviewed-derived-available' : 'source-trace-only',
      reviewedAnalysisMaterialized: Boolean(reviewed?.publicSummaries.length),
      corpusHash: reviewed?.corpusHash ?? null
    }
  })

  app.get('/research/srgbl/passages/:id/source-trace', {
    schema: {
      tags: ['Research: SRGBL v8'],
      summary: 'S1 source provenance gaps for canonical passage',
      description: 'Read-only, metadata-only. Does not infer rights or return unlicensed source text.',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1 } } }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    if (!id.startsWith('mw:passage:') || id.length > 255) {
      return reply.code(400).send({ success: false, error: 'invalid_passage_id' })
    }
    const detail = app.repo.getPassageWithContents(id as CanonicalId)
    if (!detail) return reply.code(404).send({ success: false, error: 'passage_not_found', id })

    const artifacts = new Set<string>(), provenance = new Set<string>()
    for (const c of [detail.passage, ...detail.contents]) {
      const refs = sourceRefs(c)
      if (refs.artifact) artifacts.add(refs.artifact)
      if (refs.provenance) provenance.add(refs.provenance)
    }
    const artifactRecords = (await Promise.all([...artifacts].map(a => app.repo.getResource(a as CanonicalId))))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
    for (const artifact of artifactRecords) {
      const refs = sourceRefs(artifact)
      if (refs.provenance) provenance.add(refs.provenance)
    }
    const provenanceRecords = (await Promise.all([...provenance].map(p => app.repo.getProvenance(p as CanonicalId))))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
    const evidenceMap = new Map<string, { id: string }>()
    for (const target of [detail.passage.id, ...detail.contents.map(c => c.id)]) {
      for (const e of app.repo.getEvidenceTargeting(target as CanonicalId)) evidenceMap.set(e.id,e)
    }
    // Cast is structural and read-only: the adapter validates required arrays.
    const projected = adaptPassageSources({
      passage: detail.passage, contents: detail.contents,
      artifacts: artifactRecords, provenance: provenanceRecords,
      evidence: [...evidenceMap.values()]
    } as unknown as CorpusPassageDetail)
    return {success:true,data:projected,method:'srgbl-v8-source-trace',rightsPolicy:'fail-closed',
      note:'Source data and missing fields only; NOT a reviewed S1 score or interpretation.'}
  })

  app.get('/research/srgbl/passages/:id/analysis', {
    schema: {
      tags: ['Research: SRGBL v8'],
      summary: 'Get reviewed SRGBL analysis (not materialized yet)',
      params: {type:'object',required:['id'],properties:{id:{type:'string',minLength:1}}}
    }
  }, async (request, reply) => {
    const {id} = request.params as {id:string}
    if(!id.startsWith('mw:passage:') || id.length > 255) return reply.code(400).send({success:false,error:'invalid_passage_id'})
    const {index,error}=await safeReviewedIndex()
    if(error) return reply.code(503).send({
      success:false,error:'reviewed_publication_integrity_failure'
    })
    if(!index) return reply.code(404).send({
      success:false,error:'reviewed_analysis_not_materialized',
      note:'No reviewed SRGBL derived analysis index exists; this endpoint never fabricates a five-level reading.'
    })
    // An empty reviewed index is not a published analysis and never a five-level reading.
    if(!index.publicSummaries.length) return reply.code(404).send({
      success:false,error:'reviewed_analysis_not_materialized',
      note:'The reviewed SRGBL index is empty; an empty index is not a published analysis.'
    })
    // Bind the snapshot to the canonical repository: an orphaned summary is not served.
    if(!app.repo.getPassageWithContents(id as CanonicalId)) return reply.code(404).send({
      success:false,error:'passage_not_found',id
    })
    const records=index.publicSummaries.filter(item=>item.passageId===id)
    if(!records.length) return reply.code(404).send({
      success:false,error:'no_reviewed_analysis_for_passage',passageId:id
    })
    // Public projection excludes all scalar research scores and source text.
    return {success:true,passageId:id,corpusHash:index.corpusHash,
      methodVersion:index.methodVersion,analyses:records}
  })
}
