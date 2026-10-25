import { validateAnnotationSubmission, type KeyAnnotationSubmission } from './keys.js'

/**
 * Agreement is only computable from paired, independently assessed, same-scheme
 * annotations. Synthetic fixtures exercise this module; they never stand in for
 * the empirical pilot, so `satisfiesPilot` stays false here.
 */
export type AnnotationProvenance = 'synthetic-fixture' | 'human-pilot'

export type PairedAnnotationCase = {
  first: KeyAnnotationSubmission
  /** Absent when only one assessor returned a submission for the case. */
  second?: KeyAnnotationSubmission
  provenance: AnnotationProvenance
}

export type AgreementExclusions = {
  missingSecondSubmission: number
  invalidSubmission: number
  differentPassage: number
  differentScheme: number
  duplicateAssessor: number
}

export type AgreementReport = {
  scheme: string
  /** Every case the pilot offered, including the ones that could not be paired. */
  offered: number
  /** Cases that contributed to the coefficient. */
  comparable: number
  missing: number
  exclusions: AgreementExclusions
  observedAgreement: number | null
  kappa: number | null
  kappaLimits: {lower: number; upper: number; method: string} | null
  estimable: boolean
  reason: string | null
  provenance: AnnotationProvenance[]
  /** Always false until independently paired human annotations exist. */
  satisfiesPilot: false
  pilotStatus: 'blocked-pilot-input'
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value))

export function computeAgreement(input: {
  cases: readonly PairedAnnotationCase[]
  scheme: string
  minComparable?: number
}): AgreementReport {
  const minComparable = input.minComparable ?? 2
  if (!Number.isInteger(minComparable) || minComparable < 2) throw new TypeError('minComparable must be an integer >= 2')
  const exclusions: AgreementExclusions = {
    missingSecondSubmission: 0, invalidSubmission: 0, differentPassage: 0, differentScheme: 0, duplicateAssessor: 0
  }
  const pairs: {a: string; b: string}[] = []
  for (const item of input.cases ?? []) {
    const {first, second} = item
    if (!second) { exclusions.missingSecondSubmission++; continue }
    if (validateAnnotationSubmission(first).length || validateAnnotationSubmission(second).length) { exclusions.invalidSubmission++; continue }
    if (first.passageId !== second.passageId) { exclusions.differentPassage++; continue }
    if (first.scheme !== input.scheme || second.scheme !== input.scheme) { exclusions.differentScheme++; continue }
    if (first.assessor.trim().toLowerCase() === second.assessor.trim().toLowerCase()) { exclusions.duplicateAssessor++; continue }
    pairs.push({a: first.key, b: second.key})
  }
  const n = pairs.length
  const missing = (input.cases ?? []).length - n
  const base = {
    scheme: input.scheme,
    offered: (input.cases ?? []).length,
    comparable: n,
    missing,
    exclusions,
    provenance: [...new Set((input.cases ?? []).map(item => item.provenance))].sort() as AnnotationProvenance[],
    satisfiesPilot: false as const,
    pilotStatus: 'blocked-pilot-input' as const
  }
  if (n < minComparable) {
    return {...base, observedAgreement: null, kappa: null, kappaLimits: null, estimable: false,
      reason: 'not estimable: ' + n + ' comparable paired case(s), at least ' + minComparable + ' required'}
  }
  const agree = pairs.filter(pair => pair.a === pair.b).length
  const po = agree / n
  const keys = [...new Set(pairs.flatMap(pair => [pair.a, pair.b]))].sort()
  let pe = 0
  for (const key of keys) {
    const left = pairs.filter(pair => pair.a === key).length / n
    const right = pairs.filter(pair => pair.b === key).length / n
    pe += left * right
  }
  if (pe >= 1) {
    return {...base, observedAgreement: po, kappa: null, kappaLimits: null, estimable: false,
      reason: 'not estimable: both assessors used a single key, so chance agreement is 1'}
  }
  const kappa = (po - pe) / (1 - pe)
  // Asymptotic standard error under fixed marginals; an approximation, not a bootstrap interval.
  const se = Math.sqrt((po * (1 - po)) / (n * (1 - pe) ** 2))
  return {...base, observedAgreement: po, kappa, estimable: true, reason: null,
    kappaLimits: {lower: clamp(kappa - 1.96 * se), upper: clamp(kappa + 1.96 * se),
      method: 'cohen-kappa-asymptotic-se-approximation'}}
}
