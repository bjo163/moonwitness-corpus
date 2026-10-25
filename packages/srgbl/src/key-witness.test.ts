import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildKeyWitnessExport, sealKeyWitnessIndex, verifyKeyWitnessIndex,
  type KeyWitnessIndex, type KeyWitnessIndexInput, type KeyWitnessRecord
} from './key-witness.js'
import type { CitationKey } from './citation.js'

const HASH = 'a'.repeat(64)
const LICENSE = {kind:'original-creative',attestedBy:'mw:agent:curator',licenseId:'CC-BY-4.0'} as const
const QUOTING = {kind:'quotation-dependent',attestedBy:'mw:agent:curator',licenseId:'CC-BY-4.0'} as const

/** Synthetic ids and text only: no real edition is implied to be cleared here. */
function record(overrides:Partial<KeyWitnessRecord>={}):KeyWitnessRecord {
  const passageId=overrides.passageId ?? 'mw:passage:islam:quran:2:286'
  const keys:CitationKey[]=[{id:'mw:assessment:key:'+passageId.split(':').slice(2).join('-')+':1',
    key:'hope',scheme:'semantic-core:v0',method:'srgbl-v8:key-direction:v0',
    assessor:'mw:agent:a',reviewStatus:'reviewed'}]
  return {
    passageId,
    editionId:'mw:edition:synthetic:test-witness',
    artifactId:'mw:artifact:synthetic:test-leaf',
    contentId:'mw:content:synthetic:test-witness:ar',
    textRights:'restricted',
    annotationLicense:LICENSE,
    keys,
    messages:[{id:'mw:message:'+passageId.split(':').slice(2).join('-'),
      message:'Read as reassurance after a burden.',
      boundaryNote:'Not a universal promise.',
      reviewStatus:'reviewed',reviewer:'mw:agent:reviewer',
      sourceKeyAssessmentIds:[keys[0].id]}],
    provenanceIds:['mw:provenance:synthetic:editorial'],
    evidenceIds:['mw:evidence:synthetic:1'],
    ...overrides
  }
}
function input(overrides:Partial<KeyWitnessIndexInput>={}):KeyWitnessIndexInput {
  return {
    corpusHash:HASH,
    methodVersion:'srgbl-v8:key-direction:v0',
    deepLinkBase:'https://moonwitness.example/app/',
    entries:[record()],
    ...overrides
  }
}

test('a sealed index exports deterministic JSONL with a manifest, and only JSONL', () => {
  const first=record({passageId:'mw:passage:islam:quran:2:286'})
  const second=record({passageId:'mw:passage:islam:quran:1:2'})
  const index=sealKeyWitnessIndex(input({entries:[first,second]}))
  assert.equal(index.schema,'mw:key-witness-index:v0')
  assert.match(index.indexSha256,/^[a-f0-9]{64}$/)
  // The checksum covers the record set, not the caller's array order.
  assert.equal(sealKeyWitnessIndex(input({entries:[second,first]})).indexSha256,index.indexSha256)

  const exported=buildKeyWitnessExport(index)
  assert.deepEqual(exported.errors,[])
  const jsonl=exported.jsonl!
  const lines=jsonl.split('\n').filter(Boolean)
  assert.equal(lines.length,2)
  // Sorted by passage id, so the bytes never depend on insertion order.
  assert.deepEqual(lines.map(line=>JSON.parse(line).passageId),['mw:passage:islam:quran:1:2','mw:passage:islam:quran:2:286'])
  for (const line of lines) {
    const parsed=JSON.parse(line)
    assert.equal(parsed.schema,'mw:citation:v0')
    assert.equal(parsed.text,null)
    assert.match(parsed.textOmissionReason,/source text is restricted/)
    assert.equal(parsed.rights.publicDomainInference,'prohibited')
    assert.ok(parsed.deepLink.startsWith('https://moonwitness.example/app/passages/'))
    for (const forbidden of ['"score"','"rank"','"verdict"','"consensus"','"winner"','"maturity"'])
      assert.equal(line.includes(forbidden),false,'export must not carry '+forbidden)
  }
  const manifest=exported.manifest!
  assert.equal(manifest.schema,'mw:key-witness-export:v0')
  assert.equal(manifest.recordSchema,'mw:citation:v0')
  assert.equal(manifest.recordCount,2)
  assert.equal(manifest.byteLength,Buffer.byteLength(jsonl,'utf8'))
  assert.match(manifest.jsonlSha256,/^[a-f0-9]{64}$/)
  assert.equal(manifest.indexSha256,index.indexSha256)
  assert.deepEqual(manifest.formats,{jsonl:'available',parquet:'not-implemented'})
  assert.match(manifest.parquetGap,/may not claim a format it does not emit/)
  assert.equal(manifest.scoresIncluded,false)
  assert.equal(manifest.publicDomainInference,'prohibited')
  assert.match(manifest.frameNote,/not a verdict, no score/)
})

