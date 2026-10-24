import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SRGBL_LEVELS, QUALITY_DIMENSIONS, scoreMaturity, scoreQuality,
  scoreDirection, scoreWitnessCandidate, proposeSwing, validateScopedRelation,
  type LevelStatus, type LevelStates
} from './index.js'

/** Caller-declared attribution for every quality bundle under test. */
const label = { method: 'test:v8', profile: 'quality:proposal-v8' }

test('v8 has five levels, S1 first and L5 last', () => {
  assert.deepEqual(SRGBL_LEVELS, ['S1','R2','G3','B4','L5'])
})
test('maturity uses supported contiguous prefix and triangular scoring', () => {
  assert.equal(scoreMaturity({}).score, 0)
  assert.equal(scoreMaturity({ S1:'supported' }).score, 1)
  assert.equal(scoreMaturity({ S1:'supported',R2:'supported' }).score, 3)
  assert.equal(scoreMaturity({ S1:'supported',R2:'supported',G3:'supported' }).score, 6)
  assert.equal(scoreMaturity({ S1:'supported',R2:'supported',G3:'supported',B4:'supported' }).score, 10)
  const all = { S1:'supported', R2:'supported', G3:'supported', B4:'supported', L5:'supported' } as const
  assert.deepEqual([scoreMaturity(all).score,scoreMaturity(all).verifiedLevel], [15,'L5'])
  assert.deepEqual([scoreMaturity({S1:'supported',G3:'supported',B4:'supported'}).score,
    scoreMaturity({S1:'supported',G3:'supported',B4:'supported'}).verifiedLevel], [1,'S1'])
  assert.deepEqual(scoreMaturity({S1:'supported',G3:'supported',B4:'supported'}).pending, ['R2','G3','B4','L5'])
  assert.equal(scoreMaturity({ S1:'partial', R2:'supported' }).score, 0)
  assert.equal(scoreMaturity({S1:'supported',R2:'unknown',G3:'supported'}).score,1)
  assert.throws(() => scoreMaturity({ S1:'fake' as never }),RangeError)
})
test('every contiguous maturity gate 0..15 is earned by triangular prefix, never by later levels', () => {
  const prefix = (m: number): LevelStates =>
    Object.fromEntries(SRGBL_LEVELS.slice(0, m).map(level => [level, 'supported'])) as LevelStates
  const triangular = [0, 1, 3, 6, 10, 15]
  for (let m = 0; m <= 5; m++) {
    const result = scoreMaturity(prefix(m))
    assert.deepEqual(
      [result.score, result.verifiedLevel, result.nextLevel, result.max, result.normalized],
      [triangular[m], m ? SRGBL_LEVELS[m - 1] : null, m === 5 ? null : SRGBL_LEVELS[m], 15, triangular[m] / 15]
    )
    assert.deepEqual(result.pending, [...SRGBL_LEVELS.slice(m)])
    assert.equal(result.score, m * (m + 1) / 2)
  }
  // Any unsatisfied level ends the accumulation, whatever is claimed above it.
  for (const status of ['partial', 'pending', 'unsupported', 'unknown'] as LevelStatus[]) {
    const stopped = scoreMaturity({ ...prefix(1), R2: status, G3: 'supported', B4: 'supported', L5: 'supported' })
    assert.equal(stopped.score, 1, status)
    assert.deepEqual([stopped.verifiedLevel, stopped.nextLevel], ['S1', 'R2'], status)
  }
  // An absent level is the same gate failure as an explicitly unsatisfied one.
  assert.equal(scoreMaturity({ S1:'supported', G3:'supported', B4:'supported', L5:'supported' }).score, 1)
})
test('zero evidence weight is UNKNOWN, never neutral, and keeps numerator/denominator symmetric', () => {
  const pos = scoreDirection('recipient=believers','devotional:v8',[{id:'a',direction:2,intensity:3,confidence:1,weight:1}])
  assert.deepEqual([pos.status,pos.value,pos.count],['scored',2,1])
  // Every weight is 0: there is no positive evidence weight, so the result is
  // UNKNOWN - not 0 (a measured neutral) and not NaN.
  const zeroWeight = scoreDirection('recipient=all','test:v8',[
    {id:'a',direction:2,intensity:3,confidence:1,weight:0},
    {id:'b',direction:-2,intensity:3,confidence:1,weight:0}])
  assert.deepEqual([zeroWeight.status,zeroWeight.value],['unknown',null])
  assert.equal(zeroWeight.count,2)
  assert.ok(zeroWeight.reason)
  assert.equal(Number.isNaN(Number(zeroWeight.value)),false)
  // Genuine cancellation still scores a measured 0 and stays distinguishable.
  const cancelled = scoreDirection('recipient=all','test:v8',[
    {id:'a',direction:2,intensity:3,confidence:1,weight:1},
    {id:'b',direction:-2,intensity:3,confidence:1,weight:1}])
  assert.deepEqual([cancelled.status,cancelled.value],['scored',0])
  // An empty bundle has no weight either.
  const empty = scoreDirection('recipient=all','test:v8',[])
  assert.deepEqual([empty.status,empty.value,empty.count],['unknown',null,0])
  // A zero-weight annotation cannot dilute a real one: same factor above and below the line.
  const diluted = scoreDirection('recipient=all','test:v8',[
    {id:'a',direction:2,intensity:1,confidence:1,weight:1},
    {id:'b',direction:-2,intensity:3,confidence:1,weight:0}])
  assert.equal(diluted.value,2)
  // Malformed input is a controlled TypeError, never an uncontrolled crash.
  assert.throws(() => scoreDirection(undefined as never,'test:v8',[]),TypeError)
  assert.throws(() => scoreDirection('recipient=all','test:v8',null as never),TypeError)
  assert.throws(() => scoreDirection('recipient=all','test:v8',[{} as never]),TypeError)
})

