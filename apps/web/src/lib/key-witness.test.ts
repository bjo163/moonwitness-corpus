import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  CONTEXT_FIELDS, balanceByWork, compareByKey, coverageSummary, disagreementGroups, disagreementSummary,
  filterSpectrum, maxCount, measureCitationCoverage, parseExportJsonl, scoreReadiness, spectrumFacets,
  spectrumRows, validateCitation, workIdOf, type Citation,
} from './key-witness.js'
import { loadKeyWitnessExport, resetExportCache } from './key-witness-export.js'

/**
 * Behavioural tests for the model behind the console screens. The string-based
 * contract smoke could not tell a working filter from a hidden one, which is how
 * four rendered defects reached a green CI; these exercise the functions instead.
 */
const FRAME = {agent: 'narrator', recipient: 'individual', domain: 'textual', scope: 'quran:2:286', genre: 'prayer'}
const RIGHTS = {text: 'cleared', annotation: {kind: 'original-creative', attestedBy: 'mw:agent:curator', licenseId: 'CC-BY-4.0'}, publicDomainInference: 'prohibited'} as const

function citation(overrides: Partial<Citation> = {}): Citation {
  return {
    schema: 'mw:citation:v0',
    passageId: 'mw:passage:islam:quran:2:286',
    editionId: 'mw:edition:synthetic:witness',
    artifactId: 'mw:artifact:synthetic:leaf',
    contentId: null,
    text: 'SYNTHETIC witness text - not scripture',
    textOmissionReason: null,
    keys: [{
      id: 'mw:assessment:key:a:1', key: 'hope', scheme: 'semantic-core:v0', method: 'srgbl-v8:key-direction:v0',
      assessor: 'mw:agent:a', reviewStatus: 'reviewed', relation: 'comforts', direction: 2, frame: FRAME,
    }],
    messages: [],
    rights: {...RIGHTS},
    provenance: ['mw:provenance:synthetic'],
    evidence: ['mw:evidence:synthetic'],
    methodVersion: 'srgbl-v8:key-direction:v0',
    corpusHash: 'a'.repeat(64),
    deepLink: 'https://moonwitness.example/app/key-witness/mw:passage:islam:quran:2:286',
    frameNote: 'Read inside the recorded frame only.',
    ...overrides,
  }
}

test('context coverage is nine named fields, and an unknown right is a gap', () => {
  const complete = measureCitationCoverage(citation())
  assert.equal(complete.display, '9/9')
  assert.deepEqual(complete.gaps, [])
  assert.equal(CONTEXT_FIELDS.length, 9)
  assert.equal(complete.isTextQualityScore, false)

  // `unknown` is a question, not an answer, and an edition without an artifact is not a witness.
  const partial = measureCitationCoverage(citation({
    rights: {...RIGHTS, text: 'unknown' as const},
    artifactId: '',
    keys: [{...citation().keys[0], frame: undefined}],
  }))
  assert.equal(partial.display, '2/9')
  assert.deepEqual(partial.gaps, ['textualWitness', 'rights', 'genre', 'agent', 'recipient', 'domain', 'scope'])
  assert.equal(partial.frameSource, null)
})

test('coverage summary counts a field once per passage, and complete only at 9/9', () => {
  const summary = coverageSummary([citation(), citation({passageId: 'mw:passage:islam:quran:2:287', rights: {...RIGHTS, text: 'unknown' as const}})])
  assert.equal(summary.measured.length, 2)
  assert.equal(summary.complete, 1)
  assert.equal(summary.gaps.rights, 1)
  assert.equal(summary.average, (1 + 8 / 9) / 2)
})

