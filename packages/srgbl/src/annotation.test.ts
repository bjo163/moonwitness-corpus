import assert from 'node:assert/strict'
import test from 'node:test'
import { collectAnnotationPair, validateAnnotationSubmission } from './keys.js'
import type { KeyAnnotationSubmission } from './keys.js'
import type { ResearchFrame } from './analysis.js'

const frame:ResearchFrame={agent:'curator',recipient:'researcher',domain:'textual',scope:'quran:2:286',genre:'annotation'}
function submission(overrides:Partial<KeyAnnotationSubmission>={}):KeyAnnotationSubmission{
  return {
    id:'anno:synthetic:a-1',passageId:'mw:passage:islam:quran:2:286',assessor:'mw:assessor:a',
    scheme:'semantic-core:v0',key:'hope',method:'semantic-core:v0',
    justification:'Synthetic fixture: the passage is read as a consolation after a burden.',evidenceIds:['mw:evidence:synthetic:a'],
    frame,status:'submitted',...overrides
  }
}

test('two independent submissions with different keys are kept as separate entries',()=>{
  const a=submission()
  const b=submission({id:'anno:synthetic:b-1',assessor:'mw:assessor:b',key:'warning',
    justification:'Synthetic fixture: the same passage is read as a warning about overreach.',evidenceIds:['mw:evidence:synthetic:b']})
  const pair=collectAnnotationPair(a,b)
  assert.deepEqual(pair.errors,[])
  assert.equal(pair.ok,true)
  assert.equal(pair.retained,2)
  assert.equal(pair.adjudicated,false)
  // Positive: the reviewer sees A=hope and B=warning side by side, each with its own justification and evidence.
  assert.deepEqual(pair.entries.map(e=>[e.assessor,e.key,e.evidenceIds[0]]),
    [['mw:assessor:a','hope','mw:evidence:synthetic:a'],['mw:assessor:b','warning','mw:evidence:synthetic:b']])
  assert.ok(pair.entries.every(e=>e.justification.length>20&&e.status==='submitted'))
  // Negative: no field can be mistaken for an adjudicated result.
  const serialized=JSON.stringify(pair)
  for(const forbidden of ['verdict','consensus','agreed','winner']) assert.equal(serialized.includes(forbidden),false)
})

test('a duplicate assessor, a missing submission id or missing evidence fails the paired sample',()=>{
  const a=submission()
  // Negative: one assessor writing twice is not two raters, even with padding or case changes.
  const same=collectAnnotationPair(a,submission({id:'anno:synthetic:a-2',assessor:'  MW:Assessor:A '}))
  assert.equal(same.ok,false)
  assert.ok(same.errors.some(e=>/single assessor cannot stand in/.test(e)))
  assert.equal(same.entries.length,2)
  // Negative: one submission cannot be counted twice.
  const reused=collectAnnotationPair(a,submission({assessor:'mw:assessor:b'}))
  assert.ok(reused.errors.some(e=>/distinct submission ids/.test(e)))
  // Negative: evidence is required on both sides.
  assert.ok(validateAnnotationSubmission(submission({evidenceIds:[]})).some(e=>/evidence required/.test(e)))
  assert.ok(validateAnnotationSubmission(submission({evidenceIds:['  ']})).some(e=>/evidence required/.test(e)))
  const noEvidence=collectAnnotationPair(a,submission({id:'anno:synthetic:b-1',assessor:'mw:assessor:b',evidenceIds:[]}))
  assert.equal(noEvidence.ok,false)
})

test('the annotation intake rejects unsupported schemes, foreign passages, blank justification and any verdict field',()=>{
  assert.ok(validateAnnotationSubmission(submission({scheme:'semantic-core:v9'})).some(e=>/unknown key scheme/.test(e)))
  assert.ok(validateAnnotationSubmission(submission({key:'prosperity'})).some(e=>/not in semantic-core:v0/.test(e)))
  assert.ok(validateAnnotationSubmission(submission({passageId:'quran:2:286'})).some(e=>/must be canonical/.test(e)))
  assert.ok(validateAnnotationSubmission(submission({justification:'   '})).some(e=>/justification required/.test(e)))
  assert.ok(validateAnnotationSubmission(submission({status:'reviewed' as KeyAnnotationSubmission['status']}))
    .some(e=>/status must be submitted or withdrawn/.test(e)))
  const verdict={...submission(),verdict:'agreed'} as unknown as KeyAnnotationSubmission
  assert.ok(validateAnnotationSubmission(verdict).some(e=>/must not carry verdict/.test(e)))
  // Different passages are not a comparable pair.
  const mixedPassage=collectAnnotationPair(submission(),submission({id:'anno:synthetic:b-1',assessor:'mw:assessor:b',
    passageId:'mw:passage:islam:quran:2:287'}))
  assert.ok(mixedPassage.errors.some(e=>/same passage/.test(e)))
  // Different scheme versions are not comparable either.
  const mixedScheme=collectAnnotationPair(submission(),submission({id:'anno:synthetic:b-1',assessor:'mw:assessor:b',
    scheme:'semantic-core:v9'}))
  assert.ok(mixedScheme.errors.some(e=>/share one scheme version/.test(e)))
})
