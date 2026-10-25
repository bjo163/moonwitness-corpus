import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { validateAnalysisRun, validateResearchFrame, validateRepresentationLanes, diagnoseOffside, type AnalysisRun, type ResearchFrame, type WitnessSource } from './analysis.js'
import { evaluateFramedKeys, validateKeyAssessment, validateKeyMessage, validateKeyToken, type FramedKeyAssessment } from './keys.js'
import { adaptPassageSources, resolveSourceReference, type SourceCatalog } from './sources.js'
import { validateReviewedCandidate, validateMiracleAttribution, describeMiracleAttribution, summarizeCandidate } from './research-ledger.js'
import { proposeSwing, type ScopedTextRelation } from './index.js'

const frame: ResearchFrame = {agent:'narrator',recipient:'community',domain:'wisdom',scope:'community',genre:'narrative'}
function fixture():AnalysisRun {
  const levels=['S1','R2','G3','B4','L5'] as const
  return {id:'run:synthetic:1',passageId:'mw:passage:test:a',method:'test:v8',
    methodVersion:'v8-alpha',corpusHash:'hash-test',inputHash:'fixture-test',
    reviewer:'mw:agent:test-reviewer',reviewStatus:'reviewed',
    sourceWitnesses:[{id:'source:1',passageId:'mw:passage:test:a',contentId:'mw:content:test:a',
      sourceId:'mw:source:test',editionId:'mw:edition:test',artifactId:'mw:artifact:test',
      provenanceId:'mw:provenance:test',language:'en',representation:'source_text',rights:'cleared',text:'synthetic test only'}],
    claims:levels.map((level,i)=>({id:'claim:'+level,level,status:'supported' as const,
      epistemic:i<2?'observed' as const:'inferred' as const,
      claim:'synthetic '+level,evidenceIds:['mw:evidence:test:'+i],
      dependsOn:i?['claim:'+levels[i-1]]:[],method:'test:v8',frame,
      sourceContentIds:['mw:content:test:a'],...(level==='L5'?{boundaryNote:'Not scripture or universal truth.'}:{})})),
    uncertainty:{unknowns:[],disagreements:[]}
  }
}
test('end-to-end synthetic S1–L5 has /15 maturity, only when supported & reviewed',()=>{
  const value=validateAnalysisRun(fixture())
  assert.deepEqual(value.errors,[])
  assert.equal(value.maturity.score,15)
  assert.equal(value.publishable,true)
})
test('missing R2 dependency cannot bypass cumulative gates',()=>{
  const run=fixture()
  run.claims[2].dependsOn=[]
  const value=validateAnalysisRun(run)
  assert.ok(value.errors.some(x=>x.includes('G3 supported claim missing')))
  assert.equal(value.publishable,false)
  assert.ok(value.maturity.score<15)
})
test('R2 inference is rejected, and source licence is fail-closed',()=>{
  const run=fixture()
  run.claims[1].epistemic='interpreted'
  let v=validateAnalysisRun(run)
  assert.ok(v.errors.some(x=>x.includes('R2')))
  run.claims[1].epistemic='observed'
  run.sourceWitnesses[0].rights='unknown'
  v=validateAnalysisRun(run)
  assert.ok(v.errors.some(x=>x.includes('source text must be omitted')))
  assert.equal(v.publishable,false)
})
test('missing reviewer, uncertain/dissent or circular refs cannot be promoted',()=>{
  const run=fixture()
  run.reviewer=undefined
  run.claims[0].dependsOn=['claim:L5']
  run.uncertainty.unknowns.push('human verification required')
  const v=validateAnalysisRun(run)
  assert.ok(v.errors.some(x=>x.includes('dependency cycle')))
  assert.ok(v.errors.some(x=>x.includes('reviewer')))
  assert.equal(v.publishable,false)
})
test('level-claim graph diagnostics name the claim, the edge and the exact cycle',()=>{
  // Positive control: the legal S1 -> R2 -> G3 chain has no graph error.
  const clean=validateAnalysisRun(fixture())
  assert.deepEqual(clean.errors.filter(e=>e.includes('claim dependency')||e.includes('dangling')||e.includes('duplicate claim id')),[])
  // A predecessor that is not in the run is dangling and must say which claim carries the edge.
  const unknown=fixture()
  unknown.claims[2].dependsOn=['claim:does-not-exist']
  const u=validateAnalysisRun(unknown)
  assert.ok(u.errors.some(e=>e==='dangling claim dependency claim:does-not-exist in claim:G3'),String(u.errors))
  // The rejected edge is preserved for the researcher, never silently deleted.
  assert.deepEqual(unknown.claims[2].dependsOn,['claim:does-not-exist'])
  assert.equal(u.states.G3,'pending')
  assert.equal(u.publishable,false)
  // Self-dependency is named, not reported as a bare anonymous failure.
  const self=fixture()
  self.claims[1].dependsOn=['claim:R2','claim:S1']
  assert.ok(validateAnalysisRun(self).errors.some(e=>e==='claim:R2 depends on itself'))
  // Duplicated ids collide in the graph and block publication.
  const duplicated=fixture()
  duplicated.claims[2]={...duplicated.claims[2],id:'claim:R2'}
  const d=validateAnalysisRun(duplicated)
  assert.ok(d.errors.some(e=>e==='duplicate claim id claim:R2 in the dependency graph'),String(d.errors))
  assert.equal(d.publishable,false)
  // A real cycle is reported with its closed path, once, and stably.
  const cyclic=fixture()
  cyclic.claims[1].dependsOn=['claim:S1','claim:G3']
  const c=validateAnalysisRun(cyclic)
  const paths=c.errors.filter(e=>e.startsWith('claim dependency cycle: '))
  assert.equal(paths.length,1)
  assert.equal(paths[0],'claim dependency cycle: claim:G3 -> claim:R2 -> claim:G3')
  assert.equal(c.publishable,false)
  // Reordering the claims must not rotate or duplicate the reported cycle.
  const shuffled=fixture()
  shuffled.claims=[...shuffled.claims].reverse()
  shuffled.claims.find(c2=>c2.level==='R2')!.dependsOn=['claim:S1','claim:G3']
  assert.deepEqual(validateAnalysisRun(shuffled).errors.filter(e=>e.startsWith('claim dependency cycle: ')),paths)
  // Blank ids are identified positionally instead of collapsing into one message.
  const blank=fixture()
  blank.claims[0].id='  '
  assert.ok(validateAnalysisRun(blank).errors.some(e=>e==='claim at index 0 has a blank id'))
})
test('OFFSIDE names its reason and proposes a frame without rewriting the canonical one',()=>{
  const mismatch=diagnoseOffside(frame,{recipient:'individual'})
  assert.equal(mismatch.status,'candidate-offside')
  assert.equal(mismatch.reason,'evidence_mismatch')
  assert.deepEqual(mismatch.missing,[])
  assert.deepEqual(mismatch.differences,['recipient'])
  assert.deepEqual(mismatch.proposedFrame,{...frame,recipient:'individual'})
  assert.equal(mismatch.verified,false)
  // The caller's canonical frame object is never rewritten.
  assert.deepEqual(frame,{agent:'narrator',recipient:'community',domain:'wisdom',scope:'community',genre:'narrative'})
  // Blank and unknown evidence values are never adopted into a proposal.
  const noise=diagnoseOffside(frame,{recipient:'   ',domain:'wisdom',extra:'invented'} as never)
  assert.equal(noise.status,'no-detected-mismatch')
  assert.equal(noise.reason,'no-mismatch')
  assert.deepEqual(noise.differences,[])
  assert.equal((noise.proposedFrame as Record<string, unknown>).extra, undefined)
  // An incomplete canonical frame is reported separately from a real mismatch.
  const both=diagnoseOffside({...frame,genre:'  '},{genre:'law'})
  assert.equal(both.reason,'frame_incomplete_and_evidence_mismatch')
  assert.deepEqual(both.missing,['frame.genre is missing'])
  assert.deepEqual(both.differences,['genre'])
  assert.equal(both.verified,false)
})
test('supported R2 requires observed text on real source content, never a narrative claim',()=>{
  // The invariant already existed at this dev SHA; these are the missing edges.
  const clean=validateAnalysisRun(fixture())
  assert.equal(clean.states.R2,'supported')
  assert.equal(clean.maturity.score,15)
  // An inferred story claim stays a story claim even when worded as history.
  const inferred=fixture()
  inferred.claims[1]={...inferred.claims[1],epistemic:'inferred',claim:'A historical event occurred'}
  const v=validateAnalysisRun(inferred)
  assert.ok(v.errors.some(error=>error.includes('R2 supported claim must be observed text')))
  assert.notEqual(v.states.R2,'supported')
  assert.equal(v.publishable,false)
  // An observed reading must attach to content this run actually witnesses.
  const dangling=fixture()
  dangling.claims[1].sourceContentIds=['mw:content:test:not-in-run']
  const d=validateAnalysisRun(dangling)
  assert.ok(d.errors.some(error=>error.includes('references unavailable source content')))
  assert.notEqual(d.states.R2,'supported')
  assert.ok(d.maturity.score<15)
})
test('translation lanes stay distinct and never substitute for the original reading',()=>{
  const run=fixture()
  const original=run.sourceWitnesses[0]
  const translation:WitnessSource={...original,id:'source:2',contentId:'mw:content:test:tr',
    editionId:'mw:edition:translation',language:'id',representation:'translation',text:'terjemahan sintetis'}
  run.sourceWitnesses=[original,translation]
  for(const claim of run.claims) claim.sourceContentIds=[original.contentId,translation.contentId]
  const both=validateAnalysisRun(run)
  assert.deepEqual(both.errors,[])
  assert.equal(both.maturity.score,15)
  assert.deepEqual(validateRepresentationLanes(run.sourceWitnesses,[original.contentId,translation.contentId]),[])
  // A translation may not take the edition identity of the original witness.
  const colliding=validateAnalysisRun({...run,sourceWitnesses:[original,{...translation,editionId:original.editionId}]})
  assert.ok(colliding.errors.some(e=>e.includes('reuses original edition')))
  assert.equal(colliding.publishable,false)
  // A missing original reading is never reconstructed from the translation.
  const translationOnly=validateAnalysisRun({...run,sourceWitnesses:[translation]})
  assert.ok(translationOnly.errors.some(e=>e.includes('observed claim cites no original text witness')))
  assert.equal(translationOnly.publishable,false)
})
test('blank or malformed research frames name the failing field and never mutate the caller',()=>{
  assert.deepEqual(validateResearchFrame(frame),[])
  assert.deepEqual(validateResearchFrame({...frame,recipient:'  '}),['frame.recipient is missing'])
  assert.deepEqual(validateResearchFrame({...frame,genre:''}),['frame.genre is missing'])
  const blank={...frame,recipient:'  '}
  const snapshot=JSON.stringify(blank)
  validateResearchFrame(blank)
  assert.equal(JSON.stringify(blank),snapshot)
  // Unknown/null input is a controlled diagnostic, never a crash.
  assert.deepEqual(validateResearchFrame(null as unknown as ResearchFrame),['frame is missing'])
  assert.deepEqual(validateResearchFrame(undefined as unknown as ResearchFrame),['frame is missing'])
  assert.deepEqual(validateResearchFrame('narrative' as unknown as ResearchFrame),['frame is missing'])
})
test('OFFSIDE is a candidate frame mismatch, not theological verdict',()=>{
  const o=diagnoseOffside(frame,{recipient:'individual'})
  assert.equal(o.status,'candidate-offside')
  assert.deepEqual(o.differences,['recipient'])
  assert.equal(o.verified,false)
})
test('source adapter preserves exact distinction and never exposes uncleared text',()=>{
  const sample={passage:{id:'mw:passage:test:a'},contents:[{
    id:'mw:content:test:a',text:'DO NOT PUBLISH AS SCRIPTURE',language:'en',representation:'translation',
    edition_id:'mw:edition:test',source_id:'mw:source:test',
    extensions:{source:{artifact:'mw:artifact:test',provenance:'mw:provenance:test'}}
  }],artifacts:[{id:'mw:artifact:test'}],provenance:[{id:'mw:provenance:test'}],evidence:[{id:'mw:evidence:test'}]}
  const catalog:SourceCatalog={sources:[{id:'mw:source:test'}],editions:[{id:'mw:edition:test',sourceId:'mw:source:test'}]}
  const no=adaptPassageSources(sample,{},catalog)
  assert.equal(no.sources[0].rights,'unknown')
  assert.equal(no.sources[0].representation,'translation')
  assert.equal(no.sources[0].text,undefined)
  assert.equal(no.defaultLevelStatus,'pending')
  assert.ok(no.gaps.some(g=>g.includes('rights_not_cleared')))
  const yes=adaptPassageSources(sample,{'mw:content:test:a':{status:'cleared',rightsRecordId:'mw:rights:test',editionId:'mw:edition:test'}},catalog)
  assert.equal(yes.sources[0].text,'DO NOT PUBLISH AS SCRIPTURE')
  assert.deepEqual(yes.gaps,[])
})
test('source pointers resolve against canonical records, never from nonblank IDs',()=>{
  const catalog:SourceCatalog={sources:[{id:'mw:source:test'},{id:'mw:source:other'}],
    editions:[{id:'mw:edition:test',sourceId:'mw:source:test'}]}
  assert.deepEqual(resolveSourceReference('mw:source:test','mw:edition:test',catalog),{resolved:true,gap:null})
  const unknown=resolveSourceReference('mw:source:does-not-exist','mw:edition:test',catalog)
  assert.deepEqual(unknown,{resolved:false,gap:'source_unresolved'})
  assert.deepEqual(resolveSourceReference('mw:source:test','mw:edition:does-not-exist',catalog),
    {resolved:false,gap:'edition_unresolved'})
  assert.deepEqual(resolveSourceReference('mw:source:other','mw:edition:test',catalog),
    {resolved:false,gap:'edition_source_mismatch'})
  // Without a catalog nothing is proven: nonblank strings stay unresolved.
  assert.deepEqual(resolveSourceReference('mw:source:test','mw:edition:test'),
    {resolved:false,gap:'source_resolution_unavailable'})
})
test('unresolved source or wrong edition blocks S1 review through the adapter',()=>{
  const base={passage:{id:'mw:passage:test:a'},contents:[{
    id:'mw:content:test:a',text:'LICENSED',language:'en',representation:'source_text',
    edition_id:'mw:edition:test',source_id:'mw:source:does-not-exist',
    extensions:{source:{artifact:'mw:artifact:test',provenance:'mw:provenance:test'}}
  }],artifacts:[{id:'mw:artifact:test'}],provenance:[{id:'mw:provenance:test'}],evidence:[{id:'mw:evidence:test'}]}
  const catalog:SourceCatalog={sources:[{id:'mw:source:test'}],editions:[{id:'mw:edition:test',sourceId:'mw:source:test'}]}
  const unresolved=adaptPassageSources(base,{'mw:content:test:a':{status:'cleared',rightsRecordId:'mw:rights:test',editionId:'mw:edition:test'}},catalog)
  assert.ok(unresolved.gaps.includes('mw:content:test:a:source_unresolved'))
  assert.equal(unresolved.defaultLevelStatus,'pending')
  const wrongEdition=adaptPassageSources({...base,contents:[{...base.contents[0],source_id:'mw:source:test'}],
    artifacts:[{id:'mw:artifact:test'}]},{'mw:content:test:a':{status:'cleared',rightsRecordId:'mw:rights:test'}},{sources:[{id:'mw:source:test'}],editions:[]})
  assert.ok(wrongEdition.gaps.includes('mw:content:test:a:edition_unresolved'))
  const noCatalog=adaptPassageSources({...base,contents:[{...base.contents[0],source_id:'mw:source:test'}]},{'mw:content:test:a':{status:'cleared',rightsRecordId:'mw:rights:test'}})
  assert.ok(noCatalog.gaps.includes('mw:content:test:a:source_resolution_unavailable'))
})
test('uncleared or unattested rights never expose source text',()=>{
  const sample={passage:{id:'mw:passage:test:a'},contents:[{
    id:'mw:content:test:a',text:'LICENSED',language:'en',representation:'source_text',
    edition_id:'mw:edition:test',source_id:'mw:source:test',
    extensions:{source:{artifact:'mw:artifact:test',provenance:'mw:provenance:test'}}
  }],artifacts:[{id:'mw:artifact:test'}],provenance:[{id:'mw:provenance:test'}],evidence:[{id:'mw:evidence:test'}]}
  const catalog:SourceCatalog={sources:[{id:'mw:source:test'}],editions:[{id:'mw:edition:test',sourceId:'mw:source:test'}]}
  // A bare 'cleared' string is a claim, not a licence.
  const bare=adaptPassageSources(sample,{'mw:content:test:a':'cleared'},catalog)
  assert.equal(bare.sources[0].rights,'unknown')
  assert.equal(bare.sources[0].text,undefined)
  assert.ok(bare.gaps.includes('mw:content:test:a:rights_claim_unattested'))
  assert.ok(bare.gaps.includes('mw:content:test:a:rights_not_cleared'))
  const restricted=adaptPassageSources(sample,{'mw:content:test:a':{status:'restricted',rightsRecordId:'mw:rights:test'}},catalog)
  assert.equal(restricted.sources[0].rights,'restricted')
  assert.equal(restricted.sources[0].text,undefined)
  // Clearance for a different edition does not cover this content.
  const mismatch=adaptPassageSources(sample,{'mw:content:test:a':{status:'cleared',rightsRecordId:'mw:rights:test',editionId:'mw:edition:other'}},catalog)
  assert.equal(mismatch.sources[0].rights,'unknown')
  assert.equal(mismatch.sources[0].text,undefined)
  assert.ok(mismatch.gaps.includes('mw:content:test:a:rights_edition_mismatch'))
  // Independently attested clearance for this exact edition may expose the text.
  const attested=adaptPassageSources(sample,{'mw:content:test:a':{status:'cleared',rightsRecordId:'mw:rights:test',editionId:'mw:edition:test'}},catalog)
  assert.equal(attested.sources[0].rights,'cleared')
  assert.equal(attested.sources[0].text,'LICENSED')
  assert.deepEqual(attested.gaps,[])
})
function key():FramedKeyAssessment {
  return {id:'mw:assessment:test:1',passageId:'mw:passage:test:a',contentId:'mw:content:test:a',
    key:'hope',scheme:'semantic-core:v0',method:'test:v8',assessor:'mw:agent:a',reviewer:'mw:agent:reviewer',
    evidenceIds:['mw:evidence:test'],relation:'promises',frame,direction:2,intensity:3,confidence:0.9,weight:1,reviewStatus:'reviewed'}
}
test('Key Witness frame scoring is distinct and never invents agreement',()=>{
  const b=evaluateFramedKeys({method:'test:v8',profile:'hope:v8',frame,expectedKeyCount:20,
    assessments:[key()],agreement:null,reviewerCount:1})
  assert.deepEqual(b.errors,[])
  assert.equal(b.direction?.value,2)
  assert.equal(b.n,1)
  assert.equal(b.coverage,0.05)
  assert.equal(b.agreement,null)
  const invalid=evaluateFramedKeys({method:'test:v8',profile:'hope:v8',frame,expectedKeyCount:20,
    assessments:[{...key(),key:'invented_key' as never}],agreement:null,reviewerCount:1})
  assert.equal(invalid.direction,null)
  assert.ok(invalid.errors.length)
})
test('P18 key vocabulary is versioned: unknown token or scheme never auto-maps',()=>{
  assert.deepEqual(validateKeyToken('semantic-core:v0','hope'),[])
  assert.deepEqual(validateKeyAssessment(key()),[])
  // 'faith' is exploratory, not a v0 candidate: it is rejected, never auto-approved.
  assert.ok(validateKeyToken('semantic-core:v0','faith').some(error=>error.includes('controlled candidate registry')))
  assert.ok(validateKeyAssessment({...key(),key:'faith' as never}).some(error=>error.includes('controlled candidate registry')))
  // A future scheme needs its own registry entry; v0 tokens must not carry over silently.
  assert.ok(validateKeyToken('semantic-core:v1','hope').some(error=>error.includes('unknown key scheme version')))
  assert.ok(validateKeyAssessment({...key(),scheme:'semantic-core:v1' as never}).some(error=>error.includes('unknown key scheme version')))
  const bundled=evaluateFramedKeys({method:'test:v8',profile:'hope:v8',frame,expectedKeyCount:20,
    assessments:[{...key(),key:'faith' as never}],agreement:null,reviewerCount:1})
  assert.equal(bundled.direction,null)
  assert.equal(bundled.coverage,null)
})
test('reviewed derived message must keep key and boundary note',()=>{
  const message={id:'msg:test',passageId:'mw:passage:test:a',method:'test:v8',frame,
    sourceKeyAssessmentIds:[key().id],message:'Synthetic',boundaryNote:'Not universal',contextNote:'Test only',
    evidenceIds:['mw:evidence:test'],reviewStatus:'reviewed' as const,reviewer:'mw:agent:reviewer'}
  assert.deepEqual(validateKeyMessage(message,[key()]),[])
  assert.ok(validateKeyMessage({...message,boundaryNote:''},[key()]).length)
})
test('derived message cannot cite a dangling, blank or ambiguous key assessment',()=>{
  const base={id:'msg:test',passageId:'mw:passage:test:a',method:'test:v8',frame,
    sourceKeyAssessmentIds:[key().id],message:'Synthetic',boundaryNote:'Not universal',contextNote:'Test only',
    evidenceIds:['mw:evidence:test'],reviewStatus:'reviewed' as const,reviewer:'mw:agent:reviewer'}
  assert.deepEqual(validateKeyMessage(base,[key()]),[])
  // An ID that no supplied assessment resolves to is named, never dropped.
  const dangling=validateKeyMessage({...base,sourceKeyAssessmentIds:['mw:assessment:ghost']},[key()])
  assert.ok(dangling.includes('missing source key mw:assessment:ghost'),String(dangling))
  assert.ok(dangling.some(error=>error.includes('reviewed message needs reviewed keys')))
  // Blank and repeated citations are separate, positional diagnostics.
  assert.ok(validateKeyMessage({...base,sourceKeyAssessmentIds:['  ']},[key()])
    .includes('message.sourceKeyAssessmentIds[0] is not a nonblank key id'))
  assert.ok(validateKeyMessage({...base,sourceKeyAssessmentIds:[key().id,key().id]},[key()])
    .includes('duplicate message key reference '+key().id))
  // Passage drift and method drift must not collapse into one vague message.
  assert.ok(validateKeyMessage({...base,passageId:'mw:passage:test:b'},[key()])
    .some(error=>error==='message key '+key().id+' belongs to passage mw:passage:test:a, not mw:passage:test:b'))
  assert.ok(validateKeyMessage({...base,method:'other:v8'},[key()])
    .some(error=>error==='message key '+key().id+' uses method test:v8, not other:v8'))
  // Two supplied records sharing an ID resolve ambiguously: refuse, do not pick the last.
  const clash=validateKeyMessage(base,[key(),{...key(),passageId:'mw:passage:test:other'}])
  assert.ok(clash.includes('duplicate key assessment record id '+key().id),String(clash))
  // Blank evidence entries are not evidence.
  assert.ok(validateKeyMessage({...base,evidenceIds:['  ']},[key()]).includes('message evidence missing'))
})
test('reviewed Swing needs independent origins and preserves contrary evidence',()=>{
  const origin=proposeSwing({operator:'direction',subject:'A',relation:'is-related-to',object:'B',depth:1})
  const relation:ScopedTextRelation={leftPassageId:'mw:passage:test:a',rightPassageId:'mw:passage:test:b',
    relation:'PARALLELS',method:'comparative:v8',frame:'comparative-neutral',
    evidenceIds:['mw:evidence:test'],reviewStatus:'reviewed',reviewer:'mw:agent:reviewer'}
  const base={id:'candidate:test',origin,relation,supportingEvidenceIds:['mw:evidence:test'],
    contradictingEvidenceIds:[],independentSourceIds:['mw:source:test'],reviewStatus:'reviewed' as const,
    reviewer:'mw:agent:reviewer',components:null}
  assert.deepEqual(validateReviewedCandidate(base),[])
  // [] is the explicit "searched, found none" record, not a missing search.
  assert.deepEqual(summarizeCandidate(base).contradictionEvidence,'searched-none-found')
  assert.deepEqual(summarizeCandidate(base).contradictingEvidenceIds,[])
  // Contrary evidence found is preserved verbatim, never discarded on the way out.
  const contrary=summarizeCandidate({...base,contradictingEvidenceIds:['mw:evidence:contrary']})
  assert.deepEqual([contrary.contradictionEvidence,contrary.contradictingEvidenceIds],['present',['mw:evidence:contrary']])
  // An unrecorded contradiction list is a defect naming that exact array.
  const unrecorded=validateReviewedCandidate({...base,contradictingEvidenceIds:undefined as never})
  assert.ok(unrecorded.some(e=>e==='candidate contradictingEvidenceIds must be an array (use [] when the search found none)'),String(unrecorded))
  assert.deepEqual(summarizeCandidate({...base,contradictingEvidenceIds:undefined as never}).contradictionEvidence,'unrecorded')
  // Duplicates and blank IDs are reported per array instead of one vague message.
  assert.ok(validateReviewedCandidate({...base,supportingEvidenceIds:['mw:evidence:test','mw:evidence:test']})
    .includes('candidate supportingEvidenceIds must not repeat an ID'))
  assert.ok(validateReviewedCandidate({...base,independentSourceIds:['mw:source:test','  ']})
    .includes('candidate independentSourceIds contains a blank ID'))
  // A source reused as this candidate's own evidence is not an independent origin.
  assert.ok(validateReviewedCandidate({...base,independentSourceIds:['mw:evidence:test']})
    .some(e=>e==='independent source mw:evidence:test is also cited as candidate evidence, so it is not independent'))
  // Inherited score and missing independent sources still block review.
  assert.ok(validateReviewedCandidate({...base,origin:{...origin,inheritedScore:1 as never}}).some(e=>e.includes('must not inherit score')))
  assert.ok(validateReviewedCandidate({...base,independentSourceIds:[]}).some(e=>e.includes('independent source')))
  assert.equal(summarizeCandidate({...base,independentSourceIds:[]}).publishable,false)
  // Unknown and null records are controlled diagnostics, not crashes.
  assert.deepEqual(validateReviewedCandidate(null as never),['candidate record is missing'])
  assert.deepEqual(summarizeCandidate(null as never).reviewErrors,['candidate record is missing'])
  assert.equal(summarizeCandidate(null as never).publishable,false)
})

