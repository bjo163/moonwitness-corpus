import assert from 'node:assert/strict'
import test from 'node:test'
import {canonicalJson,sha256Json,createReviewedSnapshot} from './derived.js'

test('canonical research hashing is independent of object insertion ordering',()=>{
 const a={z:1,alpha:{b:2,a:1}}
 const b={alpha:{a:1,b:2},z:1}
 assert.equal(canonicalJson(a),canonicalJson(b))
 assert.equal(sha256Json(a),sha256Json(b))
 assert.notEqual(sha256Json({list:['a','b']}),sha256Json({list:['b','a']}))
 assert.throws(()=>canonicalJson({a:undefined}),TypeError)
 assert.throws(()=>canonicalJson({a:NaN}),TypeError)
})
test('empty reviewed research snapshot has no fabricated findings or score leaderboards',()=>{
 const a=createReviewedSnapshot({corpusHash:'sha256:fixture',methodVersion:'v8-research',
   runs:[],candidates:[],miracleClaims:[]})
 assert.equal(a.schema,'srgbl-v8-reviewed-derived-v1')
 assert.deepEqual(a.records.reviewedAnalyses,[])
 assert.deepEqual(a.publicSummaries,[])
 assert.equal(a.inputSha256.length,64)
 assert.equal(JSON.stringify(a).includes('ranking'),false)
})
test('derived builder fails closed on unreviewed/uncleared analyses and miracle claims',()=>{
 const sample={corpusHash:'fixture-hash',methodVersion:'v8-proposal',runs:[],candidates:[],miracleClaims:[]}
 assert.throws(()=>createReviewedSnapshot({...sample,runs:[{id:'unreviewed'} as never]}))
 assert.throws(()=>createReviewedSnapshot({...sample,miracleClaims:[{
   id:'miracle:example',targetPassageId:'mw:passage:test',tradition:'islam',
   claimant:'test',method:'frame',claimText:'attributed only',evidenceIds:[],
   reviewStatus:'reviewed',empiricallyVerified:false
 } as never]}),/miracle attribution requires/)
})
