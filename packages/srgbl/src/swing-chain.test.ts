import assert from 'node:assert/strict'
import test from 'node:test'
import { proposeSwing, proposeSwingChain, SWING_OPERATORS } from './index.js'
import { validateReviewedCandidate, type ReviewedCandidate } from './research-ledger.js'

const start={subject:'mw:entity:researcher',relation:'observes',object:'mw:passage:work:1:1'}

test('all seven Swing operators remain unverified candidates without inherited scores', () => {
  for (const operator of SWING_OPERATORS) {
    const candidate = proposeSwing({ ...start, operator, depth: 1 })
    assert.equal(candidate.operator,operator)
    assert.equal(candidate.state,'candidate')
    assert.equal(candidate.evidenceStatus,'unverified')
    assert.equal(candidate.inheritedScore,null)
    assert.equal(candidate.depth,1)
    assert.ok(candidate.signature)
  }
})

test('each Swing operator yields a distinct candidate record and signature', () => {
  const candidates = SWING_OPERATORS.map(operator => proposeSwing({ ...start, operator, depth: 1 }))
  assert.equal(candidates.length,7)
  assert.equal(new Set(candidates.map(candidate => candidate.signature)).size,7)
  assert.equal(new Set(candidates.map(candidate => candidate.relation)).size,7)
  const triples = candidates.map(candidate => JSON.stringify([candidate.subject,candidate.relation,candidate.object]))
  assert.equal(new Set(triples).size,7)
  // A transformation must actually transform; none may echo the origin triple as its own candidate.
  assert.ok(triples.every(triple => triple !== JSON.stringify([start.subject,start.relation,start.object])))
  // A reversal is never asserted: no candidate may claim truth, review or an inherited score.
  for (const candidate of candidates) {
    assert.equal(candidate.state,'candidate')
    assert.equal(candidate.evidenceStatus,'unverified')
    assert.equal(candidate.inheritedScore,null)
    assert.deepEqual(Object.keys(candidate).sort(),
      ['depth','evidenceStatus','inheritedScore','object','operator','relation','signature','state','subject'])
  }
})

test('Swing chain applies no more than three rotations and tracks each depth', () => {
  const chain = proposeSwingChain(start, ['direction','perspective','temporal'])
  assert.equal(chain.stop,'complete')
  assert.deepEqual(chain.candidates.map(candidate=>candidate.depth),[1,2,3])
  assert.ok(chain.candidates.every(candidate=>candidate.inheritedScore===null&&candidate.evidenceStatus==='unverified'))
  assert.throws(()=>proposeSwingChain(start,['direction','perspective','temporal','polarity']),/Maximum swing depth/)
})

test('caller-supplied path history rejects duplicate candidates and exact relation cycles', () => {
  const candidate = proposeSwing({ ...start, operator: 'direction', depth: 1 })
  assert.throws(() => proposeSwing({ ...start, operator: 'direction', depth: 2, seenSignatures: [candidate.signature] }), /duplicate candidate/)
  assert.throws(() => proposeSwing({ ...start, operator: 'direction', depth: 2, seenRelations: [{
    subject: candidate.subject, relation: candidate.relation, object: candidate.object
  }] }), /cycle detected/)
})

test('reviewed Swing support needs independent sources and reviewed evidence, never an inherited score', () => {
  const origin = proposeSwing({ ...start, operator: 'direction', depth: 1 })
  const candidate: ReviewedCandidate = {
    id: 'mw:research:candidate:swing-test', origin,
    relation: { leftPassageId: start.object, rightPassageId: 'mw:passage:other:1:1', relation: 'PARALLELS', method: 'test:v1', frame: 'comparative-neutral', evidenceIds: ['mw:evidence:relation'], reviewer: 'mw:reviewer:test', reviewStatus: 'reviewed' },
    supportingEvidenceIds: ['mw:evidence:support'], contradictingEvidenceIds: [], independentSourceIds: ['mw:source:independent'],
    reviewStatus: 'reviewed', reviewer: 'mw:reviewer:test', components: null
  }
  assert.deepEqual(validateReviewedCandidate(candidate), [])
  candidate.independentSourceIds = []
  assert.ok(validateReviewedCandidate(candidate).some(error => error.includes('independent source')))
})
