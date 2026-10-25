import { KEY_RELATIONS, P18_KEY_CANDIDATES, type KeyToken } from './keys.js'

/**
 * P18-001: the human-readable half of the v0 key vocabulary. `keys.ts` owns
 * which tokens exist; this file owns what each token means, what it must not be
 * stretched to cover, and how it is labelled for `en` and `id` readers.
 *
 * Every entry stays `candidate` until P18 review ratifies the vocabulary, so
 * nothing here may be presented as an approved or settled list.
 */
export const KEY_FAMILIES = [
  'mercy-compassion','justice-order','devotion-trust','character-wisdom','narrative-warning'
] as const
export type KeyFamily = (typeof KEY_FAMILIES)[number]

export type LocalizedText = { readonly en: string; readonly id: string }

export type KeyDefinition = {
  readonly key: KeyToken
  readonly scheme: 'semantic-core:v0'
  readonly family: KeyFamily
  readonly label: LocalizedText
  readonly definition: LocalizedText
  /** Illustrative paraphrases written for this registry; never scripture quotations. */
  readonly examples: readonly string[]
  /** Readings this key must not be stretched to cover. */
  readonly exclusions: readonly string[]
  readonly relations: readonly string[]
  readonly status: 'candidate'
}

/** Deep-freezes one entry so a caller cannot widen a candidate vocabulary in place. */
const define = (entry: KeyDefinition): KeyDefinition => Object.freeze({
  ...entry,
  label: Object.freeze({...entry.label}),
  definition: Object.freeze({...entry.definition}),
  examples: Object.freeze([...entry.examples]),
  exclusions: Object.freeze([...entry.exclusions]),
  relations: Object.freeze([...entry.relations])
})