test('cleared text travels; restricted text cannot even be stored in the index', () => {
  const cleared=sealKeyWitnessIndex(input({entries:[record({
    text:'SYNTHETIC WITNESS TEXT - NOT SCRIPTURE',textRights:'cleared',annotationLicense:QUOTING
  })]}))
  const exported=buildKeyWitnessExport(cleared)
  assert.ok(exported.jsonl?.includes('SYNTHETIC WITNESS TEXT - NOT SCRIPTURE'))
  assert.equal(exported.manifest?.recordCount,1)

  // Handing restricted text to the sealer is refused, not quietly dropped.
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({
    text:'SYNTHETIC WITNESS TEXT - NOT SCRIPTURE',textRights:'restricted'
  })]})),/only cleared text may be stored/)
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({
    text:'SYNTHETIC WITNESS TEXT - NOT SCRIPTURE',textRights:'unknown'
  })]})),/only cleared text may be stored/)
})

test('sealing refuses an untraceable or unexportable entry', () => {
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[]})),/no entries is not an export/)
  assert.throws(()=>sealKeyWitnessIndex(input({deepLinkBase:'  '})),/deep-link base/)
  assert.throws(()=>sealKeyWitnessIndex(input({corpusHash:'not-a-hash'})),/sha256/)
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({passageId:'quran:2:286'})]})),/passageId must be canonical/)
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({provenanceIds:[]})]})),/provenanceIds/)
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({evidenceIds:[]})]})),/evidenceIds/)
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({keys:[]})]})),/at least one key assessment/)
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record(),record()]})),/duplicate entry for passage/)
  // A draft message is not exportable, so it cannot be sealed either.
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({
    messages:[{...record().messages![0],reviewStatus:'draft',reviewer:undefined}]
  })]})),/is draft, not reviewed/)
  // A score or ranking field is not an extension the index may invent.
  assert.throws(()=>sealKeyWitnessIndex(input({
    entries:[{...record(),score:0.72} as unknown as KeyWitnessRecord]
  })),/unknown field in entry\[0\]: score/)
})

test('annotation facets travel with the cited key, and a fabricated one is refused', () => {
  const frame={agent:'narrator',recipient:'individual',domain:'textual',scope:'quran:2:286',genre:'annotation'}
  const faceted=buildKeyWitnessExport(sealKeyWitnessIndex(input({entries:[record({keys:[{
    ...record().keys[0],relation:'comforts',direction:1,frame
  }]})]})))
  assert.deepEqual(faceted.errors,[])
  const cited=JSON.parse(faceted.jsonl!.trim()).keys[0]
  assert.equal(cited.relation,'comforts')
  assert.equal(cited.direction,1)
  assert.equal(cited.frame.genre,'annotation')
  // An absent facet stays absent rather than becoming a neutral 0 a filter would match.
  const plain=JSON.parse(buildKeyWitnessExport(sealKeyWitnessIndex(input())).jsonl!.trim()).keys[0]
  assert.equal('direction' in plain,false)
  assert.equal('frame' in plain,false)
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({keys:[{...record().keys[0],direction:3 as never}]})]})),/direction outside/)
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({keys:[{...record().keys[0],relation:'blesses' as never}]})]})),/undeclared relation/)
  // A partial frame is not a frame: all five fields or none.
  assert.throws(()=>sealKeyWitnessIndex(input({entries:[record({keys:[{...record().keys[0],frame:{agent:'narrator'} as never}]})]})),/frame\./)
})

test('a sealed index is served only while its bytes still hash to the seal', () => {
  const sealed=sealKeyWitnessIndex(input())
  assert.equal(verifyKeyWitnessIndex(JSON.parse(JSON.stringify(sealed)),HASH).indexSha256,sealed.indexSha256)

  // Another corpus snapshot is not this export.
  assert.throws(()=>verifyKeyWitnessIndex(sealed,'b'.repeat(64)),/corpus hash mismatch/)
  // An edited message without a new seal is drift, not an improved reading.
  const tampered=structuredClone(sealed) as KeyWitnessIndex
  tampered.entries[0].messages![0].message='Injected interpretation'
  assert.throws(()=>verifyKeyWitnessIndex(tampered,HASH),/index has changed since it was sealed/)
  // Reordering is a byte change too, so the rest of the shape is pinned.
  const reordered=JSON.parse(JSON.stringify(sealKeyWitnessIndex(input({
    entries:[record({passageId:'mw:passage:islam:quran:1:2'}),record({passageId:'mw:passage:islam:quran:2:286'})]
  }))))
  reordered.entries.reverse()
  assert.throws(()=>verifyKeyWitnessIndex(reordered,HASH),/index has changed since it was sealed/)
  // Unknown fields are refused rather than ignored.
  const widened=JSON.parse(JSON.stringify(sealed))
  widened.witnessScore=100
  assert.throws(()=>verifyKeyWitnessIndex(widened,HASH),/unknown field: witnessScore/)
  assert.throws(()=>verifyKeyWitnessIndex({...sealed,indexSha256:'nope'},HASH),/index checksum missing/)
  assert.throws(()=>verifyKeyWitnessIndex(null,HASH),/missing object/)
})

test('an unexportable batch fails whole instead of shipping a partial file', () => {
  const sealed=sealKeyWitnessIndex(input())
  // A fabrication that never passed the sealer: one entry lost its key trail.
  const forged={...sealed,entries:[{...sealed.entries[0],keys:[]}]} as KeyWitnessIndex
  const exported=buildKeyWitnessExport(forged)
  assert.equal(exported.jsonl,null)
  assert.equal(exported.manifest,null)
  assert.deepEqual(exported.records,[])
  assert.ok(exported.errors.some(error=>/at least one key/.test(error)))
})
