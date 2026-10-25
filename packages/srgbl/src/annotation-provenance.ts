import { validateAnnotationSubmission, type KeyAnnotationSubmission } from './keys.js'

/**
 * P18-018: provenance answers who recorded an annotation, with what method,
 * when, and on which evidence. It does not certify that the assessor was
 * right, independent, or authorized - `attestsIndependence` is a literal false.
 */
export type AnnotationProvenance = {
  readonly id: string
  readonly submissionId: string
  readonly assessor: string
  readonly method: string
  readonly scheme: string
  readonly passageId: string
  /** Instant supplied by the recording tool; never inferred from a commit. */
  readonly at: string
  readonly evidenceIds: readonly string[]
  readonly derivedFromKeyAssessmentId: string | null
  readonly tool: string | null
  readonly attestsIndependence: false
  readonly attestsCorrectness: false
}

export type ProvenanceInput = {
  submission: KeyAnnotationSubmission
  at: string
  id?: string
  derivedFromKeyAssessmentId?: string | null
  tool?: string | null
}

const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

export function validateAnnotationProvenance(record: AnnotationProvenance): string[] {
  const errors: string[] = []
  for (const field of ['id','submissionId','assessor','method','scheme','passageId','at'] as const)
    if (!nonblank(record?.[field])) errors.push('provenance.' + field + ' required')
  if (nonblank(record?.id) && !record.id.startsWith('mw:provenance:'))
    errors.push('provenance.id must be an mw:provenance: reference')
  // The submission id belongs to the recording tool's own space, so only the
  // people and passages a provenance row points at are held to canonical form.
  for (const field of ['assessor','passageId'] as const)
    if (nonblank(record?.[field]) && !record[field].startsWith('mw:'))
      errors.push('provenance.' + field + ' must be a canonical mw: reference')
  if (nonblank(record?.at) && Number.isNaN(Date.parse(record.at)))
    errors.push('provenance.at is not an ISO-8601 instant')
  if (!Array.isArray(record?.evidenceIds) || record.evidenceIds.length === 0 || record.evidenceIds.some(x => !nonblank(x)))
    errors.push('provenance evidence required')
  if (record?.derivedFromKeyAssessmentId !== null && !nonblank(record?.derivedFromKeyAssessmentId ?? null))
    errors.push('provenance.derivedFromKeyAssessmentId must be null or a reference')
  if (record?.derivedFromKeyAssessmentId !== null && typeof record?.derivedFromKeyAssessmentId === 'string' &&
    !record.derivedFromKeyAssessmentId.startsWith('mw:'))
    errors.push('provenance.derivedFromKeyAssessmentId must be a canonical mw: reference')
  // Provenance is a record, never an outcome.
  for (const forbidden of ['verdict','adjudicated','consensus','agreed'])
    if (record && Object.prototype.hasOwnProperty.call(record, forbidden))
      errors.push('provenance must not carry ' + forbidden)
  return errors
}

export function recordAnnotationProvenance(input: ProvenanceInput): {provenance: AnnotationProvenance | null; errors: string[]} {
  const submission = input?.submission
  const errors = validateAnnotationSubmission(submission).map(error => 'submission: ' + error)
  const provenanceId = nonblank(input?.id)
    ? input.id
    : (nonblank(submission?.id) ? 'mw:provenance:annotation:' + submission.id : '')
  const candidate: AnnotationProvenance = Object.freeze({
    id: provenanceId ?? '',
    submissionId: submission?.id ?? '',
    assessor: submission?.assessor ?? '',
    method: submission?.method ?? '',
    scheme: submission?.scheme ?? '',
    passageId: submission?.passageId ?? '',
    at: input?.at ?? '',
    evidenceIds: Object.freeze([...(submission?.evidenceIds ?? [])]),
    derivedFromKeyAssessmentId: input?.derivedFromKeyAssessmentId ?? null,
    tool: nonblank(input?.tool) ? input.tool : null,
    attestsIndependence: false as const,
    attestsCorrectness: false as const
  })
  errors.push(...validateAnnotationProvenance(candidate))
  // An incomplete record is refused outright rather than stored with blanks.
  return {provenance: errors.length === 0 ? candidate : null, errors}
}
