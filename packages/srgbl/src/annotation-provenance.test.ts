import assert from 'node:assert/strict'
import test from 'node:test'
import { recordAnnotationProvenance, validateAnnotationProvenance, type AnnotationProvenance } from './annotation-provenance.js'
import type { KeyAnnotationSubmission } from './keys.js'
import type { ResearchFrame } from './analysis.js'

const frame:ResearchFrame={agent:'curator',recipient:'researcher',domain:'textual',scope:'quran:2:286',genre:'annotation'}
function submission(overrides:Partial<KeyAnnotationSubmission>={}):KeyAnnotationSubmission {
  return {id:'anno:wf:a-1',passageId:'mw:passage:islam:quran:2:286',assessor:'mw:assessor:a',
    scheme:'semantic-core:v0',key:'hope',method:'semantic-core:v0',
    justification:'Synthetic fixture: the passage is read as consolation after a burden.',
    evidenceIds:['mw:evidence:prov:a'],frame,status:'submitted',...overrides}
}

test('a recorded annotation keeps assessor, method, time and evidence together', () => {
  const record = submission()
  const result = recordAnnotationProvenance({submission:record,at:'2026-10-01T09:00:00Z',tool:'titik-tengah:v0'})
  assert.deepEqual(result.errors,[])
  assert.ok(result.provenance)
  assert.equal(result.provenance.assessor,'mw:assessor:a')
  assert.equal(result.provenance.method,'semantic-core:v0')
  assert.equal(result.provenance.at,'2026-10-01T09:00:00Z')
  assert.equal(result.provenance.submissionId,'anno:wf:a-1')
  assert.equal(result.provenance.id,'mw:provenance:annotation:anno:wf:a-1')
  assert.equal(result.provenance.tool,'titik-tengah:v0')
  assert.equal(result.provenance.derivedFromKeyAssessmentId,null)
  // The evidence list is a copy: a later edit to the submission cannot rewrite history.
  record.evidenceIds.push('mw:evidence:injected')
  assert.deepEqual([...result.provenance.evidenceIds],['mw:evidence:prov:a'])
})

test('provenance describes who recorded it and never who won', () => {
  const result = recordAnnotationProvenance({submission:submission(),at:'2026-10-01T09:00:00Z'})
  assert.equal(result.provenance?.attestsIndependence,false)
  assert.equal(result.provenance?.attestsCorrectness,false)
  assert.ok(Object.isFrozen(result.provenance))
  const smuggled = {...result.provenance, verdict:'agreed'} as unknown as AnnotationProvenance
  assert.ok(validateAnnotationProvenance(smuggled).some(error => /provenance must not carry verdict/.test(error)))
  const merged = {...result.provenance, consensus: true} as unknown as AnnotationProvenance
  assert.ok(validateAnnotationProvenance(merged).some(error => /provenance must not carry consensus/.test(error)))
})

test('an incomplete provenance record is refused rather than stored with blanks', () => {
  const noTime = recordAnnotationProvenance({submission:submission(),at:''})
  assert.equal(noTime.provenance,null)
  assert.ok(noTime.errors.includes('provenance.at required'))
  const badTime = recordAnnotationProvenance({submission:submission(),at:'last tuesday'})
  assert.equal(badTime.provenance,null)
  assert.ok(badTime.errors.some(error => /provenance.at is not an ISO-8601 instant/.test(error)))
  // A submission that fails intake cannot gain provenance.
  const noEvidence = recordAnnotationProvenance({submission:submission({evidenceIds:[]}),at:'2026-10-01T09:00:00Z'})
  assert.equal(noEvidence.provenance,null)
  assert.ok(noEvidence.errors.some(error => error === 'submission: annotation evidence required'))
  const foreignPassage = recordAnnotationProvenance({submission:submission({passageId:'quran:2:286'}),at:'2026-10-01T09:00:00Z'})
  assert.ok(foreignPassage.errors.some(error => /must be canonical/.test(error)))
  const looseRef = recordAnnotationProvenance({submission:submission(),at:'2026-10-01T09:00:00Z',derivedFromKeyAssessmentId:'assessment-1'})
  assert.ok(looseRef.errors.some(error => /derivedFromKeyAssessmentId must be a canonical mw: reference/.test(error)))
})

test('two assessors on one passage produce two separate rows', () => {
  const a = recordAnnotationProvenance({submission:submission(),at:'2026-10-01T09:00:00Z'})
  const b = recordAnnotationProvenance({submission:submission({id:'anno:wf:b-1',assessor:'mw:assessor:b',key:'warning',
    justification:'Synthetic fixture: the same passage is read as a bounded warning.',evidenceIds:['mw:evidence:prov:b']}),
    at:'2026-10-01T09:30:00Z'})
  assert.deepEqual(a.errors,[])
  assert.deepEqual(b.errors,[])
  assert.notEqual(a.provenance?.id,b.provenance?.id)
  assert.equal(a.provenance?.passageId,b.provenance?.passageId)
  assert.equal(a.provenance?.method,b.provenance?.method)
  // Nothing merges them: the pair stays two records.
  assert.notEqual(a.provenance?.assessor,b.provenance?.assessor)
})
