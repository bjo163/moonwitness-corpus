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
test('a sealed run fails export when its source, reviewer, claim or evidence changes',()=>{
  const sealed=oneStageRun()
  const snapshotOf=(run:AnalysisRun)=>createReviewedSnapshot({
    corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]})
  // Positive: the same reviewed bytes always produce the same input SHA.
  assert.equal(snapshotOf(structuredClone(sealed)).inputSha256,snapshotOf(sealed).inputSha256)
  // Positive: the seal covers the record set, not the order a caller listed it in.
  const twin=structuredClone(sealed)
  twin.id='run:synthetic:review-2'
  const {inputHash:unusedHash,...twinPayload}=twin
  twin.inputHash=computeAnalysisInputHash(twinPayload)
  const forward=createReviewedSnapshot({corpusHash,methodVersion:sealed.methodVersion,
    runs:[sealed,twin],candidates:[],miracleClaims:[]})
  const reversed=createReviewedSnapshot({corpusHash,methodVersion:sealed.methodVersion,
    runs:[twin,sealed],candidates:[],miracleClaims:[]})
  assert.equal(reversed.inputSha256,forward.inputSha256)
  assert.equal(reversed.projectionSha256,forward.projectionSha256)
  // Negative: every part of the seal fails closed once it is edited after sealing.
  const mutations:Array<{label:string;mutate:(run:AnalysisRun)=>void}>=[
    {label:'reviewer',mutate:run=>{run.reviewer='mw:reviewer:impostor'}},
    {label:'source edition',mutate:run=>{run.sourceWitnesses[0].editionId='mw:edition:swapped'}},
    {label:'source text',mutate:run=>{run.sourceWitnesses[0].text='SUBSTITUTED TEXT'}},
    {label:'source rights',mutate:run=>{run.sourceWitnesses[0].rights='unknown'}},
    {label:'claim',mutate:run=>{run.claims[0].claim='Altered after the seal'}},
    {label:'claim evidence',mutate:run=>{run.claims[0].evidenceIds=['mw:evidence:injected']}},
    {label:'source content',mutate:run=>{run.claims[0].sourceContentIds=['mw:content:injected']}}
  ]
  for (const {label,mutate} of mutations) {
    const copy=structuredClone(sealed)
    mutate(copy)
    assert.throws(()=>snapshotOf(copy),/analysis input hash mismatch/,
      label+' changed after sealing must fail the reviewed export')
  }
  // Negative: the seal is a content checksum, not a human signature, and it says so.
  const snapshot=snapshotOf(sealed)
  assert.equal(snapshot.authenticatedSignature,false)
  const forged=structuredClone(snapshot) as unknown as Record<string,unknown>
  forged.authenticatedSignature=true
  const {projectionSha256:unused,...projection}=forged
  forged.projectionSha256=sha256Json(projection)
  assert.throws(()=>verifyReviewedPublication(forged,corpusHash),/not an authenticated signature/)
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
