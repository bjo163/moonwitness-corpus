import { createHash } from 'node:crypto'

export const RENOUF_GUTENBERG_69566_SHA256 =
  '3ac04b55080286653c66b1f631a5d2ef66b16ea956b51c96d9767cf25f8a98a4'

export interface RenoufChapter {
  /** Printed chapter label in source casing, e.g. `XXIXB`, `CLIA`, `CXLI-CXLIII`. */
  label: string
  /** Lowercase canonical-ID-safe local identifier. */
  localId: string
  /** One-based position of the printed heading within the edition. */
  sequence: number
  /** Human-readable label, e.g. `Chapter XXIXB` or `Chapters CXLI-CXLIII`. */
  title: string
  text: string
}

export interface ParsedRenoufEdition {
  chapters: RenoufChapter[]
  /** Number of chapter labels structurally identified as plate/vignette captions. */
  captionCount: number
  sourceSha256: string
}

const EXPECTED_CHAPTER_COUNT = 100
const START_MARKER = /\*\*\* START OF THE PROJECT GUTENBERG EBOOK\b[^*]*\*\*\*/u
const END_MARKER = /\*\*\* END OF THE PROJECT GUTENBERG EBOOK\b[^*]*\*\*\*/u

const SINGLE_HEADING =
  /^([ \t]{20,})CHAPTER[ \t]+([IVXLCDM]+)([A-Z]*)(?:[ \t]+_bis_)?[.,]?[ \t]*(.*)$/u
const RANGE_HEADING =
  /^([ \t]{20,})CHAPTERS[ \t]+([IVXLCDM]+)([A-Z]*)[ \t]+(?:TO|to|AND|and)[ \t]+([IVXLCDM]+)([A-Z]*)[.,]?[ \t]*(.*)$/u
