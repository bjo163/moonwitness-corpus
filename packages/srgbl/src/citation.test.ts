import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCitationBundle, type CitationInput } from './citation.js'

const license = {kind:'quotation-dependent',attestedBy:'mw:agent:curator',licenseId:'CC-BY-4.0'} as const
function input(overrides:Partial<CitationInput>={}):CitationInput {
  return {
    passageId:'mw:passage:islam:quran:2:286',
    editionId:'mw:edition:synthetic:test-witness',
    artifactId:'mw:artifact:synthetic:test-witness-leaf',
    contentId:'mw:content:synthetic:test-witness:ar',
    // A synthetic marker, not a scripture wording: this fixture exercises the
    // export branch, it does not claim any real edition is cleared.
    text:'SYNTHETIC WITNESS TEXT - NOT SCRIPTURE',
    textRights:'cleared',
    annotationLicense:license,
    keys:[{id:'mw:assessment:cit:1',key:'hope',scheme:'semantic-core:v0',method:'derived:v0',assessor:'mw:agent:a',reviewStatus:'reviewed'}],
    messages:[{id:'mw:message:cit:1',message:'Read as reassurance after a burden.',boundaryNote:'Not a universal promise.',reviewStatus:'reviewed',reviewer:'mw:agent:reviewer',sourceKeyAssessmentIds:['mw:assessment:cit:1']}],
    provenanceIds:['mw:provenance:cit:editorial'],
    evidenceIds:['mw:evidence:cit'],
    methodVersion:'srgbl-v8:key-direction:v0',
    corpusHash:'a'.repeat(64),
    deepLinkBase:'https://moonwitness.example/app/',
    ...overrides
  }
}

test('a cleared citation carries text, keys, rights, provenance and one deep link', () => {
  const result = buildCitationBundle(input())
  assert.deepEqual(result.errors,[])
  assert.ok(result.citation)
  assert.equal(result.citation.schema,'mw:citation:v0')
  assert.equal(result.citation.text,input().text)
  assert.equal(result.citation.textOmissionReason,null)
  assert.equal(result.citation.rights.text,'cleared')
  assert.equal(result.citation.rights.annotation.licenseId,'CC-BY-4.0')
  assert.equal(result.citation.rights.publicDomainInference,'prohibited')
  assert.deepEqual([...result.citation.provenance],['mw:provenance:cit:editorial'])
  assert.deepEqual(result.citation.messages.map(item => item.id),['mw:message:cit:1'])
  // The colon inside a canonical passage id must survive the link.
  assert.equal(result.citation.deepLink,
    'https://moonwitness.example/app/passages/' + encodeURIComponent('mw:passage:islam:quran:2:286') +
    '?method=' + encodeURIComponent('srgbl-v8:key-direction:v0'))
})

test('a restricted text is never carried out, and is refused outright if supplied', () => {
  const withoutText = buildCitationBundle(input({textRights:'restricted',text:undefined,
    annotationLicense:{kind:'original-creative',attestedBy:'mw:agent:curator',licenseId:'CC-BY-4.0'}}))
  assert.deepEqual(withoutText.errors,[])
  assert.equal(withoutText.citation?.text,null)
  assert.match(withoutText.citation?.textOmissionReason ?? '',/source text is restricted/)
  assert.equal(withoutText.citation?.keys.length,1)
  assert.equal(JSON.stringify(withoutText.citation).includes('SYNTHETIC WITNESS TEXT'),false)
  // Handing the builder restricted text with a quoting licence is refused, not laundered.
  const quoting = buildCitationBundle(input({textRights:'restricted'}))
  assert.equal(quoting.citation,null)
  assert.ok(quoting.errors.some(error => /annotation is not publishable/.test(error)))
})

test('a citation is refused when any part of the trail is missing or unregistered', () => {
  assert.ok(buildCitationBundle(input({deepLinkBase:undefined})).errors.includes('citation needs a deployment-provided deep-link base'))
  assert.ok(buildCitationBundle(input({passageId:'quran:2:286'})).errors.some(error => /passageId must be canonical/.test(error)))
  assert.ok(buildCitationBundle(input({editionId:'   '})).errors.some(error => /citation.editionId required/.test(error)))
  assert.ok(buildCitationBundle(input({keys:[]})).errors.includes('citation needs at least one key'))
  const unregistered = buildCitationBundle(input({keys:[{...input().keys[0],key:'prosperity'}]}))
  assert.ok(unregistered.errors.some(error => /controlled candidate registry/.test(error)))
  const looseAssessor = buildCitationBundle(input({keys:[{...input().keys[0],assessor:'a friend'}]}))
  assert.ok(looseAssessor.errors.some(error => /assessor must be a canonical mw: principal/.test(error)))
  assert.ok(buildCitationBundle(input({messages:[{...input().messages![0],reviewStatus:'draft',reviewer:undefined}]}))
    .errors.some(error => /is draft, not reviewed/.test(error)))
  assert.ok(buildCitationBundle(input({messages:[{...input().messages![0],boundaryNote:''}]}))
    .errors.some(error => /needs a boundary note/.test(error)))
})

test('the bundle cites records and never ranks them', () => {
  const two = input({keys:[
    {id:'mw:assessment:cit:2',key:'warning',scheme:'semantic-core:v0',method:'derived:v0',assessor:'mw:agent:b',reviewStatus:'draft'},
    {id:'mw:assessment:cit:1',key:'hope',scheme:'semantic-core:v0',method:'derived:v0',assessor:'mw:agent:a',reviewStatus:'reviewed'}
  ]})
  const result = buildCitationBundle(two)
  assert.deepEqual(result.errors,[])
  assert.deepEqual(result.citation?.keys.map(item => item.id),['mw:assessment:cit:1','mw:assessment:cit:2'])
  // One assessor citing the same key twice stays one citation.
  const duplicated = buildCitationBundle(input({keys:[input().keys[0],input().keys[0]]}))
  assert.equal(duplicated.citation?.keys.length,1)
  const serialized = JSON.stringify(result.citation)
  for (const forbidden of ['"score"','"rank"','"verdict"','"consensus"','"winner"','"goodness"'])
    assert.equal(serialized.includes(forbidden),false, 'citation must not carry ' + forbidden)
  assert.match(result.citation?.frameNote ?? '',/not canonical text and not a verdict/)
})
