import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CONTEXT_COVERAGE_FIELDS, REQUIRED_CONTEXT_FIELDS, measureContextCoverage,
  validateReportedContextCoverage, type ContextCard
} from './context-coverage.js'
import type { ResearchFrame } from './analysis.js'

const frame:ResearchFrame={agent:'God',recipient:'a community under pressure',domain:'textual',scope:'quran:2:286',genre:'consolation'}
function card(overrides:Partial<ContextCard>={}):ContextCard {
  return {editionId:'mw:edition:islam:quran:tanzil-uthmani',artifactId:'mw:artifact:islam:quran:2:286',
    rights:'cleared',frame,keyIds:['mw:assessment:cc:1'],evidenceIds:['mw:evidence:cc'],...overrides}
}

test('a complete card reads as 9/9 and lists no gap', () => {
  const coverage = measureContextCoverage(card())
  assert.equal(coverage.filled,REQUIRED_CONTEXT_FIELDS)
  assert.equal(coverage.display,'9/9')
  assert.deepEqual(coverage.gaps,[])
  assert.equal(coverage.ratio,1)
  assert.equal(REQUIRED_CONTEXT_FIELDS,9)
  assert.equal(CONTEXT_COVERAGE_FIELDS.length,9)
})

test('each missing field is named on its own, at 8/9', () => {
  const removals:Record<string,Partial<ContextCard>> = {
    textualWitness:{editionId:''},
    rights:{rights:'unknown'},
    genre:{frame:{...frame,genre:'  '}},
    agent:{frame:{...frame,agent:''}},
    recipient:{frame:{...frame,recipient:''}},
    domain:{frame:{...frame,domain:''}},
    scope:{frame:{...frame,scope:''}},
    key:{keyIds:[]},
    evidence:{evidenceIds:[]}
  }
  for (const field of CONTEXT_COVERAGE_FIELDS) {
    const coverage = measureContextCoverage(card(removals[field]))
    assert.deepEqual(coverage.gaps,[field], 'expected exactly one gap for ' + field)
    assert.equal(coverage.display,'8/9')
    assert.equal(coverage.filled,8)
    assert.ok(coverage.gaps[0] === field)
  }
})

test('a half-named witness, an unregistered key and padding do not fill a field', () => {
  // Field 1 asks for the edition AND the specific artifact.
  assert.deepEqual(measureContextCoverage(card({artifactId:''})).gaps,['textualWitness'])
  assert.deepEqual(measureContextCoverage(card({editionId:'   '})).gaps,['textualWitness'])
  // An unanchored key list is not a key: ids without a registered token.
  const unanchored = measureContextCoverage(card({keyIds:['   ']}))
  assert.deepEqual(unanchored.gaps,['key'])
  // Provenance alone satisfies field 9.
  const provenanceOnly = measureContextCoverage(card({evidenceIds:[],provenanceIds:['mw:provenance:cc']}))
  assert.deepEqual(provenanceOnly.gaps,[])
  // An empty array and an array of blanks are different inputs with the same result.
  assert.deepEqual(measureContextCoverage(card({evidenceIds:['  ','']})).gaps,['evidence'])
})

test('a reported x/9 must match a fresh measurement', () => {
  assert.deepEqual(validateReportedContextCoverage('9/9',card()),[])
  assert.deepEqual(validateReportedContextCoverage('8/9',card({rights:'unknown'})),[])
  const inflated = validateReportedContextCoverage('9/9',card({rights:'unknown'}))
  assert.equal(inflated.length,1)
  assert.match(inflated[0],/does not match measured 8\/9; gaps: rights/)
  assert.ok(validateReportedContextCoverage('9/10',card()).some(error => /denominator 10 must be 9/.test(error)))
  assert.ok(validateReportedContextCoverage('several',card()).some(error => /is not an x\/9 form/.test(error)))
  // The meter is readiness, not a grade: no field of the report is a text score.
  assert.deepEqual(Object.keys(measureContextCoverage(card())).sort(),
    ['display','filled','gaps','isTextQualityScore','ratio','required'])
  assert.equal(measureContextCoverage(card({rights:'restricted'})).isTextQualityScore,false)
})
