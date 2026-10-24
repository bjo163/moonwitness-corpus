import assert from 'node:assert/strict'
import test from 'node:test'
import {
  adaptPassageSources, validateSourceSelector,
  type SourceCatalog, type SourceSelector
} from './sources.js'

/**
 * P19-L05 selector scope contract. Synthetic IDs only: nothing here asserts a
 * real corpus record, a rights clearance or a reviewed interpretation.
 */
const catalog: SourceCatalog = {
  sources: [{ id: 'mw:source:alpha' }, { id: 'mw:source:beta' }],
  editions: [
    { id: 'mw:edition:alpha-v1', sourceId: 'mw:source:alpha' },
    { id: 'mw:edition:beta-v1', sourceId: 'mw:source:beta' }
  ]
}

function detail(passageId: string, contentId: string, sourceId: string, editionId: string, wording: string) {
  return {
    passage: { id: passageId },
    contents: [{
      id: contentId, text: wording, language: 'en', representation: 'source_text',
      source_id: sourceId, edition_id: editionId,
      extensions: { source: { artifact: 'mw:artifact:' + contentId, provenance: 'mw:provenance:' + contentId } }
    }],
    artifacts: [{ id: 'mw:artifact:' + contentId }],
    provenance: [{ id: 'mw:provenance:' + contentId }],
    evidence: [{ id: 'mw:evidence:' + contentId }]
  }
}

const ALPHA_TEXT = 'the light of the sun'
const alpha = adaptPassageSources(
  detail('mw:passage:test:alpha', 'mw:content:test:alpha', 'mw:source:alpha', 'mw:edition:alpha-v1', ALPHA_TEXT),
  { 'mw:content:test:alpha': { status: 'cleared', rightsRecordId: 'mw:rights:test', editionId: 'mw:edition:alpha-v1' } },
  catalog)
// Beta keeps the default UNKNOWN rights state, so its text bytes stay omitted.
const beta = adaptPassageSources(
  detail('mw:passage:test:beta', 'mw:content:test:beta', 'mw:source:beta', 'mw:edition:beta-v1', 'the light of the moon'),
  {}, catalog)
const witnesses = [...alpha.sources, ...beta.sources]

function selector(overrides: Partial<SourceSelector> = {}): SourceSelector {
  return {
    contentId: 'mw:content:test:alpha',
    passageId: 'mw:passage:test:alpha',
    editionId: 'mw:edition:alpha-v1',
    selector: { type: 'TextQuoteSelector', exact: 'light of the sun' },
    ...overrides
  }
}

test('a selector on the exact licensed passage, edition and content verifies', () => {
  assert.deepEqual(alpha.gaps, [])
  assert.equal(validateSourceSelector(selector(), witnesses, catalog).status, 'verified')
  const positioned = selector({ selector: { type: 'TextPositionSelector', start: 0, end: ALPHA_TEXT.length } })
  assert.deepEqual(validateSourceSelector(positioned, witnesses, catalog), { status: 'verified', errors: [] })
})

test('a selector reused from another edition or passage is a mismatch', () => {
  assert.deepEqual(validateSourceSelector(selector({ editionId: 'mw:edition:beta-v1' }), witnesses, catalog),
    { status: 'mismatch', errors: ['selector_edition_mismatch'] })
  assert.deepEqual(validateSourceSelector(selector({ passageId: 'mw:passage:test:beta' }), witnesses, catalog),
    { status: 'mismatch', errors: ['selector_passage_mismatch'] })
  // The same quote wording exists only in the beta edition text.
  const foreign = selector({ selector: { type: 'TextQuoteSelector', exact: 'light of the moon' } })
  assert.deepEqual(validateSourceSelector(foreign, witnesses, catalog),
    { status: 'mismatch', errors: ['selector_text_mismatch'] })
  const overflowing = selector({ selector: { type: 'TextPositionSelector', start: 0, end: ALPHA_TEXT.length + 1 } })
  assert.deepEqual(validateSourceSelector(overflowing, witnesses, catalog),
    { status: 'mismatch', errors: ['selector_position_out_of_range'] })
})

test('shared prefixes, blank identity and unknown content never resolve', () => {
  assert.deepEqual(validateSourceSelector(selector({ contentId: 'mw:content:test' }), witnesses, catalog),
    { status: 'unverifiable', errors: ['selector_witness_unresolved'] })
  assert.deepEqual(validateSourceSelector(selector({ contentId: '' }), witnesses, catalog),
    { status: 'unverifiable', errors: ['selector_identity_incomplete'] })
  assert.deepEqual(validateSourceSelector(selector({ editionId: '   ' }), witnesses, catalog),
    { status: 'unverifiable', errors: ['selector_identity_incomplete'] })
})

test('missing resolver or unlicensed text stays unverifiable, never verified', () => {
  // Without canonical records the pointer cannot be proven, even if nonblank.
  assert.deepEqual(validateSourceSelector(selector(), witnesses),
    { status: 'unverifiable', errors: ['selector_source_resolution_unavailable'] })
  const unlicensed = selector({
    contentId: 'mw:content:test:beta', passageId: 'mw:passage:test:beta', editionId: 'mw:edition:beta-v1',
    selector: { type: 'TextQuoteSelector', exact: 'light of the moon' }
  })
  assert.equal(beta.sources[0].text, undefined)
  assert.deepEqual(validateSourceSelector(unlicensed, witnesses, catalog),
    { status: 'unverifiable', errors: ['selector_text_unavailable'] })
  assert.deepEqual(validateSourceSelector(selector({ selector: { type: 'FragmentSelector' } }), witnesses, catalog),
    { status: 'unverifiable', errors: ['selector_type_unsupported'] })
  assert.deepEqual(validateSourceSelector(selector({ selector: { type: 'TextQuoteSelector', exact: '  ' } }), witnesses, catalog),
    { status: 'unverifiable', errors: ['selector_quote_missing'] })
  assert.deepEqual(validateSourceSelector(selector({ selector: { type: 'TextPositionSelector', start: 5, end: 1 } }), witnesses, catalog),
    { status: 'unverifiable', errors: ['selector_position_invalid'] })
})
