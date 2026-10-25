import assert from 'node:assert/strict'
import test from 'node:test'
import { KEY_ASSESSMENT_EXTENSION, validateKeyAssessmentExtension } from './assessment-extension.js'
import type { FramedKeyAssessment } from './keys.js'
import type { ResearchFrame } from './analysis.js'
// Relative import on purpose: this is the drift guard between the extension and
// the core schema package, which is not a runtime dependency of @moonwitness/srgbl.
import { CORE_RECORD_TYPES, PROFILE_IDS } from '../../schema/src/index.js'

const frame:ResearchFrame={agent:'curator',recipient:'researcher',domain:'textual',scope:'quran:2:286',genre:'analysis'}
function key(overrides:Partial<FramedKeyAssessment>={}):FramedKeyAssessment {
  return {id:'mw:assessment:ext:1',passageId:'mw:passage:islam:quran:2:286',contentId:'mw:content:islam:quran:2:286:ar',
    key:'mercy',scheme:'semantic-core:v0',method:'test:v8',assessor:'mw:agent:a',reviewer:'mw:agent:reviewer',
    evidenceIds:['mw:evidence:ext'],relation:'expresses',frame,direction:1,intensity:2,confidence:0.8,weight:1,
    reviewStatus:'reviewed',...overrides}
}

test('a key assessment validates as a profile extension of the core assessment record', () => {
  const result = validateKeyAssessmentExtension({...key(), recordType:'assessment', profile:'textual@0.1'})
  assert.deepEqual(result.errors, [])
  assert.equal(result.valid, true)
  assert.equal(result.coreRecordType, 'assessment')
  assert.equal(result.profile, 'textual@0.1')
  assert.equal(result.producesNewCoreSchema, false)
  // The bare record is the same object class, so a wrapper is optional, not required.
  assert.equal(validateKeyAssessmentExtension(key()).valid, true)
})

test('the extension needs no new core record type or profile id', () => {
  assert.ok((CORE_RECORD_TYPES as readonly string[]).includes(KEY_ASSESSMENT_EXTENSION.coreRecordType))
  assert.ok((PROFILE_IDS as readonly string[]).includes(KEY_ASSESSMENT_EXTENSION.profile))
  assert.equal(KEY_ASSESSMENT_EXTENSION.producesNewCoreSchema, false)
  assert.equal(KEY_ASSESSMENT_EXTENSION.producesNewProfile, false)
  // De-duplicated: a repeated field would hide which one is authoritative.
  assert.equal(new Set(KEY_ASSESSMENT_EXTENSION.fields).size, KEY_ASSESSMENT_EXTENSION.fields.length)
  // Every field of a complete record is declared, so nothing is silently core.
  assert.deepEqual(Object.keys(key()).filter(field => !KEY_ASSESSMENT_EXTENSION.fields.includes(field as never)), [])
})

test('a foreign record type, a foreign profile or an undeclared field is rejected', () => {
  const wrongType = validateKeyAssessmentExtension({...key(), recordType:'entity'})
  assert.equal(wrongType.valid, false)
  assert.ok(wrongType.errors.some(error => /must be a core assessment record, not entity/.test(error)))
  const wrongProfile = validateKeyAssessmentExtension({...key(), profile:'source@0.1'})
  assert.ok(wrongProfile.errors.some(error => /profile must be textual@0.1, not source@0.1/.test(error)))
  // A new field is a core-schema change wearing an extension's clothes.
  const smuggled = validateKeyAssessmentExtension({...key(), scriptureRank:1} as unknown as FramedKeyAssessment)
  assert.equal(smuggled.valid, false)
  assert.ok(smuggled.errors.some(error => /undeclared extension field scriptureRank/.test(error)))
})

test('the extension still fails closed on the assessment contract itself', () => {
  const noAssessor = validateKeyAssessmentExtension({...key(), assessor:'   '})
  // The extension does not relax the base rules; it only wraps them.
  assert.ok(noAssessor.errors.includes('key.assessor required'))
  const outOfRange = validateKeyAssessmentExtension({...key(), confidence:2})
  assert.ok(outOfRange.errors.includes('confidence out of range'))
  const unknownToken = validateKeyAssessmentExtension({...key(), key:'prosperity' as never})
  assert.equal(unknownToken.valid, false)
  assert.ok(unknownToken.errors.some(error => /controlled candidate registry/.test(error)))
})
