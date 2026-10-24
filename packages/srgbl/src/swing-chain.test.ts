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
