import assert from 'node:assert/strict'
import test from 'node:test'
import {
  appendKeyAnnotation, createKeyAnnotation, readKeyAnnotationLedger,
  summarizePassageAnnotations, type KeyAnnotationInput
} from './annotation-tool.js'

const PASSAGE='mw:passage:islam:quran:2:286'
const frame={agent:'curator',recipient:'researcher',domain:'textual',scope:'quran:2:286',genre:'annotation'}
/** Synthetic ids and wording only: this fixture is a tool test, not a pilot. */
function input(overrides:Partial<KeyAnnotationInput>={}):KeyAnnotationInput {
  return {
    id:'anno:synthetic:a-1',passageId:PASSAGE,assessor:'mw:assessor:a',
    scheme:'semantic-core:v0',key:'hope',relation:'comforts',frame,
    direction:1,intensity:2,confidence:0.7,method:'semantic-core:v0',
    justification:'Synthetic fixture: read as consolation after a burden.',
    evidenceIds:['mw:evidence:synthetic:a'],at:'2026-10-25T01:00:00.000Z',tool:'key-annotate:v0',
    ...overrides
  }
}

test('an annotator records key, relation, frame, direction and confidence as a draft', () => {
  const created=createKeyAnnotation(input())
  assert.deepEqual(created.errors,[])
  const record=created.record!
  assert.equal(record.schema,'mw:key-annotation:v0')
  assert.equal(record.reviewStatus,'draft')
  assert.equal(record.attestsIndependence,false)
  assert.equal(record.attestsCorrectness,false)
  assert.equal(record.relation,'comforts')
  assert.equal(record.direction,1)
  assert.equal(record.intensity,2)
  assert.equal(record.confidence,0.7)
  assert.deepEqual([...record.evidenceIds],['mw:evidence:synthetic:a'])
  // A confident annotator still does not produce a reviewed or adjudicated record.
  const serialized=JSON.stringify(record)
  for (const forbidden of ['"verdict"','"consensus"','"agreed"','"adjudicated"','"reviewed"'])
    assert.equal(serialized.includes(forbidden),false,'annotation must not carry '+forbidden)
})

test('an incomplete or over-claiming submission is refused with the reason', () => {
  assert.ok(createKeyAnnotation(input({relation:'blesses' as never})).errors
    .some(error=>/relation is not a declared relation/.test(error)))
  assert.ok(createKeyAnnotation(input({direction:3 as never})).errors
    .some(error=>/direction is outside/.test(error)))
  assert.ok(createKeyAnnotation(input({intensity:4 as never})).errors
    .some(error=>/intensity is outside/.test(error)))
  assert.ok(createKeyAnnotation(input({confidence:1.4})).errors
    .some(error=>/confidence must be between/.test(error)))
  assert.ok(createKeyAnnotation(input({at:'yesterday'})).errors
    .some(error=>/ISO-8601 instant/.test(error)))
  assert.ok(createKeyAnnotation(input({assessor:'a friend'})).errors
    .some(error=>/assessor must be a canonical mw: reference/.test(error)))
  assert.ok(createKeyAnnotation(input({evidenceIds:[]})).errors
    .some(error=>/evidence required/.test(error)))
  assert.ok(createKeyAnnotation(input({key:'prosperity'})).errors
    .some(error=>/controlled candidate registry/.test(error)))
  assert.ok(createKeyAnnotation(input({justification:'  '})).errors
    .some(error=>/justification required/.test(error)))
  // A field the vocabulary does not define is a defect, not a richer submission.
  assert.ok(createKeyAnnotation({...input(),verdict:'positive'} as unknown as KeyAnnotationInput).errors
    .some(error=>/unknown field in annotation: verdict/.test(error)))
})

