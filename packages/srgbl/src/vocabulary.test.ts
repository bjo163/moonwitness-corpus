import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CONTROLLED_VOCABULARIES, DIRECTION_VALUES, FRAME_FIELDS, INTENSITY_VALUES, RELATION_VOCABULARY,
  REVIEW_STATUS_VALUES, RIGHTS_STATUS_VALUES, validateVocabularyEntry
} from './vocabulary.js'
import { KEY_RELATIONS, validateKeyAssessment, validateKeyMessage, type FramedKeyAssessment, type KeyMessage } from './keys.js'
import { validateResearchFrame, type ResearchFrame } from './analysis.js'

const frame:ResearchFrame={agent:'curator',recipient:'researcher',domain:'textual',scope:'quran:2:286',genre:'analysis'}
function key(overrides:Partial<FramedKeyAssessment>={}):FramedKeyAssessment {
  return {id:'mw:assessment:vocab:1',passageId:'mw:passage:islam:quran:2:286',contentId:'mw:content:islam:quran:2:286:ar',
    key:'hope',scheme:'semantic-core:v0',method:'test:v8',assessor:'mw:agent:a',reviewer:'mw:agent:reviewer',
    evidenceIds:['mw:evidence:vocab'],relation:'promises',frame,direction:2,intensity:3,confidence:0.9,weight:1,
    reviewStatus:'reviewed',...overrides}
}
const loose = (value:unknown) => value as never

test('the declared vocabularies are the ones the validators actually use', () => {
  // A second copy of a list is how two checks start disagreeing.
  assert.deepEqual([...KEY_RELATIONS], [...RELATION_VOCABULARY])
  assert.deepEqual([...CONTROLLED_VOCABULARIES.relation], [...RELATION_VOCABULARY])
  assert.deepEqual([...DIRECTION_VALUES], [-2,-1,0,1,2])
  assert.deepEqual([...INTENSITY_VALUES], [1,2,3])
  assert.deepEqual([...REVIEW_STATUS_VALUES], ['draft','reviewed','disputed','deprecated'])
  assert.deepEqual([...RIGHTS_STATUS_VALUES], ['cleared','restricted','unknown'])
  // Every declared frame field is required by the frame validator.
  for (const field of FRAME_FIELDS) {
    const broken = {...frame, [field]: '   '}
    assert.ok(validateResearchFrame(broken).includes('frame.' + field + ' is missing'), 'blank ' + field + ' was accepted')
  }
})

test('every declared value is accepted and every neighbour is rejected', () => {
  for (const direction of DIRECTION_VALUES) assert.deepEqual(validateKeyAssessment(key({direction})), [], 'direction ' + direction)
  for (const bad of [3, -3, 1.5, 'high']) assert.ok(validateKeyAssessment(key({direction:loose(bad)})).includes('direction out of range'), 'direction ' + bad)
  for (const intensity of INTENSITY_VALUES) assert.deepEqual(validateKeyAssessment(key({intensity})), [], 'intensity ' + intensity)
  for (const bad of [0, 4, 2.5]) assert.ok(validateKeyAssessment(key({intensity:loose(bad)})).includes('intensity out of range'), 'intensity ' + bad)
  for (const relation of RELATION_VOCABULARY) assert.deepEqual(validateKeyAssessment(key({relation:loose(relation)})), [], 'relation ' + relation)
  assert.ok(validateKeyAssessment(key({relation:loose('outranks')})).includes('invalid key relation'))
  for (const reviewStatus of REVIEW_STATUS_VALUES) assert.deepEqual(validateKeyAssessment(key({reviewStatus})), [], 'status ' + reviewStatus)
  // An unregistered status used to pass silently; it is now unreadable state.
  assert.ok(validateKeyAssessment(key({reviewStatus:loose('approved')})).includes('invalid review status'))
})

test('an unregistered review status is rejected on the derived message too', () => {
  const message:KeyMessage={id:'msg:vocab',passageId:'mw:passage:islam:quran:2:286',method:'test:v8',frame,
    sourceKeyAssessmentIds:[key().id],message:'Synthetic message',boundaryNote:'Not a universal claim',
    contextNote:'Fixture only',evidenceIds:['mw:evidence:vocab'],reviewStatus:'reviewed',reviewer:'mw:agent:reviewer'}
  assert.deepEqual(validateKeyMessage(message,[key()]),[])
  assert.ok(validateKeyMessage({...message,reviewStatus:loose('approved')},[key()]).includes('invalid review status'))
})

test('the generic vocabulary probe separates missing, unknown and out-of-vocabulary values', () => {
  assert.deepEqual(validateVocabularyEntry('relation','promises'),[])
  assert.deepEqual(validateVocabularyEntry('intensity',1),[])
  assert.deepEqual(validateVocabularyEntry('relation','outranks'),['relation is not a controlled value: outranks'])
  assert.deepEqual(validateVocabularyEntry('direction',undefined),['direction is missing'])
  assert.deepEqual(validateVocabularyEntry('direction',null),['direction is missing'])
  assert.deepEqual(validateVocabularyEntry('reviewStatus',''),['reviewStatus is missing'])
  // A probe for a vocabulary that does not exist must not read as valid.
  assert.deepEqual(validateVocabularyEntry('planet' as never,'mars'),['unknown controlled vocabulary planet'])
})
