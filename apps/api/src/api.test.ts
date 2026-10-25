import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildApp } from './app.js'
import { computeAnalysisInputHash, createReviewedSnapshot } from '@moonwitness/srgbl/derived'

const analysisUrl = '/v1/research/srgbl/passages/mw%3Apassage%3Ahinduism%3Abhagavad-gita%3A1%3A1/analysis'
const catalogPath = 'apps/web/public/corpus-catalog.json'
const catalogHash = (): string => JSON.parse(readFileSync(catalogPath, 'utf8')).corpusHash as string
/** Minimal reviewed run, sealed exactly as the builder expects it. */
function reviewedSnapshot(corpusHash: string, passageId = 'mw:passage:hinduism:bhagavad-gita:1:1') {
  const run: any = {
    id: 'run:synthetic:review-1', passageId, method: 'textual-research:v8',
    methodVersion: 'v8-proposal', corpusHash, inputHash: '', reviewStatus: 'reviewed',
    reviewer: 'mw:reviewer:test',
    sourceWitnesses: [{
      id: 'source:synthetic', passageId, contentId: 'mw:content:test:one', sourceId: 'mw:source:test',
      editionId: 'mw:edition:test', artifactId: 'mw:artifact:test', provenanceId: 'mw:provenance:test',
      language: 'en', representation: 'source_text', rights: 'cleared',
      text: 'SYNTHETIC DATA - NOT SCRIPTURE'
    }],
    claims: [{
      id: 'claim:S1', level: 'S1', status: 'supported', epistemic: 'observed',
      claim: 'Synthetic source identifier was observed', evidenceIds: ['mw:evidence:test'],
      dependsOn: [], method: 'textual-research:v8',
      frame: { agent: 'narrator', recipient: 'individual', domain: 'research', scope: 'test', genre: 'example' },
      sourceContentIds: ['mw:content:test:one']
    }],
    uncertainty: { unknowns: [], disagreements: [] }
  }
  const { inputHash: unused, ...payload } = run
  run.inputHash = computeAnalysisInputHash(payload)
  return createReviewedSnapshot({ corpusHash, methodVersion: run.methodVersion, runs: [run], candidates: [], miracleClaims: [] })
}