test('Swing candidates and miracle claims cannot be self-approved as truth',()=>{
  const origin=proposeSwing({operator:'direction',subject:'A',relation:'is-related-to',object:'B',depth:1})
  const relation:ScopedTextRelation={leftPassageId:'mw:passage:test:a',rightPassageId:'mw:passage:test:b',
    relation:'PARALLELS',method:'comparative:v8',frame:'comparative-neutral',
    evidenceIds:['mw:evidence:test'],reviewStatus:'reviewed',reviewer:'mw:agent:reviewer'}
  const candidate={id:'candidate:test',origin,relation,supportingEvidenceIds:['mw:evidence:test'],
    contradictingEvidenceIds:[],independentSourceIds:['mw:source:test'],reviewStatus:'reviewed' as const,
    reviewer:'mw:agent:reviewer',components:null}
  assert.deepEqual(validateReviewedCandidate(candidate),[])
  assert.equal(summarizeCandidate(candidate).publishable,true)
  assert.equal(summarizeCandidate(candidate).automaticMiracleProof,false)
  assert.ok(validateReviewedCandidate({...candidate,reviewer:undefined}).length)
  assert.deepEqual(validateMiracleAttribution({id:'claim:test',targetPassageId:'mw:passage:test:a',
    tradition:'islam',claimant:'mw:agent:test',method:'islamic-interpretive:v8',
    claimText:'Attributed theological claim only',evidenceIds:['mw:evidence:test'],
    reviewStatus:'reviewed',reviewer:'mw:agent:reviewer',empiricallyVerified:false}),[])
})
test('a miracle claim is displayed as an attributed reading, never as a score',()=>{
  const claim={id:'claim:test',targetPassageId:'mw:passage:test:a',tradition:'islam',
    claimant:'mw:agent:test',method:'islamic-interpretive:v8',
    claimText:'Attributed theological claim only',evidenceIds:['mw:evidence:test'],
    reviewStatus:'reviewed' as const,reviewer:'mw:agent:reviewer',empiricallyVerified:false as const}
  // Positive: a sourced, reviewed attribution is displayable, with its limits named.
  const view=describeMiracleAttribution(claim)
  assert.deepEqual([view.claimType,view.claimant,view.reviewer],['attributed-claim','mw:agent:test','mw:agent:reviewer'])
  assert.equal(view.claimText,claim.claimText)
  // No numeric channel: the view carries no score, and nothing is certified.
  assert.deepEqual([view.score,view.empiricallyVerified,view.universalProof],[null,false,false])
  assert.ok(view.limitations.some(text=>text.includes('attributed to mw:agent:test (islam)')))
  assert.ok(view.limitations.some(text=>text.includes('No numeric witness score')))
  assert.equal(view.limitations.length,2)
  assert.equal(Object.isFrozen(view),true)
  // Negative: a witness score cannot be smuggled in as proof, under any of its names.
  for (const field of ['score','witnessScore','witnessSupport','confidence','probability','certainty']) {
    assert.throws(()=>describeMiracleAttribution({...claim,[field]:100} as never),
      /a witness score is not empirical proof/,field)
  }
  // Negative: no invented claimant, no silent default name, no unknown fields.
  assert.throws(()=>describeMiracleAttribution({...claim,claimant:'  '}),/claimant required/)
  assert.throws(()=>describeMiracleAttribution({...claim,claimant:undefined as never}),/claimant required/)
  assert.throws(()=>describeMiracleAttribution({...claim,provenance:'invented'} as never),/unknown field\(s\): provenance/)
  // Negative: certification is refused before display, whatever the score says.
  assert.throws(()=>describeMiracleAttribution({...claim,empiricallyVerified:true} as never),/empirical certification is prohibited/)
  // An unreviewed claim is displayable only with its review state and missing evidence named.
  const draft=describeMiracleAttribution({...claim,reviewStatus:'draft',reviewer:undefined,evidenceIds:[]})
  assert.deepEqual([draft.reviewStatus,draft.reviewer],[ 'draft',null])
  assert.ok(draft.limitations.some(text=>text.includes('draft')))
  assert.ok(draft.limitations.some(text=>text.includes('No source evidence')))
  // The attribution itself is never mutated by being displayed.
  const before=JSON.stringify(claim)
  describeMiracleAttribution(claim)
  assert.equal(JSON.stringify(claim),before)
})
test('the Quran research fixture keeps neighbour context and metaphor rights-safe',()=>{
  const fixture:any=JSON.parse(readFileSync(
    new URL('../../../fixtures/srgbl/quran-research-cases.json',import.meta.url),'utf8'))
  // Rights: the index carries pointers only, and states that in one place.
  assert.deepEqual(fixture.textPolicy,{embedsScriptureText:false,embedsTranslationText:false,
    requiresExactEditionBeforeAnalysis:true,requiresRightsReviewBeforeAnalysis:true})
  assert.deepEqual([fixture.status,fixture.license],
    ['unreviewed-source-pointers-only','no scripture or translation text is embedded'])
  // Negative: no case may carry verse or translation text under any field name.
  const keys=new Set<string>()
  const walk=(node:unknown):void=>{
    if (Array.isArray(node)) node.forEach(walk)
    else if (node && typeof node==='object') for (const [key,value] of Object.entries(node)) { keys.add(key); walk(value) }
  }
  walk(fixture)
  for (const banned of ['text','translation','transliteration','quote','verseText']) {
    assert.equal(keys.has(banned),false,banned+' is not allowed in a rights-safe pointer')
  }
  assert.equal(keys.has('textEmbedded'),true)
  const byId:Map<string,any>=new Map(fixture.cases.map((entry:any)=>[entry.id,entry]))
  assert.deepEqual([...byId.keys()],['quran-42-51','quran-5-48','quran-37-30','quran-20-5','quran-2-82'])
  const offside=byId.get('quran-37-30')
  // Positive: actor and recipient stay explicitly unknown until an exact edition exists.
  assert.deepEqual([offside.actor,offside.recipient],['unknown-pending-exact-edition','unknown-pending-exact-edition'])
  assert.deepEqual([offside.sourceEdition,offside.rights,offside.reviewer],[null,'unknown',null])
  // Neighbours are named as selectors, not as quoted context.
  assert.equal(offside.neighborReferences.length,1)
  assert.deepEqual(offside.neighborReferences[0].select,
    {kind:'verse-range',work:'al-quran',chapter:37,fromVerse:27,toVerse:33})
  for (const reference of offside.neighborReferences) {
    assert.deepEqual([reference.resolve,reference.textEmbedded,reference.selectorResolved],
      ['pending-exact-edition',false,false])
  }
  // OFFSIDE remains an editorial candidate and is never rendered as verse wording.
  assert.deepEqual([offside.metaphor.label,offside.metaphor.status,offside.metaphor.literalVerseWording],
    ['Master Gula','editorial-candidate',false])
  // Literary context and creative metaphor are distinguished per case, not conflated.
  const literary=byId.get('quran-20-5')
  assert.deepEqual([offside.contextKind,literary.contextKind],['creative-metaphor-candidate','literary-context'])
  assert.equal(literary.metaphor,null)
  assert.deepEqual(literary.neighborReferences[0].select,
    {kind:'chapter-range',work:'al-quran',chapter:20,fromVerse:1,toVerse:8})
  // The gate that blocks analysis before edition and rights review is untouched.
  assert.deepEqual(fixture.qualityGate,{reviewRequired:true,exactPassageIdRequiredBeforeAnalysis:true,
    editionRequired:true,rightsReviewRequired:true,cannotAssumeMiracle:true,cannotInheritSwingScore:true})
  assert.equal(fixture.note.startsWith('No claim has a canonical passage ID'),true)
})
