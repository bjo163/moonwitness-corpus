import assert from 'node:assert/strict'
import test from 'node:test'
import { messageProvenance, validateDerivedMessage } from './message.js'
import { validateKeyMessage, type FramedKeyAssessment, type KeyMessage } from './keys.js'
import type { ResearchFrame } from './analysis.js'

const frame:ResearchFrame={agent:'curator',recipient:'researcher',domain:'textual',scope:'quran:2:286',genre:'derived-message'}
function key(overrides:Partial<FramedKeyAssessment>={}):FramedKeyAssessment {
  return {id:'mw:assessment:msg:1',passageId:'mw:passage:islam:quran:2:286',contentId:'mw:content:islam:quran:2:286:ar',
    key:'hope',scheme:'semantic-core:v0',method:'derived:v0',assessor:'mw:agent:a',reviewer:'mw:agent:reviewer',
    evidenceIds:['mw:evidence:msg'],relation:'promises',frame,direction:2,intensity:3,confidence:0.9,weight:1,
    reviewStatus:'reviewed',...overrides}
}
function message(overrides:Partial<KeyMessage>={}):KeyMessage {
  return {id:'mw:message:msg:1',passageId:'mw:passage:islam:quran:2:286',method:'derived:v0',frame,
    sourceKeyAssessmentIds:[key().id],message:'The passage is read as reassurance after a burden.',
    boundaryNote:'A reading offered by this method, not a claim the text states about itself.',
    contextNote:'Addressed to a community under pressure; the setting is reconstructed, not quoted.',
    evidenceIds:['mw:evidence:msg'],reviewStatus:'reviewed',reviewer:'mw:agent:reviewer',...overrides}
}

test('a derived message carries provenance that never claims to be original scripture', () => {
  assert.deepEqual(validateDerivedMessage(message(),[key()]),[])
  const provenance = messageProvenance(message())
  assert.ok(provenance)
  assert.equal(provenance.derived, true)
  assert.equal(provenance.textIsOriginalScripture, false)
  assert.equal(provenance.reviewStatus, 'reviewed')
  assert.equal(provenance.reviewer, 'mw:agent:reviewer')
  assert.deepEqual([...provenance.sourceKeyAssessmentIds], [key().id])
  assert.deepEqual([...provenance.evidenceIds], ['mw:evidence:msg'])
  // The claim is a literal, so no caller can flip it on a copy of the record.
  assert.throws(() => { (provenance as {textIsOriginalScripture: boolean}).textIsOriginalScripture = true }, TypeError)
  assert.equal(provenance.textIsOriginalScripture, false)
})

test('boundary and context notes must stay distinguishable from the message and from each other', () => {
  const repeatedBoundary = validateDerivedMessage(message({boundaryNote:message().message}),[key()])
  assert.ok(repeatedBoundary.includes('boundary note must describe the limit, not restate the message'))
  const repeatedContext = validateDerivedMessage(message({contextNote:message().message}),[key()])
  assert.ok(repeatedContext.includes('context note must describe the setting, not restate the message'))
  const collapsed = validateDerivedMessage(message({contextNote:message().boundaryNote}),[key()])
  assert.ok(collapsed.includes('boundary note and context note must stay distinguishable'))
  // Whitespace padding is not a difference.
  assert.ok(validateDerivedMessage(message({boundaryNote:'  ' + message().message + '  '}),[key()]).length)
})

test('a message with nothing to trace has no provenance and cannot pass as derived', () => {
  const orphan = message({sourceKeyAssessmentIds:[]})
  assert.equal(messageProvenance(orphan), null)
  assert.ok(validateDerivedMessage(orphan,[key()]).includes('derived message must carry provenance from cited key assessments'))
  // A record without an id, passage or method cannot state where it came from either.
  assert.equal(messageProvenance(message({id:'   '})), null)
  assert.equal(messageProvenance(message({method:''})), null)
})

test('a reviewed message cannot rest on draft keys, and the base contract still applies', () => {
  const draftKey = key({reviewStatus:'draft', reviewer:undefined})
  const reviewed = validateDerivedMessage(message(),[draftKey])
  assert.ok(reviewed.some(error => /reviewed message needs reviewed keys, evidence and reviewer/.test(error)))
  // The envelope validator does not replace the key message rules; it extends them.
  assert.ok(validateKeyMessage(message({boundaryNote:''}),[key()]).length)
  assert.ok(validateDerivedMessage(message({boundaryNote:''}),[key()])[0].startsWith('message.boundaryNote required'))
})
