import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ADJUDICATION_TERMS, KEY_DEFINITIONS, KEY_FAMILIES, keyDefinitionFor, validateKeyRegistry,
  type KeyDefinition
} from './key-registry.js'
import { KEY_REGISTRY, P18_KEY_CANDIDATES } from './keys.js'

/** Plain, mutable copies so a negative case can damage one field at a time. */
const editable = () => JSON.parse(JSON.stringify(KEY_DEFINITIONS)) as KeyDefinition[]

test('every candidate token has one entry with en/id labels, definitions, examples and exclusions', () => {
  assert.deepEqual(validateKeyRegistry(), [])
  assert.equal(KEY_DEFINITIONS.length, P18_KEY_CANDIDATES.length)
  // Order is the registry order so a reader and the token list never disagree.
  assert.deepEqual(KEY_DEFINITIONS.map(entry => entry.key), [...P18_KEY_CANDIDATES])
  for (const entry of KEY_DEFINITIONS) {
    assert.notEqual(entry.label.en, entry.label.id)
    assert.notEqual(entry.definition.en, entry.definition.id)
    assert.ok(entry.examples.length >= 2 && entry.exclusions.length >= 2)
    assert.equal(entry.status, 'candidate')
    assert.equal(entry.scheme, 'semantic-core:v0')
  }
  // All five families are actually used; an empty family would mean a lost key group.
  assert.deepEqual([...new Set(KEY_DEFINITIONS.map(entry => entry.family))].sort(), [...KEY_FAMILIES].sort())
})

test('a dropped, duplicated, blank, copied or adjudicating entry is reported, not silently accepted', () => {
  const dropped = editable().slice(0, -1)
  const droppedErrors = validateKeyRegistry(dropped)
  assert.ok(droppedErrors.some(error => /must define 20 keys, found 19/.test(error)))
  const lastToken = P18_KEY_CANDIDATES[P18_KEY_CANDIDATES.length - 1]
  assert.ok(droppedErrors.some(error => error === 'missing definition for ' + lastToken))

  const duplicated = editable()
  duplicated[1] = {...duplicated[1], key: duplicated[0].key}
  assert.ok(validateKeyRegistry(duplicated).some(error => /duplicate entry/.test(error)))

  const blankLabel = editable()
  blankLabel[0] = {...blankLabel[0], label: {...blankLabel[0].label, id: '   '}}
  assert.ok(validateKeyRegistry(blankLabel).some(error => /id label is blank/.test(error)))

  const copiedLabel = editable()
  copiedLabel[0] = {...copiedLabel[0], label: {...copiedLabel[0].label, en: 'Mercy', id: 'Mercy'}}
  assert.ok(validateKeyRegistry(copiedLabel).some(error => /id label duplicates the en label/.test(error)))

  const verdict = editable()
  verdict[0] = {...verdict[0], definition: {...verdict[0].definition, en: 'the only true reading of a passage'}}
  assert.ok(validateKeyRegistry(verdict).some(error => /adjudication term "only true"/.test(error)))

  const badRelation = editable()
  badRelation[0] = {...badRelation[0], relations: ['expresses','outranks']}
  assert.ok(validateKeyRegistry(badRelation).some(error => /not in the controlled relation list/.test(error)))

  const singleExample = editable()
  singleExample[0] = {...singleExample[0], examples: ['one example only']}
  assert.ok(validateKeyRegistry(singleExample).some(error => /at least two examples/.test(error)))

  // A phrase cannot be both an illustration and an exclusion.
  const selfContradicting = editable()
  selfContradicting[0] = {...selfContradicting[0], exclusions: [...selfContradicting[0].exclusions, selfContradicting[0].examples[0]]}
  assert.ok(validateKeyRegistry(selfContradicting).some(error => /example is also listed as an exclusion/.test(error)))

  const ratified = editable()
  ratified[0] = {...ratified[0], status: 'ratified' as KeyDefinition['status']}
  assert.ok(validateKeyRegistry(ratified).some(error => /status must stay candidate/.test(error)))
})

test('the registry cannot be widened in place and stays candidate-only', () => {
  // Neutrality is enforced on the shipped text, not only on a mutated copy.
  for (const entry of KEY_DEFINITIONS) {
    assert.deepEqual(entry.definition.en.toLowerCase()
      .match(new RegExp(ADJUDICATION_TERMS.join('|'))) ?? [], [])
  }
  assert.ok(Object.isFrozen(KEY_DEFINITIONS))
  const mercy = keyDefinitionFor('mercy')
  assert.ok(mercy && Object.isFrozen(mercy) && Object.isFrozen(mercy.examples))
  assert.throws(() => { (mercy as unknown as {examples: string[]}).examples.push('smuggled') }, TypeError)
  // A token outside the registry is unknown, not an empty definition.
  assert.equal(keyDefinitionFor('prosperity'), null)
  assert.equal(keyDefinitionFor(''), null)
})

test('the definitions and the token list cannot drift apart', () => {
  assert.deepEqual([...KEY_REGISTRY['semantic-core:v0'].tokens], [...P18_KEY_CANDIDATES])
  assert.equal(KEY_REGISTRY['semantic-core:v0'].status, 'candidate')
  const described = new Set(KEY_DEFINITIONS.map(entry => entry.key))
  assert.equal(described.size, P18_KEY_CANDIDATES.length)
  for (const token of P18_KEY_CANDIDATES) assert.ok(described.has(token), 'no definition for ' + token)
})