export const KEY_DEFINITIONS: readonly KeyDefinition[] = Object.freeze([
  define({key:'mercy',scheme:'semantic-core:v0',family:'mercy-compassion',
    label:{en:'Mercy',id:'Belas kasih'},
    definition:{en:'compassion shown to a party that has no claim on it',id:'belas kasih yang diberikan tanpa klaim hak'},
    examples:['a scene in which relief is granted to someone who could not demand it','a statement that a penalty is set aside rather than owed'],
    exclusions:['a general impression that a passage feels warm','a reward paid for something already earned'],
    relations:['expresses','promises'],status:'candidate'}),
  define({key:'compassion',scheme:'semantic-core:v0',family:'mercy-compassion',
    label:{en:'Compassion',id:'Welas asih'},
    definition:{en:'a response to suffering that seeks its relief',id:'empati terhadap penderitaan'},
    examples:['a description of someone moved by another party’s distress','an instruction to notice suffering and ease it'],
    exclusions:['agreement with a doctrine about suffering','an assessment that the suffering was deserved'],
    relations:['expresses','commands'],status:'candidate'}),
  define({key:'forgiveness',scheme:'semantic-core:v0',family:'mercy-compassion',
    label:{en:'Forgiveness',id:'Pengampunan'},
    definition:{en:'the release of a claim against a party that caused harm',id:'pengampunan atas kesalahan'},
    examples:['a scene where an offence is no longer held against the offender','a request that a wrong not be counted'],
    exclusions:['a claim that no harm occurred','a pardon issued by a court rather than by a wronged party'],
    relations:['expresses','promises'],status:'candidate'}),
  define({key:'comfort',scheme:'semantic-core:v0',family:'mercy-compassion',
    label:{en:'Comfort',id:'Penghiburan'},
    definition:{en:'relief offered while distress is still ongoing',id:'penghiburan dalam kesulitan'},
    examples:['words addressed to someone in grief','an assurance that the present distress will not last'],
    exclusions:['a guarantee that no further harm is possible','a description of physical shelter'],
    relations:['expresses','comforts'],status:'candidate'}),
  define({key:'justice',scheme:'semantic-core:v0',family:'justice-order',
    label:{en:'Justice',id:'Keadilan'},
    definition:{en:'giving each party what is due and repairing an imbalance',id:'keadilan dan keseimbangan'},
    examples:['a judgement that returns what was taken','an instruction to weigh parties without favour'],
    exclusions:['a claim that an institution is beyond question','a ranking of traditions by severity'],
    relations:['expresses','commands'],status:'candidate'}),
  define({key:'truth',scheme:'semantic-core:v0',family:'justice-order',
    label:{en:'Truth',id:'Kebenaran'},
    definition:{en:'a statement’s correspondence with what it describes, including honest testimony',id:'kebenaran, kejujuran, dan kesaksian'},
    examples:['a demand that a witness speak accurately','a distinction between a report and its interpretation'],
    exclusions:['a claim that one tradition alone possesses truth','a verdict on whether a doctrine is correct'],
    relations:['expresses','commands'],status:'candidate'}),
  define({key:'accountability',scheme:'semantic-core:v0',family:'justice-order',
    label:{en:'Accountability',id:'Pertanggungjawaban'},
    definition:{en:'being answerable for an action and its consequences',id:'pertanggungjawaban atas tindakan'},
    examples:['a scene where an act is examined by others','a statement that a wrong must be answered for'],
    exclusions:['a presumption of guilt before any examination','a claim that a whole group is collectively guilty'],
    relations:['warns','describes'],status:'candidate'}),
  define({key:'restoration',scheme:'semantic-core:v0',family:'justice-order',
    label:{en:'Restoration',id:'Pemulihan'},
    definition:{en:'the return of a relationship or condition to a prior good state',id:'pemulihan hubungan atau keadaan'},
    examples:['a promise that a broken relation will be repaired','a described return from exile or loss'],
    exclusions:['an erasure of the harm that already happened','a claim that no repair is needed'],
    relations:['promises','expresses'],status:'candidate'}),
  define({key:'praise',scheme:'semantic-core:v0',family:'devotion-trust',
    label:{en:'Praise',id:'Pujian'},
    definition:{en:'speech that honours its addressee',id:'pujian dan penghormatan'},
    examples:['a formula that names its addressee as worthy','communal speech directed upward'],
    exclusions:['a ranking of one addressee above another','an evaluation of the addressee’s deeds'],
    relations:['expresses','praises'],status:'candidate'}),
  define({key:'gratitude',scheme:'semantic-core:v0',family:'devotion-trust',
    label:{en:'Gratitude',id:'Syukur'},
    definition:{en:'an acknowledgement of something received',id:'syukur atas pemberian'},
    examples:['thanks offered after a benefit','a call for others to give thanks'],
    exclusions:['a transaction in which a benefit is repaid','a claim that the giver owes the speaker'],
    relations:['expresses','commands'],status:'candidate'}),
  define({key:'trust',scheme:'semantic-core:v0',family:'devotion-trust',
    label:{en:'Trust',id:'Kepercayaan'},
    definition:{en:'reliance on another party’s reliability',id:'bersandar atau percaya'},
    examples:['a statement of reliance made under uncertainty','an instruction to stop hedging and rely'],
    exclusions:['a guarantee that no betrayal is possible','a claim that doubt is forbidden'],
    relations:['expresses','comforts'],status:'candidate'}),
  define({key:'hope',scheme:'semantic-core:v0',family:'devotion-trust',
    label:{en:'Hope',id:'Harapan'},
    definition:{en:'expectation directed at a better condition that is not yet present',id:'harapan akan keadaan yang lebih baik'},
    examples:['a statement that future relief is expected','a call to keep waiting without despair'],
    exclusions:['a prediction with a guaranteed outcome','a claim that the present condition is already healed'],
    relations:['promises','expresses'],status:'candidate'}),
  define({key:'patience',scheme:'semantic-core:v0',family:'character-wisdom',
    label:{en:'Patience',id:'Ketabahan'},
    definition:{en:'endurance through a process without abandoning it',id:'ketabahan dalam proses'},
    examples:['an instruction to keep going under delay','a description of someone waiting without retaliation'],
    exclusions:['a demand that suffering be accepted silently','a prohibition on complaint'],
    relations:['commands','expresses'],status:'candidate'}),
  define({key:'humility',scheme:'semantic-core:v0',family:'character-wisdom',
    label:{en:'Humility',id:'Kerendahan hati'},
    definition:{en:'a modest estimate of one’s own standing relative to others',id:'kerendahan hati'},
    examples:['a warning against self-exaltation','a scene where a high-status party lowers itself'],
    exclusions:['a demand that one group submit to another','an expectation of self-erasure'],
    relations:['commands','expresses'],status:'candidate'}),
  define({key:'generosity',scheme:'semantic-core:v0',family:'character-wisdom',
    label:{en:'Generosity',id:'Kemurahan'},
    definition:{en:'giving beyond what is strictly required',id:'kemurahan dalam berbagi'},
    examples:['an instruction to share without counting the return','a described gift that expects nothing back'],
    exclusions:['a claim that giving buys standing','a demand that a gift be repaid'],
    relations:['commands','expresses'],status:'candidate'}),
  define({key:'wisdom',scheme:'semantic-core:v0',family:'character-wisdom',
    label:{en:'Wisdom',id:'Kebijaksanaan'},
    definition:{en:'understanding that guides action',id:'pemahaman yang membimbing tindakan'},
    examples:['a saying that turns insight into conduct','a described choice made with foresight'],
    exclusions:['an assertion of expertise that ends inquiry','a claim to exclusive insight'],
    relations:['expresses','describes'],status:'candidate'}),
  define({key:'narrative',scheme:'semantic-core:v0',family:'narrative-warning',
    label:{en:'Narrative',id:'Kisah'},
    definition:{en:'the telling of events and actors as a sequence',id:'cerita atau peristiwa yang disaksikan'},
    examples:['a report of what happened, in order','a scene with named actors and a setting'],
    exclusions:['an argument that the events settle a doctrine','a claim that the story is historiography'],
    relations:['narrates','describes'],status:'candidate'}),
  define({key:'warning',scheme:'semantic-core:v0',family:'narrative-warning',
    label:{en:'Warning',id:'Peringatan'},
    definition:{en:'a bounded statement about a risk or consequence',id:'peringatan yang berskop'},
    examples:['a conditional notice of consequence','a call to change course before harm'],
    exclusions:['a threat that presumes authority over the reader','a prediction stated as certainty'],
    relations:['warns','describes'],status:'candidate'}),
  define({key:'promise',scheme:'semantic-core:v0',family:'narrative-warning',
    label:{en:'Promise',id:'Janji'},
    definition:{en:'a bounded statement committing the speaker to a future act',id:'janji yang berskop'},
    examples:['a commitment made by a named party','a conditional assurance tied to conduct'],
    exclusions:['a general optimism about the future','a guarantee that removes every condition'],
    relations:['promises','expresses'],status:'candidate'}),
  define({key:'covenant',scheme:'semantic-core:v0',family:'narrative-warning',
    label:{en:'Covenant',id:'Perjanjian'},
    definition:{en:'a bounded bond that carries mutual obligations',id:'perjanjian atau ikatan yang berskop'},
    examples:['an agreement with stated obligations on both sides','a described renewal of a bond'],
    exclusions:['a contract enforceable by a court','a claim that the bond cannot be broken'],
    relations:['covenants','expresses'],status:'candidate'})
])

