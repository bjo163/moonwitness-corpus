import assert from 'node:assert/strict'
import test from 'node:test'
import { proposeSwing, type ScopedTextRelation, type WitnessComponents } from './index.js'
import {
  CANDIDATE_LEDGER_SCHEMA, deserializeCandidateLedger, serializeCandidateLedger,
  summarizeCandidate, summarizeCandidateLedger, type ReviewedCandidate
} from './research-ledger.js'

const relation: ScopedTextRelation = {
  leftPassageId: 'mw:passage:test:a', rightPassageId: 'mw:passage:test:b',
  relation: 'PARALLELS', method: 'comparative:v8', frame: 'comparative-neutral',
  evidenceIds: ['mw:evidence:zeta', 'mw:evidence:alpha'],
  reviewStatus: 'reviewed', reviewer: 'mw:agent:reviewer'
}
const components: WitnessComponents = {
  sourceFidelity: 25, observability: 25, semanticConsistency: 20, crossReference: 15, nonOverlapping: 15
}
const origin = proposeSwing({ operator: 'direction', subject: 'A', relation: 'is-related-to', object: 'B', depth: 1 })

function candidate(overrides: Partial<ReviewedCandidate> = {}): ReviewedCandidate {
  return {
    id: 'candidate:b', origin, relation,
    supportingEvidenceIds: ['mw:evidence:zeta', 'mw:evidence:alpha'],
    contradictingEvidenceIds: ['mw:evidence:contrary'],
    independentSourceIds: ['mw:source:second', 'mw:source:first'],
    reviewStatus: 'reviewed', reviewer: 'mw:agent:reviewer', components,
    ...overrides
  }
}
/** Insertion-order-different but semantically identical fixtures. */
function ledgerFixtures(): ReviewedCandidate[] {
  return [
    candidate({ id: 'candidate:a' }),
    candidate({ id: 'candidate:b', reviewStatus: 'disputed', relation: { ...relation, relation: 'UNRESOLVED', reviewStatus: 'disputed' } }),
    candidate({
      id: 'candidate:c', reviewStatus: 'draft', reviewer: undefined, components: null,
      contradictingEvidenceIds: [], relation: { ...relation, reviewStatus: 'draft', reviewer: undefined }
    })
  ]
}
const edit = (text: string, mutate: (document: any) => void): string => {
  const document = JSON.parse(text)
  mutate(document)
  return JSON.stringify(document)
}

test('candidate ledger serializes identically whatever order records and evidence arrive in', () => {
  const [a, b, c] = ledgerFixtures()
  const forward = serializeCandidateLedger([a, b, c])
  // Record order and every ID array reordered: still the same canonical bytes.
  assert.equal(serializeCandidateLedger([c, b, a]), forward)
  assert.equal(serializeCandidateLedger([
    {
      ...a, supportingEvidenceIds: [...a.supportingEvidenceIds].reverse(),
      independentSourceIds: [...a.independentSourceIds].reverse(),
      relation: { ...a.relation, evidenceIds: [...a.relation.evidenceIds].reverse() }
    }, b, c
  ]), forward)
  // Roundtrip: same data back, re-serialization byte-identical (canonical text).
  const ledger = deserializeCandidateLedger(forward)
  assert.equal(serializeCandidateLedger(ledger.candidates), forward)
  assert.deepEqual(ledger.candidates.map(entry => entry.id), ['candidate:a', 'candidate:b', 'candidate:c'])
  assert.equal(JSON.parse(forward).schema, CANDIDATE_LEDGER_SCHEMA)
  const [reviewed, disputed, draft] = ledger.candidates
  // Frame, method and origin survive; they are what makes the record attributable.
  assert.deepEqual([reviewed.relation.frame, reviewed.relation.method], ['comparative-neutral', 'comparative:v8'])
  assert.deepEqual(reviewed.origin, origin)
  // Disputed status survives verbatim.
  assert.deepEqual([disputed.reviewStatus, disputed.relation.reviewStatus], ['disputed', 'disputed'])
  // Uncertainty survives: an unassessed rubric stays null and [] stays a recorded empty search.
  assert.equal(draft.components, null)
  assert.deepEqual(draft.contradictingEvidenceIds, [])
  assert.deepEqual(summarizeCandidate(reviewed).contradictingEvidenceIds, ['mw:evidence:contrary'])
  // The roundtrip lost no candidate-level judgement.
  ledger.candidates.forEach((entry, index) => {
    const before = summarizeCandidate([a, b, c][index])
    const after = summarizeCandidate(entry)
    assert.deepEqual([after.publishable, after.contradictionEvidence], [before.publishable, before.contradictionEvidence])
  })
  // Counterreadings survive the codec verbatim, in the reviewer's order.
  const objection = serializeCandidateLedger([candidate({
    relation: { ...relation, counterReadings: ['read as a warning', 'read as a promise'] }
  })])
  const revived = deserializeCandidateLedger(objection).candidates[0]
  assert.deepEqual(revived.relation.counterReadings, ['read as a warning', 'read as a promise'])
  assert.equal(Object.isFrozen(revived.relation.counterReadings), true)
  assert.equal(serializeCandidateLedger([revived]), objection)
})

