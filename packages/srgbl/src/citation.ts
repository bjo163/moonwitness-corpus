import { decidePublication, type AnnotationLicense } from './licensing.js'
import { KEY_RELATIONS, validateKeyToken, type KeyRelation } from './keys.js'
import { DIRECTION_VALUES } from './vocabulary.js'
import { validateResearchFrame, type ResearchFrame, type ReviewStatus, type RightsStatus } from './analysis.js'

/**
 * P18-016: a citation carries the reader back to the evidence. It bundles the
 * source text *only when the text licence allows it*, the key bundle, the
 * rights statements, the provenance pointers and one deep link. It never
 * carries a combined score, a ranking or a verdict.
 */
export type CitationKey = {
  id: string
  key: string
  scheme: string
  method: string
  assessor: string
  reviewStatus: ReviewStatus
  /**
   * Annotation facets, when the assessment recorded them. P18-011 filters the
   * spectrum by key, relation, direction and frame, so a citation has to carry
   * what it was annotated with instead of letting the reader guess.
   */
  relation?: KeyRelation
  direction?: -2 | -1 | 0 | 1 | 2
  frame?: ResearchFrame
}

export type CitationMessage = {
  id: string
  message: string
  boundaryNote: string
  reviewStatus: ReviewStatus
  reviewer?: string
  sourceKeyAssessmentIds: readonly string[]
}

export type CitationInput = {
  passageId: string
  editionId: string
  artifactId: string
  contentId?: string
  /** The witness text. Included only when `textRights` permits it. */
  text?: string
  textRights: RightsStatus
  annotationLicense: AnnotationLicense
  keys: readonly CitationKey[]
  messages?: readonly CitationMessage[]
  provenanceIds: readonly string[]
  evidenceIds: readonly string[]
  methodVersion: string
  corpusHash: string
  /** Supplied by the deployment; this module never invents a host. */
  deepLinkBase?: string
}

export type CitationBundle = {
  schema: 'mw:citation:v0'
  passageId: string
  editionId: string
  artifactId: string
  contentId: string | null
  text: string | null
  textOmissionReason: string | null
  keys: CitationKey[]
  messages: CitationMessage[]
  rights: { text: RightsStatus; annotation: AnnotationLicense; publicDomainInference: 'prohibited' }
  provenance: string[]
  evidence: string[]
  methodVersion: string
  corpusHash: string
  deepLink: string
  frameNote: string
}

const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

