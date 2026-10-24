import assert from 'node:assert/strict'
import test from 'node:test'
import { computeAnalysisInputHash, createReviewedSnapshot } from './derived.js'
import { createStaticResearchPublication } from './static.js'
import type { AnalysisRun } from './analysis.js'
import { canonicalJson } from './derived.js'

const corpusHash='a'.repeat(64)
function reviewedInput(): AnalysisRun {
  const run:AnalysisRun={
    id:'run:synthetic:static-1',passageId:'mw:passage:test:static',
    method:'textual-research:v8',methodVersion:'v8-proposal',corpusHash,inputHash:'',
    reviewer:'mw:reviewer:internal',reviewStatus:'reviewed',
    sourceWitnesses:[{
      id:'source:synthetic',passageId:'mw:passage:test:static',contentId:'mw:content:test:static',
      sourceId:'mw:source:test',editionId:'mw:edition:test',artifactId:'mw:artifact:test',
      provenanceId:'mw:provenance:test',language:'en',representation:'source_text',
      rights:'cleared',text:'SYNTHETIC SOURCE TEXT MUST NOT BE EXPORTED'
    }],
    claims:[{
      id:'claim:S1',level:'S1',status:'supported',epistemic:'observed',
      claim:'Synthetic metadata pointer is supported',evidenceIds:['mw:evidence:test:static'],
      dependsOn:[],method:'textual-research:v8',
      frame:{agent:'curator',recipient:'researcher',domain:'textual',scope:'synthetic',genre:'test'},
      sourceContentIds:['mw:content:test:static']
    }],
    uncertainty:{unknowns:[],disagreements:[]}
  }
  const {inputHash:_,...payload}=run
  run.inputHash=computeAnalysisInputHash(payload)
  return run
}

test('static projection contains reviewed public claims and trace pointers only',()=>{
  const run=reviewedInput()
  const publication=createReviewedSnapshot({corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]})
  const out=createStaticResearchPublication(publication,corpusHash)
  assert.equal(out.schema,'srgbl-v8-static-public-v1')
  assert.equal(out.corpusHash,corpusHash)
  assert.equal(out.analyses[0].levels[0].evidenceIds[0],'mw:evidence:test:static')
  assert.equal(JSON.stringify(out).includes('reviewer'),false)
  assert.equal(JSON.stringify(out).includes('maturity'),false)
  assert.equal(JSON.stringify(out).includes('SYNTHETIC SOURCE TEXT'),false)
})

test('static projection fails closed for a stale corpus and serializes deterministically',()=>{
  const run=reviewedInput()
  const publication=createReviewedSnapshot({corpusHash,methodVersion:run.methodVersion,runs:[run],candidates:[],miracleClaims:[]})
  assert.throws(()=>createStaticResearchPublication(publication,'b'.repeat(64)),/corpus hash mismatch/)
  const first=createStaticResearchPublication(publication,corpusHash)
  const second=createStaticResearchPublication(structuredClone(publication),corpusHash)
  assert.equal(canonicalJson(first),canonicalJson(second))
})
