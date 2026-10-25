import type { RightsStatus } from './analysis.js'

/**
 * P18-019: a text licence and an annotation licence are different objects.
 * Clearing the source text says nothing about the annotation written on it, and
 * publishing an annotation says nothing about the right to redistribute the
 * text. Age, religion and dataset names never settle either question.
 */
export const PUBLIC_DOMAIN_INFERENCE = 'prohibited' as const

export const ANNOTATION_LICENSE_KINDS = ['original-creative','editorial-summary','quotation-dependent','unlicensed'] as const
export type AnnotationLicenseKind = (typeof ANNOTATION_LICENSE_KINDS)[number]

export type AnnotationLicense = {
  kind: AnnotationLicenseKind
  /** Required only when the annotation itself is redistributed. */
  licenseId?: string
  /** A human statement about this annotation; never inferred from the text rights. */
  attestedBy?: string
}

const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

export function validateAnnotationLicense(license: AnnotationLicense): string[] {
  const errors: string[] = []
  if (!ANNOTATION_LICENSE_KINDS.includes(license?.kind))
    errors.push('unknown annotation licence kind ' + String(license?.kind))
  if (license?.kind === 'unlicensed') {
    if (nonblank(license?.licenseId)) errors.push('an unlicensed annotation cannot claim a licence id')
    if (nonblank(license?.attestedBy)) errors.push('an unlicensed annotation cannot claim an attestation')
    return errors
  }
  if (!nonblank(license?.attestedBy)) errors.push('annotation licence attestation required')
  return errors
}

export type PublicationInput = {
  textRights: RightsStatus
  annotation: AnnotationLicense
  /** True when the annotation reproduces source text rather than describing it. */
  quotesText: boolean
}

export type PublicationDecision = {
  showText: boolean
  showAnnotation: boolean
  exportAnnotation: boolean
  redistributeText: boolean
  gaps: string[]
}

export function decidePublication(input: PublicationInput): PublicationDecision {
  const gaps: string[] = []
  const license = input.annotation
  const textCleared = input.textRights === 'cleared'
  if (!textCleared) gaps.push('text:rights_not_cleared')

  const knownKind = (ANNOTATION_LICENSE_KINDS as readonly string[]).includes(license?.kind)
  if (!knownKind) gaps.push('annotation:unknown_kind')
  if (license?.kind === 'unlicensed' && nonblank(license?.licenseId)) gaps.push('annotation:unlicensed_claims_licence_id')
  if (license?.kind === 'unlicensed' && nonblank(license?.attestedBy)) gaps.push('annotation:unlicensed_claims_attestation')
  const attested = knownKind && license.kind !== 'unlicensed' && nonblank(license.attestedBy)
  if (!attested && knownKind && license.kind !== 'unlicensed') gaps.push('annotation:attestation_required')

  // Quoting a witness the corpus may not expose cannot be laundered by an
  // attested annotation licence.
  const quotationBlocked = input.quotesText && !textCleared
  if (quotationBlocked) gaps.push('annotation:quotes_restricted_text')
  // A record that claims to depend on a quotation while reproducing none is
  // inconsistent, so it is not published until the contradiction is resolved.
  const kindMismatch = !input.quotesText && license?.kind === 'quotation-dependent'
  if (kindMismatch) gaps.push('annotation:kind_claims_quotation_without_text')

  const showText = textCleared
  const showAnnotation = attested && !quotationBlocked && !kindMismatch
  const exportAnnotation = showAnnotation && nonblank(license?.licenseId)
  if (showAnnotation && !exportAnnotation) gaps.push('annotation:export_needs_licence_id')
  const redistributeText = textCleared

  return {showText, showAnnotation, exportAnnotation, redistributeText, gaps}
}
