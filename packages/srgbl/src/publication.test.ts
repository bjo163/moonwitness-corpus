import assert from 'node:assert/strict'
import test from 'node:test'
import { createReviewedSnapshot, sha256Json, computeAnalysisInputHash } from './derived.js'
import { verifyReviewedPublication } from './publication.js'
import { validateAnalysisRun, type AnalysisRun } from './analysis.js'

const corpusHash='a'.repeat(64)
function oneStageRun(): AnalysisRun {
  const run:AnalysisRun = {
    id:'run:synthetic:review-1',passageId:'mw:passage:test:one',
    method:'textual-research:v8',methodVersion:'v8-proposal',
    corpusHash,inputHash:'test-only-hash',reviewStatus:'reviewed',reviewer:'mw:reviewer:test',
    sourceWitnesses:[{
      id:'source:synthetic',passageId:'mw:passage:test:one',contentId:'mw:content:test:one',
      sourceId:'mw:source:test',editionId:'mw:edition:test',artifactId:'mw:artifact:test',
      provenanceId:'mw:provenance:test',language:'en',representation:'source_text',
      rights:'cleared',text:'SYNTHETIC DATA - NOT SCRIPTURE'
    }],
    claims:[{
      id:'claim:S1',level:'S1',status:'supported',epistemic:'observed',
      claim:'Synthetic source identifier was observed',evidenceIds:['mw:evidence:test'],
      dependsOn:[],method:'textual-research:v8',
      frame:{agent:'narrator',recipient:'individual',domain:'research',scope:'test',genre:'example'},
      sourceContentIds:['mw:content:test:one']
    }],
    uncertainty:{unknowns:[],disagreements:[]}
  }
  const {inputHash:unused, ...payload}=run
  run.inputHash=computeAnalysisInputHash(payload)
  return run
}

test('reviewed source trace is hashed, pinned and can be verified before publication',()=>{
  const run=oneStageRun()
  const s=createReviewedSnapshot({corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]})
  assert.equal(s.projectionSha256.length,64)
  const verified=verifyReviewedPublication(s,corpusHash)
  assert.equal(verified.publicSummaries[0].levels.length,1)
  assert.equal(verified.publicSummaries[0].levels[0].level,'S1')
  assert.equal(verified.publicSummaries[0].levels[0].epistemic,'observed')
  assert.equal(verified.publicSummaries[0].levels[0].evidenceIds[0],'mw:evidence:test')
  assert.equal(JSON.stringify(verified).includes('SYNTHETIC DATA - NOT SCRIPTURE'),false)
  assert.equal(JSON.stringify(verified.publicSummaries).includes('maturity'),false)
})
test('reviewed export rejects a modified analysis even if status is still reviewed',()=>{
  const run=oneStageRun()
  run.claims[0].claim='Altered after reviewer input seal'
  assert.throws(()=>createReviewedSnapshot({
    corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]
  }),/analysis input hash mismatch/)
})
test('missing verified S1 stage cannot be published even if reviewer exists',()=>{
  const run=oneStageRun()
  run.claims=[]
  const {inputHash:unused,...payload}=run
  run.inputHash=computeAnalysisInputHash(payload)
  const result=validateAnalysisRun(run)
  assert.equal(result.maturity.score,0)
  assert.equal(result.publishable,false)
  assert.throws(()=>createReviewedSnapshot({corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]}),/not publishable/)
})
test('invalid corpus identity, stale corpus and edited projection fail closed',()=>{
  const run=oneStageRun()
  const s=createReviewedSnapshot({corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]})
  assert.throws(()=>verifyReviewedPublication(s,'b'.repeat(64)),/corpus hash mismatch/)
  assert.throws(()=>verifyReviewedPublication(s,'unverified'),/untrusted corpus/)
  const edited=structuredClone(s)
  edited.publicSummaries[0].levels[0].claim='Injected interpretation'
  assert.throws(()=>verifyReviewedPublication(edited,corpusHash),/projection has changed/)
})
test('even a recomputed checksum cannot bypass referenced review and S1 stage contracts',()=>{
  const run=oneStageRun()
  const s=createReviewedSnapshot({corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]})
  const tampered=structuredClone(s)
  tampered.publicSummaries[0].levels=[]
  const {projectionSha256:unused,...projection}=tampered
  tampered.projectionSha256=sha256Json(projection)
  assert.throws(()=>verifyReviewedPublication(tampered,corpusHash),/missing stage/)
  const orphan=structuredClone(s)
  orphan.publicSummaries[0].id='another-review-run'
  const {projectionSha256:unused2,...projection2}=orphan
  orphan.projectionSha256=sha256Json(projection2)
  assert.throws(()=>verifyReviewedPublication(orphan,corpusHash),/orphan public/)
})
test('no reviewed case results in no fabricated scripture findings',()=>{
  const empty=createReviewedSnapshot({corpusHash,methodVersion:'v8-proposal',runs:[],candidates:[],miracleClaims:[]})
  const out=verifyReviewedPublication(empty,corpusHash)
  assert.deepEqual(out.publicSummaries,[])
  assert.deepEqual(out.records.reviewedAnalyses,[])
})