test('duplicate IDs and a dropped contradiction list are refused, not repaired', () => {
  const same = candidate({ id: 'candidate:same' })
  assert.throws(() => serializeCandidateLedger([same, { ...same }]),
    (error: Error) => error instanceof RangeError && /duplicate candidate id candidate:same/.test(error.message))
  const text = serializeCandidateLedger([candidate()])
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.candidates.push({ ...d.candidates[0] }) })),
    (error: Error) => error instanceof RangeError && /duplicate candidate id candidate:b/.test(error.message))
  // Omitting the array is a dropped search, not "searched, found none".
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { delete d.candidates[0].contradictingEvidenceIds })),
    /is missing contradictingEvidenceIds \(use \[\] or null, never omit it\)/)
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.candidates[0].contradictingEvidenceIds = 'none' })),
    /contradictingEvidenceIds must be an array \(use \[\] when the search found none\)/)
  // Structural refusals.
  assert.throws(() => deserializeCandidateLedger('{'), /not valid JSON/)
  assert.throws(() => deserializeCandidateLedger('[]'), /must be a JSON object/)
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.schema = 'mw-candidate-ledger-v2' })), /schema must be mw-candidate-ledger-v1/)
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.candidates = {} })), /candidates must be an array/)
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.candidates[0].relation = null })), /relation must be an object/)
  assert.throws(() => serializeCandidateLedger([{ ...candidate(), contradictingEvidenceIds: undefined as never }]),
    /cannot be serialized: candidate contradictingEvidenceIds must be an array/)
})

test('a serialized ledger cannot be edited into an approval or an escalated review', () => {
  // Dropping the reviewer from a reviewed record leaves it unrevivable.
  const reviewedText = serializeCandidateLedger([candidate()])
  assert.throws(() => deserializeCandidateLedger(edit(reviewedText, d => { delete d.candidates[0].reviewer })), /review requires reviewer/)
  assert.throws(() => deserializeCandidateLedger(edit(reviewedText, d => { d.candidates[0].reviewer = '   ' })), /review requires reviewer/)
  const text = serializeCandidateLedger([candidate({ id: 'candidate:draft', reviewStatus: 'draft' })])
  // Promoting the candidate alone is refused while the relation stayed draft.
  assert.throws(() => deserializeCandidateLedger(edit(text, d => {
    d.candidates[0].reviewStatus = 'reviewed'; d.candidates[0].relation.reviewStatus = 'draft'
  })), /review requires reviewer, explicit evidence, independent source, and reviewed relation/)
  // A candidate may not carry its own source as independent corroboration.
  assert.throws(() => deserializeCandidateLedger(edit(text, d => {
    d.candidates[0].independentSourceIds = ['mw:evidence:zeta']
  })), /is also cited as candidate evidence, so it is not independent/)
  // Any invented truth/approval field is an unknown field at every depth.
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.candidates[0].automaticCanonicalApproval = true })),
    /has unknown field\(s\): automaticCanonicalApproval/)
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.truth = true })),
    /ledger has unknown field\(s\): truth/)
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.candidates[0].origin.inheritedScore = 40 })),
    /candidate must not inherit score/)
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { delete d.candidates[0].origin.inheritedScore })),
    /origin is missing inheritedScore/)
  assert.throws(() => deserializeCandidateLedger(edit(text, d => { d.candidates[0].components.truthWeight = 5 })),
    /components has unknown field\(s\): truthWeight/)
})

test('a deserialized ledger is an immutable public record', () => {
  const ledger = deserializeCandidateLedger(serializeCandidateLedger(ledgerFixtures()))
  const [reviewed] = ledger.candidates
  assert.equal(Object.isFrozen(ledger), true)
  assert.equal(Object.isFrozen(ledger.candidates), true)
  assert.equal(Object.isFrozen(reviewed), true)
  assert.equal(Object.isFrozen(reviewed.relation), true)
  assert.equal(Object.isFrozen(reviewed.origin), true)
  assert.equal(Object.isFrozen(reviewed.supportingEvidenceIds), true)
  assert.equal(Object.isFrozen(reviewed.contradictingEvidenceIds), true)
  assert.equal(Object.isFrozen(reviewed.independentSourceIds), true)
  assert.equal(Object.isFrozen(reviewed.components), true)
  assert.throws(() => { (reviewed as any).reviewStatus = 'deprecated' }, TypeError)
  assert.throws(() => { (reviewed.relation as any).frame = 'comparative-neutral-rewritten' }, TypeError)
  assert.throws(() => { (reviewed.supportingEvidenceIds as string[]).push('mw:evidence:invented') }, TypeError)
  assert.throws(() => { (ledger.candidates as ReviewedCandidate[]).push(reviewed) }, TypeError)
  assert.throws(() => { (ledger as any).schema = 'mw-candidate-ledger-v2' }, TypeError)
})

test('ledger summary counts disputed and unassessed records instead of hiding them', () => {
  const ledger = deserializeCandidateLedger(serializeCandidateLedger(ledgerFixtures()))
  const summary = summarizeCandidateLedger(ledger)
  assert.deepEqual([
    summary.total, summary.reviewed, summary.disputed, summary.draft,
    summary.unassessed, summary.withContraryEvidence, summary.contrarySearchedNoneFound
  ], [3, 1, 1, 1, 1, 2, 1])
  assert.deepEqual([summary.frames, summary.methods], [['comparative-neutral'], ['comparative:v8']])
  assert.equal(summary.automaticCanonicalApproval, false)
  assert.deepEqual(summarizeCandidateLedger({ schema: CANDIDATE_LEDGER_SCHEMA, candidates: [] }).total, 0)
})
