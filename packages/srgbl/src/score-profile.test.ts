import assert from 'node:assert/strict'
import test from 'node:test'
import { RESEARCH_SCORE_PROFILES, SCORE_PROFILE_SCOPES, computeScoreProfile } from './score-profile.js'
import { evaluateFramedKeys, type FramedKeyAssessment } from './keys.js'
import type { ResearchFrame } from './analysis.js'

const frame:ResearchFrame={agent:'curator',recipient:'researcher',domain:'textual',scope:'quran:2:286',genre:'analysis'}
function key(overrides:Partial<FramedKeyAssessment>={}):FramedKeyAssessment {
  return {id:'mw:assessment:sp:1',passageId:'mw:passage:islam:quran:2:286',contentId:'mw:content:islam:quran:2:286:ar',
    key:'hope',scheme:'semantic-core:v0',method:'derived:v0',assessor:'mw:agent:a',reviewer:'mw:agent:reviewer',
    evidenceIds:['mw:evidence:sp'],relation:'promises',frame,direction:2,intensity:3,confidence:0.9,weight:1,
    reviewStatus:'reviewed',...overrides}
}
const bundle = (overrides:Record<string,unknown>={}) => ({
  method:'derived:v0',profile:'key-direction:v0',frame,expectedKeyCount:20,
  assessments:[key()],agreement:0.72,reviewerCount:2,...overrides
})

test('the v0 profile reports direction only beside coverage, n and agreement', () => {
  const profile = computeScoreProfile(bundle() as never)
  assert.deepEqual(profile.errors,[])
  assert.equal(profile.direction,evaluateFramedKeys(bundle() as never).direction?.value)
  assert.equal(profile.coverage,0.05)
  assert.equal(profile.n,1)
  assert.equal(profile.uniqueKeyCount,1)
  assert.equal(profile.agreement,0.72)
  assert.equal(profile.reviewerCount,2)
  assert.equal(profile.displayable,true)
  assert.equal(profile.isGlobalScriptureScore,false)
  assert.equal(profile.scope,'passage-frame')
  // One key of twenty expected is stated as a gap, not folded into the number.
  assert.ok(profile.missing.includes('coverage:1/20'))
})

test('an unmeasured agreement or an unrated bundle is shown as missing, not as neutral', () => {
  const profile = computeScoreProfile(bundle({agreement:null}) as never)
  assert.deepEqual(profile.errors,[])
  assert.notEqual(profile.direction,null)
  assert.ok(profile.missing.includes('agreement:not-measured'))
  assert.equal(profile.displayable,false)
  assert.equal(profile.coverage,0.05)
  const noReviewers = computeScoreProfile(bundle({reviewerCount:0}) as never)
  assert.ok(noReviewers.missing.includes('reviewers:none'))
  assert.equal(noReviewers.displayable,false)
  const empty = computeScoreProfile(bundle({assessments:[]}) as never)
  assert.ok(empty.missing.includes('assessments:none'))
  assert.equal(empty.n,0)
})

test('aggregation beyond one passage is refused and reported as null, never as zero', () => {
  const tradition = computeScoreProfile(bundle({scope:'tradition' as never}) as never)
  assert.ok(tradition.errors.some(error => /scope tradition would aggregate beyond one passage/.test(error)))
  assert.equal(tradition.direction,null)
  assert.equal(tradition.coverage,null)
  assert.ok(tradition.missing.includes('profile:invalid'))
  assert.deepEqual([...SCORE_PROFILE_SCOPES],['passage','passage-frame'])
  assert.deepEqual([...RESEARCH_SCORE_PROFILES],['key-direction:v0'])
})

test('the profile stays research-only and inherits the assessment rules', () => {
  const published = computeScoreProfile(bundle({publicationSurface:'public'}) as never)
  assert.ok(published.errors.some(error => /research-only and may not be published/.test(error)))
  assert.equal(published.direction,null)
  assert.equal(published.displayable,false)
  const invented = computeScoreProfile(bundle({profileId:'positive-verse:v9'}) as never)
  assert.ok(invented.errors.some(error => /unknown research score profile/.test(error)))
  // A bad key assessment is not silently averaged out of the profile.
  const badKey = computeScoreProfile(bundle({assessments:[key({key:'prosperity' as never})]}) as never)
  assert.ok(badKey.errors.some(error => /controlled candidate registry/.test(error)))
  assert.equal(badKey.direction,null)
  assert.ok(badKey.missing.includes('coverage:uncomputable'))
})