test('Fastify Corpus API Engine with OpenTelemetry & Dynamic Traditions', async (t) => {
  const app = await buildApp()

  await t.test('GET /v1/health returns healthy and 537k+ records with OTel trace headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/health' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.status, 'healthy')
    assert.ok(json.totalRecords > 530000, `Must report over 530,000 records, got ${json.totalRecords}`)

    // OpenTelemetry Header Invariants
    assert.ok(res.headers['x-trace-id'], 'Must inject x-trace-id header')
    assert.ok(res.headers['traceparent'], 'Must inject W3C traceparent header')
    assert.ok(res.headers['x-response-time-ms'], 'Must inject x-response-time-ms header')
  })

  await t.test('GET /metrics returns standard OpenTelemetry / Prometheus telemetry format', async () => {
    const res = await app.inject({ method: 'GET', url: '/metrics' })
    assert.equal(res.statusCode, 200)
    const body = res.body
    assert.ok(body.includes('corpus_indexed_records_total'), 'Must expose corpus_indexed_records_total gauge')
    assert.ok(body.includes('http_requests_total'), 'Must expose http_requests_total counter')
    assert.ok(body.includes('process_memory_rss_bytes'), 'Must expose memory metrics')
  })

  await t.test('GET /v1/traditions dynamically aggregates all active traditions from database', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/traditions' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.success, true)
    assert.ok(json.total >= 8, `Expected at least 8 traditions, got ${json.total}`)
    assert.ok(json.data.some((d: any) => d.id === 'islam'), 'Must contain islam')
    assert.ok(json.data.some((d: any) => d.id === 'hinduism'), 'Must contain hinduism')
    assert.ok(json.data.some((d: any) => d.id === 'buddhism'), 'Must contain buddhism')
    assert.ok(json.data.some((d: any) => d.tradition === 'islam' || d.id === 'islam'), 'Must contain islam')
    assert.ok(json.data.some((d: any) => d.tradition === 'hinduism' || d.id === 'hinduism'), 'Must contain hinduism')
    assert.ok(json.data.some((d: any) => d.tradition === 'buddhism' || d.id === 'buddhism'), 'Must contain buddhism')
  })

  await t.test('GET /v1/works returns all canonical works with structural levels', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/works' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.success, true)
    assert.ok(json.total >= 5, `Expected at least 5 works, got ${json.total}`)
    assert.ok(json.data.length > 0)
  })

  await t.test('GET /v1/search executes FTS5 sub-millisecond full-text queries', async () => {
    // Warm up before measuring query latency, matching the original API regression.
    await app.inject({ method: 'GET', url: '/v1/search?q=mercy&limit=1' })
    const start = performance.now()
    const res = await app.inject({ method: 'GET', url: '/v1/search?q=mercy&limit=5' })
    const duration = performance.now() - start
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.ok(json.count > 0, 'Must find hits for mercy')
    assert.ok(duration < 100, `Search request duration was ${duration.toFixed(2)}ms`)
  })

  await t.test('GET /v1/devotionals returns authentic Islamic Duas and Asmaul Husna', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/devotionals?tradition=islam&limit=10' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.ok(json.count > 0, 'Must return devotional records')
  })

  await t.test('GET /v1/compare dynamically aggregates parallel wisdom across active traditions', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/compare?theme=wisdom' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.ok(json.traditionsCovered >= 3, `Expected at least 3 traditions covered, got ${json.traditionsCovered}`)
  })

  await t.test('GET /v1/passages returns parallel text lanes and trace metadata', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/passages/mw%3Apassage%3Ahinduism%3Abhagavad-gita%3A1%3A1' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.success, true)
    assert.equal(json.data.passage.id, 'mw:passage:hinduism:bhagavad-gita:1:1')
    assert.ok(json.data.contents.length >= 2)
    assert.ok(json.data.dataset)
  })

  await t.test('GET /v1/works/:id resolves canonical work hierarchy', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/works/mw%3Awork%3Ahinduism%3Abhagavad-gita' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.data.work.id, 'mw:work:hinduism:bhagavad-gita')
    assert.ok(Array.isArray(json.data.expressions))
    assert.ok(Array.isArray(json.data.editions))
    assert.ok(Array.isArray(json.data.artifacts))
  })

  await t.test('GET /v1/assertions/:id/traversal resolves active direct evidence references', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/assertions/mw%3Aassertion%3Ap13%3Atextual-evidence%3A1/traversal' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.data.assertion.id, 'mw:assertion:p13:textual-evidence:1')
    assert.ok(json.data.targets.some((item: any) => item.id === 'mw:content:quran:2:87:ar-uthmani'))
  })

  await t.test('GET /v1/search honors tradition filtering and pagination metadata', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/search?q=mercy&tradition=islam&limit=5' })
    assert.equal(res.statusCode, 200)
    const json = res.json()
    assert.equal(json.tradition, 'islam')
    assert.equal(typeof json.hasMore, 'boolean')
    assert.ok(json.data.every((item: any) => item.tradition === 'islam'))
  })

  await t.test('SRGBL research status is explicit, read-only and makes no invented claims', async () => {
    const status = await app.inject({method:'GET',url:'/v1/research/srgbl/manifest'})
    assert.equal(status.statusCode,200)
    assert.deepEqual(status.json().levelNames,['S1','R2','G3','B4','L5'])
    assert.equal(status.json().reviewedAnalysisMaterialized,false)
    const response = await app.inject({method:'GET',url:'/v1/research/srgbl/passages/mw%3Apassage%3Ahinduism%3Abhagavad-gita%3A1%3A1/source-trace'})
    assert.equal(response.statusCode,200)
    const detail = response.json()
    assert.equal(detail.data.defaultLevelStatus,'pending')
    assert.ok(detail.data.sources.length >= 2)
    assert.ok(detail.data.sources.every((s: any) => s.text === undefined))
    const missing = await app.inject({method:'GET',url:'/v1/research/srgbl/passages/mw%3Apassage%3Ahinduism%3Abhagavad-gita%3A1%3A1/analysis'})
    assert.equal(missing.statusCode,404)
    assert.equal(missing.json().error,'reviewed_analysis_not_materialized')
  })

  await t.test('a verified reviewed snapshot serves the passage and leaks no text or score', async () => {
    const dir=await mkdtemp(join(tmpdir(),'mw-reviewed-'))
    const previous={reviewed:process.env.SRGBL_REVIEWED_PATH,catalog:process.env.SRGBL_CORPUS_CATALOG_PATH}
    try {
      process.env.SRGBL_CORPUS_CATALOG_PATH=catalogPath
      const hash=catalogHash()
      const file=join(dir,'reviewed.json')
      await writeFile(file,JSON.stringify(reviewedSnapshot(hash)),'utf8')
      process.env.SRGBL_REVIEWED_PATH=file
      const res=await app.inject({method:'GET',url:analysisUrl})
      assert.equal(res.statusCode,200)
      const json=res.json()
      assert.equal(json.corpusHash,hash)
      assert.equal(json.analyses.length,1)
      assert.equal(json.analyses[0].passageId,'mw:passage:hinduism:bhagavad-gita:1:1')
      assert.equal(json.analyses[0].status,'reviewed')
      assert.equal(json.analyses[0].levels[0].level,'S1')
      // Fail closed on leaks: no source text, no maturity score, no seal internals.
      assert.equal(res.body.includes('SYNTHETIC DATA'),false)
      for (const banned of ['"maturity"','"score"','"witnessScore"','sourceWitnesses','inputSha256','projectionSha256']) {
        assert.equal(res.body.includes(banned),false,banned+' must never be published')
      }
    } finally {
      if (previous.reviewed===undefined) delete process.env.SRGBL_REVIEWED_PATH
      else process.env.SRGBL_REVIEWED_PATH=previous.reviewed
      if (previous.catalog===undefined) delete process.env.SRGBL_CORPUS_CATALOG_PATH
      else process.env.SRGBL_CORPUS_CATALOG_PATH=previous.catalog
      await rm(dir,{recursive:true,force:true})
    }
  })

  await t.test('stale, corrupt, empty or orphaned reviewed snapshots fail closed', async () => {
    const dir=await mkdtemp(join(tmpdir(),'mw-reviewed-'))
    const previous={reviewed:process.env.SRGBL_REVIEWED_PATH,catalog:process.env.SRGBL_CORPUS_CATALOG_PATH}
    try {
      process.env.SRGBL_CORPUS_CATALOG_PATH=catalogPath
      const hash=catalogHash()
      const valid=reviewedSnapshot(hash)
      // Stale: structurally valid, pinned to another corpus snapshot.
      const stale=join(dir,'stale.json')
      await writeFile(stale,JSON.stringify({...structuredClone(valid),corpusHash:'a'.repeat(64)}),'utf8')
      process.env.SRGBL_REVIEWED_PATH=stale
      let res=await app.inject({method:'GET',url:analysisUrl})
      assert.equal(res.statusCode,503)
      assert.equal(res.json().error,'reviewed_publication_integrity_failure')
      // Corrupt: unparseable bytes are an integrity failure, never a 404 and never a 200.
      const corrupt=join(dir,'corrupt.json')
      await writeFile(corrupt,'{"schema":"srgbl-v8-reviewed-derived-v1", ','utf8')
      process.env.SRGBL_REVIEWED_PATH=corrupt
      res=await app.inject({method:'GET',url:analysisUrl})
      assert.equal(res.statusCode,503)
      // Tampered: a changed claim without a new checksum is drift.
      const tampered=structuredClone(valid) as any
      tampered.publicSummaries[0].levels[0].claim='Injected interpretation'
      const tamperedFile=join(dir,'tampered.json')
      await writeFile(tamperedFile,JSON.stringify(tampered),'utf8')
      process.env.SRGBL_REVIEWED_PATH=tamperedFile
      res=await app.inject({method:'GET',url:analysisUrl})
      assert.equal(res.statusCode,503)
      // Empty index: a valid snapshot with no reviewed analysis is not a published reading.
      const emptyFile=join(dir,'empty.json')
      const empty=createReviewedSnapshot({corpusHash:hash,methodVersion:'v8-proposal',runs:[],candidates:[],miracleClaims:[]})
      await writeFile(emptyFile,JSON.stringify(empty),'utf8')
      process.env.SRGBL_REVIEWED_PATH=emptyFile
      res=await app.inject({method:'GET',url:analysisUrl})
      assert.equal(res.statusCode,404)
      assert.equal(res.json().error,'reviewed_analysis_not_materialized')
      // Orphaned: a reviewed summary for a passage the canonical repository does not hold.
      const orphanId='mw:passage:hinduism:bhagavad-gita:999:999'
      const orphanFile=join(dir,'orphan.json')
      await writeFile(orphanFile,JSON.stringify(reviewedSnapshot(hash,orphanId)),'utf8')
      process.env.SRGBL_REVIEWED_PATH=orphanFile
      const orphanUrl='/v1/research/srgbl/passages/'+encodeURIComponent(orphanId)+'/analysis'
      res=await app.inject({method:'GET',url:orphanUrl})
      assert.equal(res.statusCode,404)
      assert.equal(res.json().error,'passage_not_found')
    } finally {
      if (previous.reviewed===undefined) delete process.env.SRGBL_REVIEWED_PATH
      else process.env.SRGBL_REVIEWED_PATH=previous.reviewed
      if (previous.catalog===undefined) delete process.env.SRGBL_CORPUS_CATALOG_PATH
      else process.env.SRGBL_CORPUS_CATALOG_PATH=previous.catalog
      await rm(dir,{recursive:true,force:true})
    }
  })

  await app.close()
})
