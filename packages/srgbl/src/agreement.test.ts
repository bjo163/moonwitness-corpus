import assert from 'node:assert/strict'
import test from 'node:test'
import { computeAgreement } from './agreement.js'
import type { PairedAnnotationCase } from './agreement.js'
import type { KeyAnnotationSubmission } from './keys.js'
import type { ResearchFrame } from './analysis.js'

const frame:ResearchFrame={agent:'curator',recipient:'researcher',domain:'textual',scope:'quran:2:286',genre:'annotation'}
function submission(assessor:string,key:string,overrides:Partial<KeyAnnotationSubmission>={}):KeyAnnotationSubmission{
  return {
    id:'anno:'+assessor+':'+key,passageId:'mw:passage:islam:quran:2:286',assessor,
    scheme:'semantic-core:v0',key,method:'semantic-core:v0',
    justification:'Synthetic fixture for the agreement calculator: '+key+'.',evidenceIds:['mw:evidence:synthetic:'+key],
    frame,status:'submitted',...overrides
  }
}
function paired(a:string,b:string,passageId='mw:passage:islam:quran:2:286'):PairedAnnotationCase{
  return {first:submission('mw:assessor:a',a,{passageId}),
    second:submission('mw:assessor:b',b,{id:'anno:b:'+b+':'+passageId,passageId}),provenance:'synthetic-fixture'}
}

test('a same-scheme paired set produces a coefficient with N, denominators and limits',()=>{
  const report=computeAgreement({scheme:'semantic-core:v0',cases:[
    paired('hope','hope'),paired('hope','hope'),paired('hope','hope'),
    paired('warning','warning'),paired('warning','warning'),paired('hope','warning')
  ]})
  assert.equal(report.offered,6)
  assert.equal(report.comparable,6)
  assert.equal(report.missing,0)
  assert.equal(report.estimable,true)
  assert.ok(Math.abs((report.observedAgreement??0)-5/6)<1e-9)
  // po=5/6, pe=0.5 => kappa=2/3
  assert.ok(Math.abs((report.kappa??0)-2/3)<1e-6)
  assert.ok(report.kappaLimits&&report.kappaLimits.method.includes('asymptotic'))
  assert.ok((report.kappaLimits?.lower??-1)<(report.kappa??0)&&(report.kappaLimits?.upper??1)>(report.kappa??0))
  assert.ok((report.kappaLimits?.lower??-2)>=-1&&(report.kappaLimits?.upper??2)<=1)
  assert.deepEqual(report.exclusions,{missingSecondSubmission:0,invalidSubmission:0,differentPassage:0,differentScheme:0,duplicateAssessor:0})
})

test('missing, invalid, cross-passage, cross-scheme and duplicate-assessor cases are excluded and counted',()=>{
  const report=computeAgreement({scheme:'semantic-core:v0',cases:[
    paired('hope','hope'),paired('warning','warning'),
    {first:submission('mw:assessor:a','hope'),provenance:'synthetic-fixture'},
    {first:submission('mw:assessor:a','hope'),provenance:'synthetic-fixture',
      second:submission('mw:assessor:b','warning',{id:'anno:b:287',passageId:'mw:passage:islam:quran:2:287'})},
    {first:submission('mw:assessor:a','hope'),second:submission('mw:assessor:b','hope',{scheme:'semantic-core:v9'}),provenance:'synthetic-fixture'},
    {first:submission('mw:assessor:a','hope'),second:submission('mw:assessor:b','hope',{id:'anno:b:2',evidenceIds:[]}),provenance:'synthetic-fixture'},
    {first:submission('mw:assessor:a','hope'),second:submission(' MW:Assessor:A ','warning',{id:'anno:a:2'}),provenance:'synthetic-fixture'}
  ]})
  assert.equal(report.offered,7)
  assert.equal(report.comparable,2)
  assert.equal(report.missing,5)
  // A second, registered scheme does not exist yet, so the v9 case fails scheme validation first and
  // lands in invalidSubmission; the differentScheme branch stays reachable only for a ratified scheme.
  assert.deepEqual(report.exclusions,{missingSecondSubmission:1,invalidSubmission:2,differentPassage:1,differentScheme:0,duplicateAssessor:1})
  assert.equal(report.estimable,true)
})

test('insufficient or degenerate paired data is reported as not estimable, never as agreement',()=>{
  const single=computeAgreement({scheme:'semantic-core:v0',cases:[paired('hope','hope')]})
  assert.equal(single.comparable,1)
  assert.equal(single.estimable,false)
  assert.equal(single.kappa,null)
  assert.equal(single.observedAgreement,null)
  assert.equal(single.kappaLimits,null)
  assert.match(single.reason??'',/not estimable/)
  const uniform=computeAgreement({scheme:'semantic-core:v0',cases:[paired('hope','hope'),paired('hope','hope')]})
  assert.equal(uniform.estimable,false)
  assert.equal(uniform.kappa,null)
  assert.match(uniform.reason??'',/chance agreement is 1/)
  assert.throws(()=>computeAgreement({scheme:'semantic-core:v0',cases:[],minComparable:1}),/minComparable/)
})

test('synthetic paired fixtures never satisfy the empirical pilot',()=>{
  const report=computeAgreement({scheme:'semantic-core:v0',cases:[paired('hope','hope'),paired('warning','warning')]})
  assert.equal(report.estimable,true)
  // Negative: a computable coefficient is not evidence of a completed human pilot.
  assert.equal(report.satisfiesPilot,false)
  assert.equal(report.pilotStatus,'blocked-pilot-input')
  assert.deepEqual(report.provenance,['synthetic-fixture'])
})