test('two assessors are kept side by side, and disagreement is reported without a winner', () => {
  const first=appendKeyAnnotation('',input())
  assert.deepEqual(first.errors,[])
  const a=first.ledger!
  const second=appendKeyAnnotation(a,input({
    id:'anno:synthetic:b-1',assessor:'mw:assessor:b',key:'warning',relation:'warns',
    direction:-1,confidence:0.55,evidenceIds:['mw:evidence:synthetic:b'],
    justification:'Synthetic fixture: read as a warning about overreach.',at:'2026-10-25T01:05:00.000Z'
  }))
  assert.deepEqual(second.errors,[])
  const ledger=second.ledger!
  assert.equal(ledger.split('\n').filter(Boolean).length,2)

  const read=readKeyAnnotationLedger(ledger)
  assert.deepEqual(read.errors,[])
  const summary=summarizePassageAnnotations(read.records,PASSAGE)
  assert.deepEqual(summary.assessors,['mw:assessor:a','mw:assessor:b'])
  assert.equal(summary.paired,true)
  assert.equal(summary.adjudicated,false)
  assert.equal(summary.agreementComputed,false)
  // Both voices survive: neither key is dropped because the other assessor disagreed.
  assert.deepEqual(summary.perAssessor.map(entry=>[entry.assessor,entry.keys]),[
    ['mw:assessor:a',['hope']],['mw:assessor:b',['warning']]
  ])
  assert.deepEqual(summary.keysRecordedOnce,[{key:'hope',assessor:'mw:assessor:a'},{key:'warning',assessor:'mw:assessor:b'}])
  assert.deepEqual(summary.directionConflicts,[])
  assert.match(summary.note,/does not adjudicate, rank or compute agreement/)
  const serialized=JSON.stringify(summary)
  for (const forbidden of ['"verdict"','"consensus"','"winner"','"kappa"','"alpha"']) {
    assert.equal(serialized.includes(forbidden),false,forbidden+' must never appear in the pair view')
  }

  // The same key read in opposite directions is a conflict, not an average.
  const opposed=appendKeyAnnotation(ledger,input({
    id:'anno:synthetic:b-2',assessor:'mw:assessor:b',direction:-2,
    evidenceIds:['mw:evidence:synthetic:b2'],justification:'Synthetic fixture: the same key with the opposite direction.'
  }))
  assert.deepEqual(opposed.errors,[])
  const opposedSummary=summarizePassageAnnotations(readKeyAnnotationLedger(opposed.ledger!).records,PASSAGE)
  assert.deepEqual(opposedSummary.directionConflicts,[{key:'hope',byAssessor:{'mw:assessor:a':1,'mw:assessor:b':-2}}])
})

test('the ledger is append-only and refuses duplicates or a damaged history', () => {
  const first=appendKeyAnnotation('',input())
  const ledger=first.ledger!
  // The same submission id twice would double-count one person.
  assert.ok(appendKeyAnnotation(ledger,input({key:'trust'})).errors
    .some(error=>/duplicate annotation id/.test(error)))
  // The same assessor recording the same key twice is one observation, not two.
  assert.ok(appendKeyAnnotation(ledger,input({id:'anno:synthetic:a-2'})).errors
    .some(error=>/already recorded hope/.test(error)))
  // Appending to a damaged ledger would bury the defect.
  const damaged=ledger+'{not json}\n'
  assert.ok(appendKeyAnnotation(damaged,input({id:'anno:synthetic:a-3',key:'trust'})).errors
    .some(error=>/existing ledger: line 2 is not JSON/.test(error)))
  // An appended line never rewrites or reorders what was already recorded.
  const appended=appendKeyAnnotation(ledger,input({id:'anno:synthetic:a-4',key:'trust'}))
  assert.ok(appended.ledger!.startsWith(ledger))
})

test('a stored record that was edited after the fact is rejected', () => {
  const ledger=appendKeyAnnotation('',input()).ledger!
  const stored=JSON.parse(ledger.trim())
  // An annotator cannot promote their own submission to reviewed.
  const promoted=structuredClone(stored)
  promoted.reviewStatus='reviewed'
  assert.ok(readKeyAnnotationLedger(JSON.stringify(promoted)+'\n').errors
    .some(error=>/cannot review/.test(error)))
  // Nor attest that they were independent or correct.
  const attested=structuredClone(stored)
  attested.attestsCorrectness=true
  assert.ok(readKeyAnnotationLedger(JSON.stringify(attested)+'\n').errors
    .some(error=>/must not attest correctness/.test(error)))
  // A quiet edit to the direction changes the record, so it is not the same submission.
  const edited=structuredClone(stored)
  edited.direction=-1
  assert.ok(readKeyAnnotationLedger(JSON.stringify(edited)+'\n').errors
    .some(error=>/has changed since it was recorded/.test(error)))
  // An injected score is not an annotation field.
  const scored=structuredClone(stored)
  scored.witnessScore=88
  assert.ok(readKeyAnnotationLedger(JSON.stringify(scored)+'\n').errors
    .some(error=>/unknown field in line 1: witnessScore/.test(error)))
})
