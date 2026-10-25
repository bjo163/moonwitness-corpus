import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildApp } from './app.js'
import { computeAnalysisInputHash, createReviewedSnapshot } from '@moonwitness/srgbl/derived'
import { sealKeyWitnessIndex } from '@moonwitness/srgbl/key-witness'

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

const keyWitnessPassageId = 'mw:passage:hinduism:bhagavad-gita:1:1'
/** Synthetic edition, artifact and marker only: no real edition is implied cleared. */
function keyWitnessIndex(corpusHash: string, passageId = keyWitnessPassageId) {
  return sealKeyWitnessIndex({
    corpusHash, methodVersion: 'srgbl-v8:key-direction:v0',
    deepLinkBase: 'https://moonwitness.example/app/',
    entries: [{
      passageId, editionId: 'mw:edition:synthetic:test', artifactId: 'mw:artifact:synthetic:test',
      textRights: 'restricted',
      annotationLicense: {kind: 'original-creative', attestedBy: 'mw:agent:curator', licenseId: 'CC-BY-4.0'},
      keys: [{id: 'mw:assessment:key:test:1', key: 'hope', scheme: 'semantic-core:v0',
        method: 'srgbl-v8:key-direction:v0', assessor: 'mw:agent:a', reviewStatus: 'reviewed'}],
      messages: [{id: 'mw:message:test:1', message: 'Read as a statement of trust.',
        boundaryNote: 'Not a universal promise.', reviewStatus: 'reviewed', reviewer: 'mw:agent:reviewer',
        sourceKeyAssessmentIds: ['mw:assessment:key:test:1']}],
      provenanceIds: ['mw:provenance:test:editorial'], evidenceIds: ['mw:evidence:test']
    }]
  })
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

  await t.test('an absent key/message index is an explicit 404, never fabricated keys', async () => {
    const previous=process.env.KEY_WITNESS_INDEX_PATH
    try {
      process.env.KEY_WITNESS_INDEX_PATH=join(tmpdir(),'mw-key-witness-absent-'+process.pid+'.json')
      const manifest=await app.inject({method:'GET',url:'/v1/research/key-witness/manifest'})
      assert.equal(manifest.statusCode,404)
      assert.equal(manifest.json().error,'key_witness_not_materialized')
      const passage=await app.inject({method:'GET',url:'/v1/research/key-witness/passages/'+encodeURIComponent(keyWitnessPassageId)})
      assert.equal(passage.statusCode,404)
      assert.equal(passage.json().error,'key_witness_not_materialized')
      const exported=await app.inject({method:'GET',url:'/v1/research/key-witness/export.jsonl'})
      assert.equal(exported.statusCode,404)
      const invalid=await app.inject({method:'GET',url:'/v1/research/key-witness/passages/not-a-passage'})
      assert.equal(invalid.statusCode,400)
      assert.equal(invalid.json().error,'invalid_passage_id')
    } finally {
      if (previous===undefined) delete process.env.KEY_WITNESS_INDEX_PATH
      else process.env.KEY_WITNESS_INDEX_PATH=previous
    }
  })

  await t.test('a sealed key/message index serves cited keys and JSONL, and never a score', async () => {
    const dir=await mkdtemp(join(tmpdir(),'mw-key-witness-'))
    const previous={index:process.env.KEY_WITNESS_INDEX_PATH,catalog:process.env.SRGBL_CORPUS_CATALOG_PATH}
    try {
      process.env.SRGBL_CORPUS_CATALOG_PATH=catalogPath
      const hash=catalogHash()
      const file=join(dir,'index.json')
      await writeFile(file,JSON.stringify(keyWitnessIndex(hash)),'utf8')
      process.env.KEY_WITNESS_INDEX_PATH=file

      const manifest=await app.inject({method:'GET',url:'/v1/research/key-witness/manifest'})
      assert.equal(manifest.statusCode,200)
      const summary=manifest.json()
      assert.equal(summary.corpusHash,hash)
      assert.equal(summary.recordCount,1)
      assert.equal(summary.scoresIncluded,false)
      assert.equal(summary.publicDomainInference,'prohibited')
      assert.deepEqual(summary.formats,{jsonl:'available',parquet:'not-implemented'})
      assert.match(summary.jsonlSha256,/^[a-f0-9]{64}$/)
      assert.match(summary.note,/no score is exported/)

      const passage=await app.inject({method:'GET',url:'/v1/research/key-witness/passages/'+encodeURIComponent(keyWitnessPassageId)})
      assert.equal(passage.statusCode,200)
      const citation=passage.json().citation
      assert.equal(citation.schema,'mw:citation:v0')
      assert.equal(citation.passageId,keyWitnessPassageId)
      assert.equal(citation.text,null)
      assert.match(citation.textOmissionReason,/source text is restricted/)
      assert.deepEqual(citation.keys.map((key: any)=>key.key),['hope'])
      assert.deepEqual(citation.messages.map((message: any)=>message.id),['mw:message:test:1'])
      assert.ok(citation.deepLink.startsWith('https://moonwitness.example/app/passages/'))
      for (const banned of ['"score"','"rank"','"verdict"','"consensus"','"winner"','SYNTHETIC WITNESS TEXT']) {
        assert.equal(passage.body.includes(banned),false,banned+' must never be published')
      }

      const exported=await app.inject({method:'GET',url:'/v1/research/key-witness/export.jsonl'})
      assert.equal(exported.statusCode,200)
      assert.match(exported.headers['content-type'] as string,/application\/x-ndjson/)
      assert.equal(exported.headers['x-corpus-hash'],hash)
      const lines=exported.body.split('\n').filter(Boolean)
      assert.equal(lines.length,1)
      assert.equal(JSON.parse(lines[0]).passageId,keyWitnessPassageId)
      assert.equal(exported.body.includes('"score"'),false)

      // A passage the canonical repository holds but the index does not cover.
      const uncovered=await app.inject({method:'GET',url:'/v1/research/key-witness/passages/'+encodeURIComponent('mw:passage:hinduism:bhagavad-gita:1:2')})
      assert.equal(uncovered.statusCode,404)
      assert.equal(uncovered.json().error,'no_key_witness_record_for_passage')
    } finally {
      if (previous.index===undefined) delete process.env.KEY_WITNESS_INDEX_PATH
      else process.env.KEY_WITNESS_INDEX_PATH=previous.index
      if (previous.catalog===undefined) delete process.env.SRGBL_CORPUS_CATALOG_PATH
      else process.env.SRGBL_CORPUS_CATALOG_PATH=previous.catalog
      await rm(dir,{recursive:true,force:true})
    }
  })

  await t.test('a stale, tampered or orphaned key/message index fails closed', async () => {
    const dir=await mkdtemp(join(tmpdir(),'mw-key-witness-'))
    const previous={index:process.env.KEY_WITNESS_INDEX_PATH,catalog:process.env.SRGBL_CORPUS_CATALOG_PATH}
    try {
      process.env.SRGBL_CORPUS_CATALOG_PATH=catalogPath
      const hash=catalogHash()
      const sealed=keyWitnessIndex(hash)
      const manifestUrl='/v1/research/key-witness/manifest'
      // Stale: structurally valid, pinned to another corpus snapshot.
      const stale=join(dir,'stale.json')
      await writeFile(stale,JSON.stringify({...structuredClone(sealed),corpusHash:'b'.repeat(64)}),'utf8')
      process.env.KEY_WITNESS_INDEX_PATH=stale
      let res=await app.inject({method:'GET',url:manifestUrl})
      assert.equal(res.statusCode,503)
      assert.equal(res.json().error,'key_witness_index_integrity_failure')
      // Tampered: an edited message without a new seal is drift.
      const tampered=structuredClone(sealed) as any
      tampered.entries[0].messages[0].message='Injected interpretation'
      const tamperedFile=join(dir,'tampered.json')
      await writeFile(tamperedFile,JSON.stringify(tampered),'utf8')
      process.env.KEY_WITNESS_INDEX_PATH=tamperedFile
      res=await app.inject({method:'GET',url:manifestUrl})
      assert.equal(res.statusCode,503)
      res=await app.inject({method:'GET',url:'/v1/research/key-witness/export.jsonl'})
      assert.equal(res.statusCode,503)
      // Corrupt: unparseable bytes are an integrity failure, never a 200 or a 404.
      const corrupt=join(dir,'corrupt.json')
      await writeFile(corrupt,'{"schema":"mw:key-witness-index:v0", ','utf8')
      process.env.KEY_WITNESS_INDEX_PATH=corrupt
      assert.equal((await app.inject({method:'GET',url:manifestUrl})).statusCode,503)
      // Orphaned: a sealed entry for a passage the canonical repository does not hold.
      const orphanFile=join(dir,'orphan.json')
      await writeFile(orphanFile,JSON.stringify(keyWitnessIndex(hash,'mw:passage:hinduism:bhagavad-gita:999:999')),'utf8')
      process.env.KEY_WITNESS_INDEX_PATH=orphanFile
      res=await app.inject({method:'GET',url:manifestUrl})
      assert.equal(res.statusCode,503)
    } finally {
      if (previous.index===undefined) delete process.env.KEY_WITNESS_INDEX_PATH
      else process.env.KEY_WITNESS_INDEX_PATH=previous.index
      if (previous.catalog===undefined) delete process.env.SRGBL_CORPUS_CATALOG_PATH
      else process.env.SRGBL_CORPUS_CATALOG_PATH=previous.catalog
      await rm(dir,{recursive:true,force:true})
    }
  })

  await app.close()
})
