import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SRGBL_LEVELS, QUALITY_DIMENSIONS, scoreMaturity, scoreQuality,
  scoreDirection, scoreWitnessCandidate, proposeSwing, validateScopedRelation
} from './index.js'

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
test('quality rubric has exactly 10 bounded integer dimensions', () => {
  assert.equal(QUALITY_DIMENSIONS.length, 10)
  const zero = Object.fromEntries(QUALITY_DIMENSIONS.map(key=>[key,0])) as Parameters<typeof scoreQuality>[0]
  const high = Object.fromEntries(QUALITY_DIMENSIONS.map(key=>[key,4])) as Parameters<typeof scoreQuality>[0]
  assert.deepEqual([scoreQuality(zero).raw,scoreQuality(high).raw,scoreQuality(high).normalized],[0,40,1])
  assert.throws(()=> scoreQuality({...high,sGrounding:5}),RangeError)
  assert.throws(()=> scoreQuality({...high,sGrounding:3.5}),RangeError)
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
