import assert from 'node:assert/strict'
import test from 'node:test'
import { validateAnalysisRun, diagnoseOffside, type AnalysisRun, type ResearchFrame } from './analysis.js'
import { evaluateFramedKeys, validateKeyMessage, type FramedKeyAssessment } from './keys.js'
import { adaptPassageSources } from './sources.js'
import { validateReviewedCandidate, validateMiracleAttribution, summarizeCandidate } from './research-ledger.js'
import { proposeSwing, type ScopedTextRelation } from './index.js'

const frame: ResearchFrame = {agent:'narrator',recipient:'community',domain:'wisdom',scope:'community',genre:'narrative'}
function fixture():AnalysisRun {
  const levels=['S1','R2','G3','B4','L5'] as const
  return {id:'run:synthetic:1',passageId:'mw:passage:test:a',method:'test:v8',
    methodVersion:'v8-alpha',corpusHash:'hash-test',inputHash:'fixture-test',
    reviewer:'mw:agent:test-reviewer',reviewStatus:'reviewed',
    sourceWitnesses:[{id:'source:1',passageId:'mw:passage:test:a',contentId:'mw:content:test:a',
      sourceId:'mw:source:test',editionId:'mw:edition:test',artifactId:'mw:artifact:test',
      provenanceId:'mw:provenance:test',language:'en',representation:'source_text',rights:'cleared',text:'synthetic test only'}],
    claims:levels.map((level,i)=>({id:'claim:'+level,level,status:'supported' as const,
      epistemic:i<2?'observed' as const:'inferred' as const,
      claim:'synthetic '+level,evidenceIds:['mw:evidence:test:'+i],
      dependsOn:i?['claim:'+levels[i-1]]:[],method:'test:v8',frame,
      sourceContentIds:['mw:content:test:a'],...(level==='L5'?{boundaryNote:'Not scripture or universal truth.'}:{})})),
    uncertainty:{unknowns:[],disagreements:[]}
  }
}
test('end-to-end synthetic S1–L5 has /15 maturity, only when supported & reviewed',()=>{
  const value=validateAnalysisRun(fixture())
  assert.deepEqual(value.errors,[])
  assert.equal(value.maturity.score,15)
  assert.equal(value.publishable,true)
})
test('missing R2 dependency cannot bypass cumulative gates',()=>{
  const run=fixture()
  run.claims[2].dependsOn=[]
  const value=validateAnalysisRun(run)
  assert.ok(value.errors.some(x=>x.includes('G3 supported claim missing')))
  assert.equal(value.publishable,false)
  assert.ok(value.maturity.score<15)
})
test('R2 inference is rejected, and source licence is fail-closed',()=>{
  const run=fixture()
  run.claims[1].epistemic='interpreted'
  let v=validateAnalysisRun(run)
  assert.ok(v.errors.some(x=>x.includes('R2')))
  run.claims[1].epistemic='observed'
  run.sourceWitnesses[0].rights='unknown'
  v=validateAnalysisRun(run)
  assert.ok(v.errors.some(x=>x.includes('source text must be omitted')))
  assert.equal(v.publishable,false)
})
test('missing reviewer, uncertain/dissent or circular refs cannot be promoted',()=>{
  const run=fixture()
  run.reviewer=undefined
  run.claims[0].dependsOn=['claim:L5']
  run.uncertainty.unknowns.push('human verification required')
  const v=validateAnalysisRun(run)
  assert.ok(v.errors.some(x=>x.includes('dependency cycle')))
  assert.ok(v.errors.some(x=>x.includes('reviewer')))
  assert.equal(v.publishable,false)
})
test('OFFSIDE is a candidate frame mismatch, not theological verdict',()=>{
  const o=diagnoseOffside(frame,{recipient:'individual'})
  assert.equal(o.status,'candidate-offside')
  assert.deepEqual(o.differences,['recipient'])
  assert.equal(o.verified,false)
})
test('source adapter preserves exact distinction and never exposes uncleared text',()=>{
  const sample={passage:{id:'mw:passage:test:a'},contents:[{
    id:'mw:content:test:a',text:'DO NOT PUBLISH AS SCRIPTURE',language:'en',representation:'translation',
    edition_id:'mw:edition:test',source_id:'mw:source:test',
    extensions:{source:{artifact:'mw:artifact:test',provenance:'mw:provenance:test'}}
  }],artifacts:[{id:'mw:artifact:test'}],provenance:[{id:'mw:provenance:test'}],evidence:[{id:'mw:evidence:test'}]}
  const no=adaptPassageSources(sample)
  assert.equal(no.sources[0].rights,'unknown')
  assert.equal(no.sources[0].representation,'translation')
  assert.equal(no.sources[0].text,undefined)
  assert.equal(no.defaultLevelStatus,'pending')
  assert.ok(no.gaps.some(g=>g.includes('rights_not_cleared')))
  const yes=adaptPassageSources(sample,{'mw:content:test:a':'cleared'})
  assert.equal(yes.sources[0].text,'DO NOT PUBLISH AS SCRIPTURE')
  assert.deepEqual(yes.gaps,[])
})
function key():FramedKeyAssessment {
  return {id:'mw:assessment:test:1',passageId:'mw:passage:test:a',contentId:'mw:content:test:a',
    key:'hope',scheme:'semantic-core:v0',method:'test:v8',assessor:'mw:agent:a',reviewer:'mw:agent:reviewer',
    evidenceIds:['mw:evidence:test'],relation:'promises',frame,direction:2,intensity:3,confidence:0.9,weight:1,reviewStatus:'reviewed'}
}
test('Key Witness frame scoring is distinct and never invents agreement',()=>{
  const b=evaluateFramedKeys({method:'test:v8',profile:'hope:v8',frame,expectedKeyCount:20,
    assessments:[key()],agreement:null,reviewerCount:1})
  assert.deepEqual(b.errors,[])
  assert.equal(b.direction?.value,2)
  assert.equal(b.n,1)
  assert.equal(b.coverage,0.05)
  assert.equal(b.agreement,null)
  const invalid=evaluateFramedKeys({method:'test:v8',profile:'hope:v8',frame,expectedKeyCount:20,
    assessments:[{...key(),key:'invented_key' as never}],agreement:null,reviewerCount:1})
  assert.equal(invalid.direction,null)
  assert.ok(invalid.errors.length)
})
test('reviewed derived message must keep key and boundary note',()=>{
  const message={id:'msg:test',passageId:'mw:passage:test:a',method:'test:v8',frame,
    sourceKeyAssessmentIds:[key().id],message:'Synthetic',boundaryNote:'Not universal',contextNote:'Test only',
    evidenceIds:['mw:evidence:test'],reviewStatus:'reviewed' as const,reviewer:'mw:agent:reviewer'}
  assert.deepEqual(validateKeyMessage(message,[key()]),[])
  assert.ok(validateKeyMessage({...message,boundaryNote:''},[key()]).length)
})
test('Swing candidates and miracle claims cannot be self-approved as truth',()=>{
  const origin=proposeSwing({operator:'direction',subject:'A',relation:'is-related-to',object:'B',depth:1})
  const relation:ScopedTextRelation={leftPassageId:'mw:passage:test:a',rightPassageId:'mw:passage:test:b',
    relation:'PARALLELS',method:'comparative:v8',frame:'comparative-neutral',
    evidenceIds:['mw:evidence:test'],reviewStatus:'reviewed',reviewer:'mw:agent:reviewer'}
  const candidate={id:'candidate:test',origin,relation,supportingEvidenceIds:['mw:evidence:test'],
    contradictingEvidenceIds:[],independentSourceIds:['mw:source:test'],reviewStatus:'reviewed' as const,
    reviewer:'mw:agent:reviewer',components:null}
  assert.deepEqual(validateReviewedCandidate(candidate),[])
  assert.equal(summarizeCandidate(candidate).publishable,true)
  assert.equal(summarizeCandidate(candidate).automaticMiracleProof,false)
  assert.ok(validateReviewedCandidate({...candidate,reviewer:undefined}).length)
  assert.deepEqual(validateMiracleAttribution({id:'claim:test',targetPassageId:'mw:passage:test:a',
    tradition:'islam',claimant:'mw:agent:test',method:'islamic-interpretive:v8',
    claimText:'Attributed theological claim only',evidenceIds:['mw:evidence:test'],
    reviewStatus:'reviewed',reviewer:'mw:agent:reviewer',empiricallyVerified:false}),[])
})