test('the v0 profile is reported as not computable, with the missing inputs named', () => {
  const single = scoreReadiness(citation(), measureCitationCoverage(citation()))
  assert.equal(single.status, 'not-computable')
  assert.equal(single.agreement, null)
  assert.deepEqual(single.missingInputs, ['weight', 'intensity', 'confidence', 'a second assessor'])
  assert.equal(single.researchOnly, true)

  const paired = citation({keys: [citation().keys[0], {...citation().keys[0], id: 'mw:assessment:key:b:1', assessor: 'mw:agent:b'}]})
  assert.deepEqual(scoreReadiness(paired, measureCitationCoverage(paired)).missingInputs, ['weight', 'intensity', 'confidence'])
})

test('disagreement keeps one row per assessor and never computes agreement', () => {
  const keys = [citation().keys[0], {...citation().keys[0], id: 'mw:assessment:key:b:1', assessor: 'mw:agent:b', direction: -1}]
  const groups = disagreementGroups([citation({keys})])
  assert.equal(groups.length, 1)
  assert.deepEqual(groups[0].assessors.map(group => group.assessor), ['mw:agent:a', 'mw:agent:b'])
  assert.equal(groups[0].unpaired, false)
  assert.equal(groups[0].agreementComputed, false)
  assert.equal(groups[0].adjudicated, false)
  assert.equal(disagreementSummary(groups).alternateAssessments, 1)

  const lone = disagreementGroups([citation()])
  assert.equal(lone[0].unpaired, true)
  assert.equal(disagreementSummary(lone).singleAssessor, 1)
})

test('compare refuses a different method and prints frame boundaries', () => {
  const left = citation()
  const right = citation({passageId: 'mw:passage:islam:quran:2:287', keys: [{...citation().keys[0], id: 'mw:assessment:key:a:2'}]})
  const same = compareByKey([left, right], 'hope', left.passageId, right.passageId)
  assert.equal(same.status, 'comparable')
  assert.deepEqual(same.frameBoundaries, [])
  assert.equal(same.globalScore, null)
  assert.deepEqual(same.sides.map(side => side.assessorCount), [1, 1])

  // A differing frame field is printed as a boundary instead of being normalised away.
  const otherGenre = citation({passageId: right.passageId, keys: [{...citation().keys[0], id: 'mw:assessment:key:a:2', frame: {...FRAME, genre: 'hymn'}}]})
  assert.deepEqual(compareByKey([left, otherGenre], 'hope', left.passageId, otherGenre.passageId).frameBoundaries, ['genre: prayer vs hymn'])

  const otherMethod = citation({
    passageId: right.passageId,
    keys: [{...citation().keys[0], id: 'mw:assessment:key:a:2', method: 'srgbl-v8:source-trace:v1'}],
  })
  const mismatch = compareByKey([left, otherMethod], 'hope', left.passageId, otherMethod.passageId)
  assert.equal(mismatch.status, 'method-mismatch')
  assert.match(mismatch.refusals[0], /different methods/)

  const missing = compareByKey([left], 'hope', left.passageId, 'mw:passage:islam:quran:9:9')
  assert.equal(missing.status, 'missing-side')
})

test('a second assessor on one side is disclosed, not hidden', () => {
  const left = citation({keys: [citation().keys[0], {...citation().keys[0], id: 'mw:assessment:key:b:1', assessor: 'mw:agent:b'}]})
  const right = citation({passageId: 'mw:passage:islam:quran:2:287'})
  const result = compareByKey([left, right], 'hope', left.passageId, right.passageId)
  assert.deepEqual(result.sides.map(side => side.assessorCount), [2, 1])
  assert.equal(result.sides[0].assessor, 'mw:agent:a')
})