test('quality rubric has exactly 10 bounded integer dimensions', () => {
  assert.equal(QUALITY_DIMENSIONS.length, 10)
  const zero = Object.fromEntries(QUALITY_DIMENSIONS.map(key=>[key,0])) as Parameters<typeof scoreQuality>[0]
  const high = Object.fromEntries(QUALITY_DIMENSIONS.map(key=>[key,4])) as Parameters<typeof scoreQuality>[0]
  assert.deepEqual([scoreQuality(zero,label).raw,scoreQuality(high,label).raw,scoreQuality(high,label).normalized],[0,40,1])
  assert.throws(()=> scoreQuality({...high,sGrounding:5},label),RangeError)
  assert.throws(()=> scoreQuality({...high,sGrounding:3.5},label),RangeError)
})
test('quality max stays 40 only for a complete, caller-labelled bundle', () => {
  const full = Object.fromEntries(QUALITY_DIMENSIONS.map(key=>[key,4])) as Parameters<typeof scoreQuality>[0]
  const zero = Object.fromEntries(QUALITY_DIMENSIONS.map(key=>[key,0])) as Parameters<typeof scoreQuality>[0]
  const scored = scoreQuality(full,label)
  assert.deepEqual([scored.raw,scored.max,scored.normalized],[40,40,1])
  assert.deepEqual([scored.method,scored.profile],[label.method,label.profile])
  assert.equal(scored.automaticCanonicalApproval,false)
  // A measured 0 is not the same thing as a missing dimension.
  assert.equal(scoreQuality(zero,label).raw,0)
  const missing = { ...full } as Record<string, number>
  delete missing.confidenceCalibration
  assert.throws(() => scoreQuality(missing as never,label),/quality.confidenceCalibration must be an integer from 0 to 4/)
  assert.throws(() => scoreQuality({ ...full, confidenceCalibration: undefined } as never,label),/quality.confidenceCalibration/)
  assert.throws(() => scoreQuality({ ...full, confidenceCalibration: 4.1 } as never,label),/quality.confidenceCalibration/)
  // An extra field is not silently echoed as a rubric dimension.
  assert.throws(() => scoreQuality({ ...full, inventedDimension: 4 } as never,label),/unknown quality dimension: inventedDimension/)
  // A score must be attributable to a declared method/profile.
  assert.throws(() => scoreQuality(full,undefined as never),/method and profile/)
  assert.throws(() => scoreQuality(full,{ method:'  ', profile:'quality:v8' }),/method and profile/)
  assert.throws(() => scoreQuality(null as never,label),TypeError)
})
test('direction stays in -2..2; zero-weight input is UNKNOWN, not neutral', () => {
  const pos=scoreDirection('recipient=believers','devotional:v8',[{id:'a',direction:2,intensity:3,confidence:1,weight:1}])
  assert.deepEqual([pos.status,pos.value],['scored',2])
  const neg=scoreDirection('recipient=opponents','legal:v8',[{id:'a',direction:-2,intensity:3,confidence:1,weight:1}])
  assert.equal(neg.value,-2)
  const mix=scoreDirection('recipient=all','test:v8',[
    {id:'a',direction:-2,intensity:3,confidence:1,weight:1},
    {id:'b',direction:2,intensity:3,confidence:1,weight:1}
  ])
  assert.equal(mix.value,0)
  const unknown=scoreDirection('recipient=all','test:v8',[{id:'a',direction:2,intensity:1,confidence:0,weight:1}])
  assert.deepEqual([unknown.status,unknown.value],['unknown',null])
  assert.throws(()=>scoreDirection('','test',[]),TypeError)
  assert.throws(()=>scoreDirection('f','p',[{id:'a',direction:3,intensity:1,confidence:1,weight:1}]),RangeError)
  assert.throws(()=>scoreDirection('f','p',[
    {id:'a',direction:1,intensity:1,confidence:1,weight:1},
    {id:'a',direction:1,intensity:1,confidence:1,weight:1}
  ]),TypeError)
})
test('legacy Witness 100 scoring never canonicalizes even maximum', () => {
  const score=scoreWitnessCandidate({sourceFidelity:25,observability:25,semanticConsistency:20,crossReference:15,nonOverlapping:15})
  assert.equal(score.raw,100)
  assert.equal(score.reviewEligibility,'eligible-for-review')
  assert.equal(score.automaticCanonicalApproval,false)
  assert.throws(()=>scoreWitnessCandidate({sourceFidelity:26,observability:25,semanticConsistency:20,crossReference:15,nonOverlapping:15}),RangeError)
})
test('Swing always makes unverified candidate, depth-limited, no inherited score', () => {
  const r=proposeSwing({operator:'cause-effect',subject:'A',relation:'causes',object:'B',depth:1})
  assert.equal(r.relation,'candidate-possible-cause-of')
  assert.equal(r.state,'candidate')
  assert.equal(r.inheritedScore,null)
  assert.throws(()=>proposeSwing({operator:'direction',subject:'A',relation:'related-to',object:'B',depth:4}),RangeError)
  assert.throws(()=>proposeSwing({operator:'direction',subject:'A',relation:'related-to',object:'B',depth:2,seenSignatures:[
    proposeSwing({operator:'direction',subject:'A',relation:'related-to',object:'B',depth:1}).signature
  ]}),RangeError)
})
test('cross-text correction always requires a non-neutral frame; reviewed requires reviewer and evidence', () => {
  const valid={leftPassageId:'mw:passage:quran:5:48',rightPassageId:'mw:passage:example',
    relation:'CORRECTS_WITHIN_FRAME',method:'quran-anchored:v8',frame:'islamic-quran-anchored',
    evidenceIds:['mw:evidence:test'],reviewer:'mw:agent:reviewer',reviewStatus:'reviewed'} as const
  assert.doesNotThrow(()=>validateScopedRelation({...valid,evidenceIds:[...valid.evidenceIds]}))
  assert.throws(()=>validateScopedRelation({...valid,frame:'comparative-neutral',evidenceIds:[...valid.evidenceIds]}),RangeError)
  assert.throws(()=>validateScopedRelation({...valid,reviewer:undefined,evidenceIds:[...valid.evidenceIds]}),TypeError)
  assert.throws(()=>validateScopedRelation({...valid,evidenceIds:[]}),TypeError)
})