const byKey = new Map<string, KeyDefinition>(KEY_DEFINITIONS.map(entry => [entry.key, entry]))

/** `null` means the token has no definition in v0; it is not an empty definition. */
export function keyDefinitionFor(key: string): KeyDefinition | null {
  return byKey.get(key) ?? null
}

const blank = (value: unknown) => typeof value !== 'string' || value.trim().length === 0

/**
 * Ranking and adjudication language is what turns a neutral key into a verdict,
 * so a definition carrying it is rejected instead of quietly softened.
 */
export const ADJUDICATION_TERMS = [
  'superior','inferior','heretic','blasphem','proof that','undeniable','infallible','only true','true religion','false religion'
] as const

export function validateKeyRegistry(registry: readonly KeyDefinition[] = KEY_DEFINITIONS): string[] {
  const errors: string[] = []
  if (registry.length !== P18_KEY_CANDIDATES.length)
    errors.push('registry must define ' + P18_KEY_CANDIDATES.length + ' keys, found ' + registry.length)
  const seen = new Set<string>()
  registry.forEach((entry, index) => {
    const where = 'key[' + index + '] ' + String(entry.key)
    if (!P18_KEY_CANDIDATES.includes(entry.key)) errors.push(where + ': not a semantic-core:v0 token')
    if (seen.has(entry.key)) errors.push(where + ': duplicate entry')
    seen.add(entry.key)
    if (entry.scheme !== 'semantic-core:v0') errors.push(where + ': scheme must be semantic-core:v0')
    if (!KEY_FAMILIES.includes(entry.family)) errors.push(where + ': unknown family ' + String(entry.family))
    if (entry.status !== 'candidate') errors.push(where + ': status must stay candidate until ratification')
    for (const language of ['en','id'] as const) {
      if (blank(entry.label?.[language])) errors.push(where + ': ' + language + ' label is blank')
      if (blank(entry.definition?.[language])) errors.push(where + ': ' + language + ' definition is blank')
      const text = String(entry.definition?.[language] ?? '').toLowerCase()
      for (const term of ADJUDICATION_TERMS)
        if (text.includes(term)) errors.push(where + ': ' + language + ' definition carries adjudication term "' + term + '"')
    }
    if (entry.label?.en && entry.label.id && entry.label.en === entry.label.id)
      errors.push(where + ': id label duplicates the en label')
    if (entry.definition?.en && entry.definition.id && entry.definition.en === entry.definition.id)
      errors.push(where + ': id definition duplicates the en definition')
    if (!Array.isArray(entry.examples) || entry.examples.length < 2) errors.push(where + ': at least two examples required')
    if (!Array.isArray(entry.exclusions) || entry.exclusions.length < 2) errors.push(where + ': at least two exclusions required')
    const examples = new Set<string>()
    for (const example of entry.examples ?? []) {
      if (blank(example)) errors.push(where + ': example is blank')
      if (examples.has(example)) errors.push(where + ': duplicate example "' + example + '"')
      examples.add(example)
      if ((entry.exclusions ?? []).includes(example)) errors.push(where + ': example is also listed as an exclusion')
    }
    for (const exclusion of entry.exclusions ?? []) if (blank(exclusion)) errors.push(where + ': exclusion is blank')
    if (!Array.isArray(entry.relations) || entry.relations.length === 0) errors.push(where + ': at least one relation required')
    for (const relation of entry.relations ?? [])
      if (!(KEY_RELATIONS as readonly string[]).includes(relation)) errors.push(where + ': relation ' + String(relation) + ' is not in the controlled relation list')
  })
  for (const token of P18_KEY_CANDIDATES) if (!seen.has(token)) errors.push('missing definition for ' + token)
  return errors
}