test('the spectrum filters by facet and lists alphabetically, never by count', () => {
  const rows = spectrumRows([
    citation({keys: [{...citation().keys[0], key: 'trust', direction: -1, relation: 'warns'}]}),
    citation({passageId: 'mw:passage:islam:quran:9:9', keys: [{...citation().keys[0], id: 'mw:assessment:key:c:1', key: 'comfort'}]}),
  ])
  assert.deepEqual(rows.map(row => row.key), ['trust', 'comfort'])
  const facets = spectrumFacets(rows)
  assert.deepEqual(facets.keys, ['comfort', 'trust'])
  assert.equal(facets.available.relation, 2)
  assert.deepEqual(facets.directions, [-1, 2])
  assert.equal(filterSpectrum(rows, {key: '', relation: 'warns', direction: '', frame: ''}).length, 1)
  assert.equal(filterSpectrum(rows, {key: '', relation: '', direction: '-1', frame: ''}).length, 1)
  assert.equal(filterSpectrum(rows, {key: 'comfort', relation: '', direction: '', frame: 'narrator / prayer'}).length, 1)
  assert.equal(filterSpectrum(rows, {key: '', relation: '', direction: '', frame: ''}).length, 2)
})

test('balance counts per work and sorts by name, so a bar is not a ranking', () => {
  const works = balanceByWork([citation(), citation({passageId: 'mw:passage:islam:quran:2:287'})])
  assert.equal(works.length, 1)
  assert.equal(works[0].workId, 'mw:work:islam:quran')
  assert.equal(workIdOf('mw:passage:islam:quran:2:286'), 'mw:work:islam:quran')
  assert.equal(maxCount([{token: 'a', count: 1, assessors: ['x']}, {token: 'b', count: 4, assessors: ['x']}]), 4)
})

test('the citation validator refuses a public-domain inference and an unreviewed message', () => {
  assert.doesNotThrow(() => validateCitation(citation()))
  assert.throws(() => validateCitation({...citation(), rights: {...citation().rights, publicDomainInference: 'allowed'}}), /public domain/)
  assert.throws(() => validateCitation({...citation(), messages: [{
    id: 'mw:message:x', message: 'synthetic', boundaryNote: 'not universal', reviewStatus: 'draft',
    reviewer: 'mw:agent:r', sourceKeyAssessmentIds: ['mw:assessment:key:a:1'],
  }]}), /draft/)
})

test('an empty or malformed export is refused whole', () => {
  assert.match(parseExportJsonl('').errors[0], /no records/)
  assert.ok(parseExportJsonl('{"schema":"mw:citation:v0"}\n').errors.length > 0)
})

test('the export loader asks the API once per page load and recovers after a failure', async () => {
  const original = globalThis.fetch
  const calls: string[] = []
  resetExportCache()
  try {
    globalThis.fetch = (async (url: string) => {
      calls.push(String(url))
      return new Response(JSON.stringify({error: 'key_witness_not_materialized'}), {status: 404, headers: {'content-type': 'application/json'}})
    }) as typeof fetch
    const first = loadKeyWitnessExport('https://api.test')
    const second = loadKeyWitnessExport('https://api.test')
    // One in-flight request is shared, not duplicated by every screen that asks.
    assert.equal(first, second)
    const [a, b] = await Promise.all([first, second])
    assert.equal(a.ok, false)
    assert.match(a.message, /No sealed export is published yet/)
    assert.equal(calls.length, 1)
    // A failed read is evicted, so the next screen can try again instead of caching the outage.
    await loadKeyWitnessExport('https://api.test')
    assert.equal(calls.length, 2)
    assert.equal((await loadKeyWitnessExport('')).message.includes('NEXT_PUBLIC_RGBL_API_URL'), true)
  } finally {
    globalThis.fetch = original
    resetExportCache()
  }
})

test('the web meter and the server meter name the same nine fields', async () => {
  const source = await readFile(new URL('../../../../packages/srgbl/src/context-coverage.ts', import.meta.url), 'utf8')
  const block = source.match(/CONTEXT_COVERAGE_FIELDS = \[([\s\S]*?)\] as const/)
  assert.ok(block, 'CONTEXT_COVERAGE_FIELDS is missing from packages/srgbl')
  const serverFields = [...block![1].matchAll(/'([a-zA-Z]+)'/g)].map(match => match[1])
  assert.deepEqual(serverFields, [...CONTEXT_FIELDS])
})
