import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SRGBL_LEVELS, QUALITY_DIMENSIONS, scoreMaturity, scoreQuality,
  scoreDirection, scoreWitnessCandidate, proposeSwing, validateScopedRelation, resolveRelationSources,
  selectLens, readRelationLens, compareRelationLens, RESEARCH_LENSES,
  type LevelStatus, type LevelStates, type ScopedTextRelation
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
test('Witness bounds are integer, component-capped and eligibility never grants truth', () => {
  const zero = scoreWitnessCandidate({sourceFidelity:0,observability:0,semanticConsistency:0,crossReference:0,nonOverlapping:0})
  assert.deepEqual([zero.raw,zero.reviewEligibility], [0,'needs-more-evidence'])
  // The components sum to at most 100 by construction; each cap is enforced exactly.
  assert.equal(scoreWitnessCandidate({sourceFidelity:25,observability:25,semanticConsistency:20,crossReference:15,nonOverlapping:15}).raw, 100)
  for (const [key, max] of Object.entries({sourceFidelity:25,observability:25,semanticConsistency:20,crossReference:15,nonOverlapping:15})) {
    const atMax = {sourceFidelity:0,observability:0,semanticConsistency:0,crossReference:0,nonOverlapping:0,[key]:max}
    assert.equal(scoreWitnessCandidate(atMax).raw, max, key)
    assert.throws(() => scoreWitnessCandidate({...atMax,[key]:max+1}), RangeError, key)
  }
  // The 70 threshold is a review gate, not an approval: 69 / 70 / 100 all stay candidates.
  const edge = (cross: number) => scoreWitnessCandidate({sourceFidelity:25,observability:25,semanticConsistency:19,crossReference:cross,nonOverlapping:0})
  assert.equal(edge(0).raw, 69)
  assert.equal(edge(0).reviewEligibility, 'needs-more-evidence')
  assert.equal(edge(1).raw, 70)
  assert.equal(edge(1).reviewEligibility, 'eligible-for-review')
  for (const score of [edge(1), scoreWitnessCandidate({sourceFidelity:25,observability:25,semanticConsistency:20,crossReference:15,nonOverlapping:15})]) {
    assert.equal(score.automaticCanonicalApproval,false)
    assert.equal('approved' in score, false)
  }
  // Non-integers, negatives, missing fields and invented fields are all refused.
  const full = {sourceFidelity:25,observability:25,semanticConsistency:20,crossReference:15,nonOverlapping:15}
  assert.throws(() => scoreWitnessCandidate({...full,sourceFidelity:24.5}), RangeError)
  assert.throws(() => scoreWitnessCandidate({...full,observability:-1}), RangeError)
  assert.throws(() => scoreWitnessCandidate({sourceFidelity:25} as never), RangeError)
  assert.throws(() => scoreWitnessCandidate({...full,inventedComponent:1} as never), /unknown witness component: inventedComponent/)
  assert.throws(() => scoreWitnessCandidate(null as never), TypeError)
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
test('cross-text relation keeps structural validation separate from repository lookup', () => {
  const base:ScopedTextRelation={leftPassageId:'mw:passage:quran:5:48',rightPassageId:'mw:passage:example',
    relation:'PARALLELS',method:'comparative:v8',frame:'comparative-neutral',
    evidenceIds:['mw:evidence:test'],reviewer:'mw:agent:reviewer',reviewStatus:'reviewed'}
  // Structural layer: no repository required, and it rejects fuzzy or one-sided records.
  assert.doesNotThrow(()=>validateScopedRelation(base))
  assert.throws(()=>validateScopedRelation({...base,leftPassageId:'Quran 5:48'}),/exact mw:passage IDs, not references/)
  assert.throws(()=>validateScopedRelation({...base,rightPassageId:'mw:passages:b'}),/exact mw:passage IDs/)
  assert.throws(()=>validateScopedRelation({...base,rightPassageId:base.leftPassageId}),/two distinct passages/)
  assert.throws(()=>validateScopedRelation({...base,evidenceIds:['mw:evidence:a','mw:evidence:a']}),/Evidence IDs must be unique/)
  assert.throws(()=>validateScopedRelation({...base,relation:'PROMISES' as never}),RangeError)
  // Lookup layer: a confirmed pair plus evidence is publishable as attributed review only.
  const known=new Set(['mw:passage:quran:5:48','mw:passage:example','mw:evidence:test'])
  const resolved=resolveRelationSources(base,{hasPassage:id=>known.has(id),hasEvidence:id=>known.has(id)})
  assert.deepEqual(resolved.unresolved,[])
  assert.deepEqual(resolved.endpoints.map(endpoint=>endpoint.status),['resolved','resolved','resolved'])
  assert.deepEqual([resolved.publishable,resolved.automaticCanonicalApproval],[true,false])
  // One missing endpoint blocks publication and never rewrites the record.
  const before=JSON.stringify(base)
  const missing=resolveRelationSources(base,{hasPassage:id=>id!=='mw:passage:example',hasEvidence:()=>true})
  assert.deepEqual(missing.unresolved,['right mw:passage:example is missing from the repository'])
  assert.equal(missing.publishable,false)
  assert.equal(JSON.stringify(base),before)
  // Abstention and an absent hook fail closed instead of assuming existence.
  const abstained=resolveRelationSources(base,{hasPassage:()=>undefined,hasEvidence:()=>undefined})
  assert.equal(abstained.endpoints.every(endpoint=>endpoint.status==='unavailable'),true)
  assert.equal(abstained.unresolved.length,3)
  assert.ok(abstained.unresolved.every(reason=>reason.endsWith('is unresolvable: no lookup answered')))
  const noHooks=resolveRelationSources(base,{})
  assert.deepEqual([noHooks.publishable,noHooks.endpoints[0].status],[false,'unavailable'])
  // The repository is never consulted for a structurally invalid record.
  let asked=0
  assert.throws(()=>resolveRelationSources({...base,rightPassageId:'not-a-passage'},
    {hasPassage:()=>{asked++;return true}}),TypeError)
  assert.equal(asked,0)
  // A draft record is not publishable even when every endpoint resolves.
  assert.equal(resolveRelationSources({...base,reviewStatus:'draft'},
    {hasPassage:()=>true,hasEvidence:()=>true}).publishable,false)
})
test('lens is chosen explicitly and a UI filter can never rewrite a stored frame', () => {
  assert.deepEqual(RESEARCH_LENSES,['neutral','quran-anchored'])
  const neutral=selectLens('neutral')
  const anchored=selectLens('quran-anchored')
  assert.deepEqual([neutral.frame,neutral.method,neutral.allowsCorrection],['comparative-neutral','comparative:v8',false])
  assert.deepEqual([anchored.frame,anchored.method,anchored.allowsCorrection],['islamic-quran-anchored','quran-anchored:v8',true])
  assert.deepEqual([neutral.automaticCanonicalApproval,anchored.automaticCanonicalApproval],[false,false])
  // No silent fallback: an absent or unknown lens is an error, not neutral.
  assert.throws(()=>selectLens(undefined as never),/Research lens must be one of/)
  assert.throws(()=>selectLens('comparative' as never),/Research lens must be one of/)
  // A selection is immutable, so a caller cannot edit the frame it reports.
  assert.equal(Object.isFrozen(neutral),true)
  assert.throws(()=>{(neutral as unknown as {frame:string}).frame='islamic-quran-anchored'},TypeError)
  const stored:ScopedTextRelation={leftPassageId:'mw:passage:quran:5:48',rightPassageId:'mw:passage:example',
    relation:'PARALLELS',method:'comparative:v8',frame:'comparative-neutral',
    evidenceIds:['mw:evidence:test'],reviewer:'mw:agent:reviewer',reviewStatus:'reviewed'}
  // Reading the lens comes from the record, never from the current filter.
  assert.deepEqual(readRelationLens(stored),{lens:'neutral',frame:'comparative-neutral',method:'comparative:v8'})
  const mismatch=compareRelationLens(stored,anchored)
  assert.deepEqual([mismatch.storedLens,mismatch.selectedLens,mismatch.matches],['neutral','quran-anchored',false])
  assert.equal(mismatch.storedFrame,'comparative-neutral')
  assert.equal(mismatch.rewritten,false)
  // The stored record is untouched by selecting another lens or comparing against it.
  const before=JSON.stringify(stored)
  compareRelationLens(stored,neutral); readRelationLens(stored)
  assert.equal(JSON.stringify(stored),before)
  assert.equal(stored.frame,'comparative-neutral')
  // Correction is scoped to the non-neutral lens, and still needs the review record.
  const correction={...stored,method:'quran-anchored:v8',frame:'islamic-quran-anchored',relation:'CORRECTS_WITHIN_FRAME' as const}
  assert.doesNotThrow(()=>validateScopedRelation(correction))
  assert.equal(compareRelationLens(correction,anchored).matches,true)
  assert.equal(resolveRelationSources(correction,{hasPassage:()=>true,hasEvidence:()=>true}).publishable,true)
  assert.equal(resolveRelationSources({...correction,reviewStatus:'draft'},
    {hasPassage:()=>true,hasEvidence:()=>true}).publishable,false)
  // An unrecognised frame is reported as undeclared rather than guessed into a lens.
  assert.equal(readRelationLens({...stored,frame:'comparative-contextual'}).lens,'undeclared')
  assert.equal(readRelationLens(undefined as never).lens,'undeclared')
})
