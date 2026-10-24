import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertRenoufSourceIdentity,
  parseRenoufBookOfTheDead,
  RENOUF_GUTENBERG_69566_SHA256
} from './gutenberg-renouf.js'

const START = '*** START OF THE PROJECT GUTENBERG EBOOK 69566 ***'
const END = '*** END OF THE PROJECT GUTENBERG EBOOK 69566 ***'

function roman(value: number): string {
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

function heading(label: string): string {
  return `${' '.repeat(29)}CHAPTER ${label}.`
}

function rangeHeading(label: string): string {
  return `${' '.repeat(24)}CHAPTERS ${label}.`
}

function source(lines: string[]): string {
  return ['The Project Gutenberg eBook of The Egyptian Book of the Dead', START, ...lines, END, ''].join('\n')
}

function simpleChapters(count = 100, overrides: Record<number, string> = {}): string[] {
  const lines: string[] = []
  for (let number = 1; number <= count; number += 1) {
    const label = overrides[number] ?? roman(number)
    lines.push('', heading(label), `Text of chapter ${number}.`, '')
  }
  return lines
}

describe('parseRenoufBookOfTheDead', () => {
  it('keeps authentic textual headings and NOTE sections in the same chapter', () => {
    const lines = simpleChapters(100)
    lines.splice(4 * 4 + 2, 0, 'NOTE.', 'Editorial note that belongs to this chapter.')
    const parsed = parseRenoufBookOfTheDead(source(lines))
    assert.equal(parsed.chapters.length, 100)
    assert.equal(parsed.chapters[4].label, 'V')
    assert.match(parsed.chapters[4].text, /NOTE\./)
    assert.match(parsed.chapters[4].text, /Editorial note that belongs to this chapter\./)
  })

  it('excludes illustration and plate captions without losing surrounding text', () => {
    const lines = simpleChapters(100)
    lines.splice(
      10,
      0,
      '[Illustration:',
      '',
      '  CHAPTER I.',
      '  Papyrus in the British Museum.',
      ']',
      '',
      'PLATE IV.',
      '                           BOOK OF THE DEAD.',
      '                              CHAPTER V.',
      '[Illustration]',
      '--------------',
      ''
    )
    const parsed = parseRenoufBookOfTheDead(source(lines))
    assert.equal(parsed.chapters.length, 100)
    assert.ok(parsed.captionCount >= 2)
    assert.equal(parsed.chapters.filter(chapter => chapter.label === 'I').length, 1)
    assert.equal(parsed.chapters.filter(chapter => chapter.label === 'V').length, 1)
  })

  it('gives family, bis and combined headings distinct canonical local IDs', () => {
    const overrides: Record<number, string> = {
      29: 'XXIXB',
      30: 'XXXA',
      31: 'XXXB',
      63: 'LXIIIA',
      64: 'LXIIIB',
      81: 'LXXXIA'
    }
    const labels = [
      ...Array.from({ length: 47 }, (_, index) => overrides[index + 1] ?? roman(index + 1)),
      'XLVIII and XLIX',
      ...Array.from({ length: 61 }, (_, index) => overrides[index + 50] ?? roman(index + 50)),
      'CLIA _bis_'
    ]
    const lines = labels.map((label, index) =>
      label.includes(' and ')
        ? `${rangeHeading(label)}\n\nRange text ${index}.`
        : `${heading(label)}\n\nText block ${index}.`
    )
    const parsed = parseRenoufBookOfTheDead(source(lines))
    const localIds = parsed.chapters.map(chapter => chapter.localId)
    assert.equal(new Set(localIds).size, localIds.length)
    assert.ok(localIds.includes('xlviii-xlix'))
    assert.ok(localIds.includes('lxxxia'))
    assert.ok(localIds.includes('clia-bis'))
    assert.equal(parsed.chapters.find(chapter => chapter.localId === 'clia-bis')?.sequence, parsed.chapters.length)
  })

  it('merges a page-continued repeated heading into the preceding chapter', () => {
    const lines = simpleChapters(101)
    lines.splice(49 * 4 + 2, 0, '----------------------------------------', heading('L'), 'Continued notes section.', '')
    const parsed = parseRenoufBookOfTheDead(source(lines))
    assert.equal(parsed.chapters.filter(chapter => chapter.localId === 'l').length, 1)
    assert.match(parsed.chapters.find(chapter => chapter.localId === 'l')?.text ?? '', /Continued notes section\./)
  })

  it('fails closed on repeated headings without a page boundary', () => {
    const lines = simpleChapters(100)
    lines.splice(49 * 4 + 2, 0, heading('L'), 'Duplicate section without a page rule.', '')
    assert.throws(() => parseRenoufBookOfTheDead(source(lines)), /not separated by a page boundary/u)
  })

  it('fails closed on ambiguous non-consecutive chapter labels', () => {
    const lines = simpleChapters(100)
    lines.push('', heading('I'), 'Second occurrence after other chapters.', '')
    assert.throws(() => parseRenoufBookOfTheDead(source(lines)), /Ambiguous non-consecutive/u)
  })

  it('fails closed on a chapter-like heading outside a known caption region', () => {
    const lines = simpleChapters(100)
    lines.splice(10, 0, '  CHAPTER I.', '  Papyrus in the British Museum.', '')
    assert.throws(() => parseRenoufBookOfTheDead(source(lines)), /Unclassified chapter-like heading/u)
  })

  it('fails closed when the Gutenberg bounds are absent', () => {
    assert.throws(
      () => parseRenoufBookOfTheDead(simpleChapters(100).join('\n')),
      /payload bounds/u
    )
  })
})

describe('assertRenoufSourceIdentity', () => {
  const identityText = [
    '[eBook #69566]',
    'P. LE PAGE RENOUF',
    'E. NAVILLE',
    'SOCIETY OF BIBLICAL ARCHAEOLOGY',
    '1904',
    START,
    'body',
    END
  ].join('\n')

  it('fails closed when the pinned source bytes change', () => {
    assert.throws(() => assertRenoufSourceIdentity(identityText), /SHA-256 changed/u)
  })

  it('rejects HTML/challenge payloads', () => {
    assert.throws(
      () => assertRenoufSourceIdentity(`${identityText}\n<script>challenge</script>`),
      /HTML\/challenge payload/u
    )
  })
})