export function buildCitationBundle(input: CitationInput): {citation: CitationBundle | null; errors: string[]} {
  const errors: string[] = []
  for (const field of ['passageId','editionId','artifactId','methodVersion','corpusHash'] as const)
    if (!nonblank(input?.[field])) errors.push('citation.' + field + ' required')
  if (nonblank(input?.passageId) && !input.passageId.startsWith('mw:passage:'))
    errors.push('citation.passageId must be canonical')
  if (!nonblank(input?.deepLinkBase)) errors.push('citation needs a deployment-provided deep-link base')
  if (!Array.isArray(input?.keys) || input.keys.length === 0) errors.push('citation needs at least one key')

  for (const entry of input?.keys ?? []) {
    for (const tokenError of validateKeyToken(entry.scheme, entry.key)) errors.push('key ' + entry.id + ': ' + tokenError)
    if (!nonblank(entry.id) || !entry.id.startsWith('mw:')) errors.push('citation key id must be canonical')
    if (!nonblank(entry.method) || !nonblank(entry.assessor)) errors.push('citation key ' + entry.id + ' needs method and assessor')
    // A citation names who made the claim; an untraceable label is not an assessor.
    if (nonblank(entry.assessor) && !entry.assessor.startsWith('mw:'))
      errors.push('citation key assessor must be a canonical mw: principal')
    if (entry.reviewStatus === 'reviewed' && !nonblank(entry.assessor)) errors.push('reviewed key ' + entry.id + ' needs an assessor')
    if (entry.relation !== undefined && !(KEY_RELATIONS as readonly string[]).includes(entry.relation))
      errors.push('citation key ' + entry.id + ' has an undeclared relation: ' + String(entry.relation))
    if (entry.direction !== undefined && !(DIRECTION_VALUES as readonly number[]).includes(entry.direction))
      errors.push('citation key ' + entry.id + ' has a direction outside -2..+2')
    if (entry.frame !== undefined) errors.push(...validateResearchFrame(entry.frame).map(error => 'citation key ' + entry.id + ': ' + error))
  }
  // A draft reading may not leave the tool as something a reader can cite.
  const messages = (input?.messages ?? []).filter(message => nonblank(message?.id))
  for (const message of messages) {
    if (message.reviewStatus !== 'reviewed') errors.push('citation message ' + message.id + ' is ' + message.reviewStatus + ', not reviewed')
    else if (!nonblank(message.reviewer)) errors.push('reviewed citation message ' + message.id + ' needs a reviewer')
    if (!nonblank(message.boundaryNote)) errors.push('citation message ' + message.id + ' needs a boundary note')
  }
  const publication = decidePublication({
    textRights: input?.textRights ?? 'unknown',
    annotation: input?.annotationLicense ?? {kind:'unlicensed'},
    quotesText: nonblank(input?.text)
  })
  if (!publication.showAnnotation) errors.push('citation annotation is not publishable: ' + publication.gaps.join(','))

  if (errors.length) return {citation: null, errors}

  // The text travels only when its own licence allows it; the reason stays visible.
  const includeText = publication.showText && nonblank(input.text)
  const textOmissionReason = includeText ? null
    : 'source text is ' + input.textRights + ' and is not redistributed by this citation'
  const sortedKeys = [...input.keys].sort((a, b) => a.id.localeCompare(b.id) || a.assessor.localeCompare(b.assessor))
  // One assessor citing the same key twice is one citation, not two votes.
  const seen = new Set<string>()
  const uniqueKeys = sortedKeys.filter(entry => {
    const mark = entry.id + ':' + entry.assessor
    if (seen.has(mark)) return false
    seen.add(mark)
    return true
  })
  // Facets travel only when they were recorded: an absent direction stays absent
  // rather than becoming a neutral 0 that a filter would then match.
  const citedKeys = uniqueKeys.map(entry => ({
    id: entry.id,
    key: entry.key,
    scheme: entry.scheme,
    method: entry.method,
    assessor: entry.assessor,
    reviewStatus: entry.reviewStatus,
    ...(entry.relation !== undefined ? {relation: entry.relation} : {}),
    ...(entry.direction !== undefined ? {direction: entry.direction} : {}),
    ...(entry.frame !== undefined ? {frame: {...entry.frame}} : {})
  }))

  return {citation: {
    schema: 'mw:citation:v0',
    passageId: input.passageId,
    editionId: input.editionId,
    artifactId: input.artifactId,
    contentId: nonblank(input.contentId) ? input.contentId : null,
    text: includeText ? input.text ?? null : null,
    textOmissionReason,
    keys: citedKeys,
    messages,
    rights: { text: input.textRights, annotation: input.annotationLicense, publicDomainInference: 'prohibited' },
    provenance: [...new Set(input.provenanceIds.filter(nonblank))].sort(),
    evidence: [...new Set(input.evidenceIds.filter(nonblank))].sort(),
    methodVersion: input.methodVersion,
    corpusHash: input.corpusHash,
    deepLink: input.deepLinkBase!.replace(/\/+$/, '') + '/passages/' + encodeURIComponent(input.passageId) +
      '?method=' + encodeURIComponent(input.methodVersion),
    // Names what the bundle does not claim, so an export cannot imply approval.
    frameNote: 'Cited keys, messages and directions are derived research under an explicit frame, not canonical text and not a verdict.'
  }, errors}
}
