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
test('a stale or malformed projection fails closed even with a recomputed checksum',()=>{
  const run=oneStageRun()
  const s=createReviewedSnapshot({corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]})
  // Positive: the unchanged projection still verifies byte for byte.
  assert.equal(verifyReviewedPublication(structuredClone(s),corpusHash).projectionSha256,s.projectionSha256)
  const forge=(mutate:(copy:any)=>void):any=>{
    const copy:any=structuredClone(s)
    mutate(copy)
    const {projectionSha256:stale,...projection}=copy
    copy.projectionSha256=sha256Json(projection)
    return copy
  }
  const cases:Array<{label:string;mutate:(copy:any)=>void;error:RegExp}>=[
    {label:'blank reviewer',mutate:c=>{c.records.reviewedAnalyses[0].reviewer=''},
      error:/bad or duplicate reviewed analysis/},
    {label:'truncated input hash',mutate:c=>{c.inputSha256='abc'},error:/input checksum missing/},
    {label:'dropped evidence',mutate:c=>{c.publicSummaries[0].levels[0].evidenceIds=[]},
      error:/unsupported or untraceable public level/},
    {label:'missing source content',mutate:c=>{delete c.publicSummaries[0].levels[0].sourceContentIds},
      error:/unsupported or untraceable public level/},
    {label:'reordered stages',mutate:c=>{
      c.records.reviewedAnalyses[0].maturity=3
      const level=c.publicSummaries[0].levels[0]
      c.publicSummaries[0].levels=[{...level,level:'R2'},{...level,level:'S1'}]
    },error:/reviewed stages are out of order/},
    {label:'unsupported relation',mutate:c=>{c.records.reviewedRelations.push(
      {id:'rel:forged',method:'frame',relation:'PROVES',reviewer:'mw:reviewer:test'})},
      error:/bad or unsupported reviewed relation/},
    {label:'blank relation reviewer',mutate:c=>{c.records.reviewedRelations.push(
      {id:'rel:forged',method:'frame',relation:'AFFIRMS',reviewer:''})},
      error:/bad or unsupported reviewed relation/},
    {label:'duplicate derived id',mutate:c=>{c.records.reviewedRelations.push(
      {id:'run:synthetic:review-1',method:'frame',relation:'AFFIRMS',reviewer:'mw:reviewer:test'})},
      error:/duplicate derived ID/},
    {label:'claim without claimant',mutate:c=>{c.records.attributedClaims.push(
      {id:'miracle:forged',targetPassageId:'mw:passage:test:one',tradition:'islam',method:'frame',
       claimant:'',reviewer:'mw:reviewer:test'})},error:/bad attributed claim/},
    {label:'unknown projection field',mutate:c=>{c.reviewerSignature='attested-by-reviewer'},
      error:/unknown field in reviewed projection: reviewerSignature/},
    {label:'unknown level field',mutate:c=>{c.publicSummaries[0].levels[0].verdict='true'},
      error:/unknown field in public level: verdict/}
  ]
  for (const {label,mutate,error} of cases) {
    assert.throws(()=>verifyReviewedPublication(forge(mutate),corpusHash),error,
      label+' must fail closed even when the checksum is recomputed')
  }
  // Negative: no recomputed checksum can revive a projection from another corpus snapshot.
  assert.throws(()=>verifyReviewedPublication(forge(c=>{c.corpusHash='b'.repeat(64)}),corpusHash),
    /corpus hash mismatch/)
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

function twoStageRun(): AnalysisRun {
  const run=oneStageRun()
  run.claims=[...run.claims,{...run.claims[0],id:'claim:R2',level:'R2',claim:'Synthetic stage two observation',dependsOn:['claim:S1']}]
  const {inputHash:unused,...payload}=run
  run.inputHash=computeAnalysisInputHash(payload)
  return run
}

test('the adversarial matrix fails closed on every forged projection',()=>{
  const base=()=>{
    const run=twoStageRun()
    return createReviewedSnapshot({corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]}) as unknown as Record<string,unknown>
  }
  const forge=(mutate:(p:Record<string,any>)=>void)=>{
    const p=structuredClone(base()) as Record<string,any>
    mutate(p)
    // Every adversarial case recomputes the checksum, so only a real invariant may reject it.
    p.projectionSha256=sha256Json({schema:p.schema,corpusHash:p.corpusHash,methodVersion:p.methodVersion,
      inputSha256:p.inputSha256,authenticatedSignature:p.authenticatedSignature,records:p.records,publicSummaries:p.publicSummaries})
    return p
  }
  const summary=(p:Record<string,any>)=>p.publicSummaries[0] as Record<string,any>
  const levels=(p:Record<string,any>)=>summary(p).levels as Record<string,any>[]
  const cases:[string,RegExp,(p:Record<string,any>)=>void][]=[
    ['wrong schema',/schema mismatch/,p=>{p.schema='srgbl-v8-reviewed-derived-v2'}],
    ['unknown projection field',/unknown field in reviewed projection/,p=>{p.approvedByHuman='someone'}],
    ['missing input checksum',/input checksum missing/,p=>{p.inputSha256='abc'}],
    ['forged signature claim',/not an authenticated signature/,p=>{p.authenticatedSignature=true}],
    ['empty public claims',/missing stage in published reviewed trace/,p=>{summary(p).levels=[]}],
    ['dropped evidence',/unsupported or untraceable public level/,p=>{levels(p)[0].evidenceIds=[]}],
    ['blank claim text',/unsupported or untraceable public level/,p=>{levels(p)[0].claim='   '}],
    ['unknown epistemic kind',/unsupported or untraceable public level/,p=>{levels(p)[0].epistemic='revealed'}],
    ['unreviewed status relabelled',/bad public summary/,p=>{summary(p).status='draft'}],
    ['out-of-order stages',/reviewed stages are out of order/,p=>{p.publicSummaries[0].levels=[levels(p)[1],levels(p)[0]]}],
    ['orphan public summary',/orphan public summary/,p=>{summary(p).passageId='mw:passage:test:other'}],
    ['duplicate analysis identity',/bad or duplicate reviewed analysis/,p=>{p.records.reviewedAnalyses.push(structuredClone(p.records.reviewedAnalyses[0]))}],
    ['unsupported relation type',/bad or unsupported reviewed relation/,p=>{p.records.reviewedRelations.push({id:'rel:forged',method:'textual-research:v8',relation:'PROVES',reviewer:'mw:reviewer:test'})}],
    ['attributed claim without claimant',/bad attributed claim/,p=>{p.records.attributedClaims.push({id:'claim:forged',targetPassageId:'mw:passage:test:one',tradition:'islam',method:'textual-research:v8',claimant:'  ',reviewer:'mw:reviewer:test'})}],
    ['duplicate derived id across types',/duplicate derived ID/,p=>{p.records.reviewedRelations.push({id:'claim:forged',method:'textual-research:v8',relation:'PARALLELS',reviewer:'mw:reviewer:test'});p.records.attributedClaims.push({id:'claim:forged',targetPassageId:'mw:passage:test:one',tradition:'islam',method:'textual-research:v8',claimant:'mw:claimant:test',reviewer:'mw:reviewer:test'})}]
  ]
  for(const [name,expected,mutate] of cases){
    assert.throws(()=>verifyReviewedPublication(forge(mutate),corpusHash),expected,name)
  }
  // Negative: the same fields without a recomputed checksum are rejected by the checksum itself.
  const tampered=structuredClone(base())
  ;(tampered.publicSummaries as Record<string,any>[])[0].levels[0].claim='FORGED CLAIM'
  assert.throws(()=>verifyReviewedPublication(tampered,corpusHash),/projection has changed/,'stale checksum')
  // Negative: a different corpus is never accepted even when everything else is intact.
  assert.throws(()=>verifyReviewedPublication(base(),'b'.repeat(64)),/corpus hash mismatch/,'stale corpus')
  // Positive control: the untouched synthetic publication still verifies, and it is not a human approval.
  const verified=verifyReviewedPublication(base(),corpusHash)
  assert.equal(verified.publicSummaries.length,1)
  const serialized=JSON.stringify(verified)
  // Negative: no forged field survives and a verified synthetic publication is not a human approval.
  for(const forbidden of ['approvedByHuman','authenticatedSignature":true']) assert.equal(serialized.includes(forbidden),false)
})