const HEADING_LIKE = /^[ \t]*CHAPTER[ \t]+[IVXLCDM]+[A-Z]*(?:[ \t]|$|[.,])/u
const RANGE_LIKE = /^[ \t]*CHAPTERS[ \t]+[IVXLCDM]+/u
const PAGE_RULE = /^[ \t]*-{8,}[ \t]*$/u
const PLATE_MARKER = /^PLATE\b/u
const ILLUSTRATION_OPEN = /^\[Illustration\b/u
const LOCAL_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function romanToNumber(value: string): number | undefined {
  const symbols: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let total = 0
  let previous = 0
  for (const character of [...value].reverse()) {
    const current = symbols[character]
    if (!current) return undefined
    total += current < previous ? -current : current
    previous = current
  }
  if (total < 1 || total > 399) return undefined
  return toRoman(total) === value ? total : undefined
}

function toRoman(value: number): string {
  let remaining = value
  let result = ''
  for (const [amount, numeral] of [
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I']
  ] as Array<[number, string]>) {
    while (remaining >= amount) {
      result += numeral
      remaining -= amount
    }
  }
  return result
}

/**
 * Verify the pinned Project Gutenberg payload before parsing. Any upstream
 * revision, truncation or identity change fails closed until reviewed.
 */
export function assertRenoufSourceIdentity(text: string): string {
  if (/<(?:html|body|form|script)[\s>]/iu.test(text)) throw new Error('HTML/challenge payload rejected')
  if (!START_MARKER.test(text) || !END_MARKER.test(text)) throw new Error('Unexpected Project Gutenberg payload bounds')
  if (!/\[eBook\s+#69566\]/iu.test(text)) throw new Error('Unexpected Gutenberg eBook identity')
  if (!/P\.?\s*LE\s*PAGE\s*RENOUF/iu.test(text) || !/E\.?\s*NAVILLE/iu.test(text)) {
    throw new Error('Unexpected Renouf/Naville translator identity')
  }
  if (!/SOCIETY\s+OF\s+BIBLICAL\s+ARCHAEOLOGY/iu.test(text) || !/1904/u.test(text)) {
    throw new Error('Unexpected 1904 edition identity')
  }
  const sourceSha256 = sha256(text)
  if (sourceSha256 !== RENOUF_GUTENBERG_69566_SHA256) {
    throw new Error(
      `Renouf source SHA-256 changed (${sourceSha256}, expected ${RENOUF_GUTENBERG_69566_SHA256}); review the source edition before materializing`
    )
  }
  return sourceSha256
}

function markStructuralRegions(lines: string[]): { plate: boolean[]; illustration: boolean[] } {
  const plate = new Array<boolean>(lines.length).fill(false)
  const illustration = new Array<boolean>(lines.length).fill(false)
  let inPlate = false
  let inIllustration = false
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim()
    if (PLATE_MARKER.test(trimmed)) inPlate = true
    if (ILLUSTRATION_OPEN.test(trimmed)) inIllustration = true
    if (inPlate) plate[index] = true
    if (inIllustration) illustration[index] = true
    if (inPlate && PAGE_RULE.test(trimmed)) inPlate = false
    if (inIllustration && trimmed.includes(']')) inIllustration = false
  }
  return { plate, illustration }
}

interface Candidate {
  index: number
  label: string
  localId: string
  title: string
}

export function parseRenoufBookOfTheDead(text: string): ParsedRenoufEdition {
  const lines = text.replace(/\r\n?/gu, '\n').split('\n')
  const startIndex = lines.findIndex((line) => START_MARKER.test(line))
  const endIndex = lines.findIndex((line) => END_MARKER.test(line))
  if (startIndex < 0 || endIndex <= startIndex) throw new Error('Unexpected Project Gutenberg payload bounds')

  const { plate, illustration } = markStructuralRegions(lines)
  const isCaption = (index: number): boolean => plate[index] || illustration[index]

  const candidates: Candidate[] = []
  let captionCount = 0
  for (let index = startIndex; index < endIndex; index += 1) {
    const line = lines[index]
    const single = line.match(SINGLE_HEADING)
    const range = line.match(RANGE_HEADING)
    if (!single && !range) {
      if (HEADING_LIKE.test(line) || RANGE_LIKE.test(line)) {
        if (isCaption(index)) {
          captionCount += 1
          continue
        }
        throw new Error(
          `Unclassified chapter-like heading at line ${index + 1}: ${JSON.stringify(line.trim())}; witness review required`
        )
      }
      continue
    }
    if (isCaption(index)) {
      captionCount += 1
      continue
    }
    if (single) {
      const base = single[2]
      const suffix = single[3]
      const first = romanToNumber(base)
      if (!first) throw new Error(`Invalid Roman chapter numeral at line ${index + 1}: ${base}`)
      const bis = /(?:^|[ \t])_bis_/u.test(line)
      const label = `${base}${suffix}${bis ? ' (bis)' : ''}`
      const localId = `${base}${suffix}${bis ? '-bis' : ''}`.toLowerCase()
      candidates.push({ index, label, localId, title: `Chapter ${label}` })
    } else if (range) {
      const first = romanToNumber(range[2])
      const last = romanToNumber(range[4])
      if (!first || !last || last <= first) {
        throw new Error(`Invalid Roman chapter range at line ${index + 1}: ${JSON.stringify(line.trim())}`)
      }
      const label = `${range[2]}${range[3]}-${range[4]}${range[5]}`
      candidates.push({
        index,
        label,
        localId: label.toLowerCase(),
        title: `Chapters ${label}`
      })
    }
  }

  candidates.sort((a, b) => a.index - b.index)
  const distinct: Candidate[] = []
  const seen = new Set<string>()
  for (const candidate of candidates) {
    if (!LOCAL_ID.test(candidate.localId)) throw new Error(`Unsafe chapter local identifier: ${candidate.localId}`)
    const previous = distinct[distinct.length - 1]
    if (previous && previous.localId === candidate.localId) {
      const between = lines.slice(previous.index + 1, candidate.index)
      if (!between.some((line) => PAGE_RULE.test(line.trim()))) {
        throw new Error(
          `Repeated Renouf chapter ${candidate.label} is not separated by a page boundary; witness review required`
        )
      }
      continue
    }
    if (seen.has(candidate.localId)) {
      throw new Error(
        `Ambiguous non-consecutive Renouf chapter ${candidate.label} at line ${candidate.index + 1}; witness review required`
      )
    }
    seen.add(candidate.localId)
    distinct.push(candidate)
  }
  if (distinct.length < EXPECTED_CHAPTER_COUNT) {
    throw new Error(`Expected at least ${EXPECTED_CHAPTER_COUNT} chapter headings, found ${distinct.length}`)
  }

  const chapters: RenoufChapter[] = []
  for (const [position, candidate] of distinct.entries()) {
    const end = distinct[position + 1]?.index ?? endIndex
    const body = lines
      .slice(candidate.index + 1, end)
      .join('\n')
      .replace(/\n{3,}/gu, '\n\n')
      .trim()
    if (!body) throw new Error(`Empty Renouf chapter body for ${candidate.label}`)
    chapters.push({
      label: candidate.label,
      localId: candidate.localId,
      sequence: position + 1,
      title: candidate.title,
      text: body
    })
  }

  return { chapters, captionCount, sourceSha256: sha256(text) }
}
