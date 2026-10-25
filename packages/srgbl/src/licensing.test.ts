import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ANNOTATION_LICENSE_KINDS, PUBLIC_DOMAIN_INFERENCE, decidePublication, validateAnnotationLicense
} from './licensing.js'

test('a cleared text does not clear the annotation written on it', () => {
  const decision = decidePublication({textRights:'cleared',annotation:{kind:'editorial-summary'},quotesText:false})
  assert.equal(decision.showText,true)
  assert.equal(decision.redistributeText,true)
  // Nobody has attested this annotation, so it stays withheld.
  assert.equal(decision.showAnnotation,false)
  assert.deepEqual(decision.gaps,['annotation:attestation_required'])
})

test('an attested annotation does not clear the text it describes', () => {
  const decision = decidePublication({textRights:'restricted',
    annotation:{kind:'original-creative',attestedBy:'mw:agent:curator'},quotesText:false})
  assert.equal(decision.showAnnotation,true)
  assert.equal(decision.showText,false)
  assert.equal(decision.redistributeText,false)
  // Showing the note is allowed; exporting it needs its own licence id.
  assert.equal(decision.exportAnnotation,false)
  assert.deepEqual(decision.gaps,['text:rights_not_cleared','annotation:export_needs_licence_id'])
  const licensed = decidePublication({textRights:'restricted',
    annotation:{kind:'original-creative',attestedBy:'mw:agent:curator',licenseId:'CC-BY-4.0'},quotesText:false})
  assert.equal(licensed.exportAnnotation,true)
  assert.deepEqual(licensed.gaps,['text:rights_not_cleared'])
})

test('quoting source text is where the two licences have to agree', () => {
  const quoting = decidePublication({textRights:'restricted',
    annotation:{kind:'quotation-dependent',attestedBy:'mw:agent:curator',licenseId:'CC-BY-4.0'},quotesText:true})
  assert.equal(quoting.showAnnotation,false)
  assert.equal(quoting.showText,false)
  assert.deepEqual(quoting.gaps,['text:rights_not_cleared','annotation:quotes_restricted_text'])
  const cleared = decidePublication({textRights:'cleared',
    annotation:{kind:'quotation-dependent',attestedBy:'mw:agent:curator',licenseId:'CC-BY-4.0'},quotesText:true})
  assert.deepEqual(cleared.gaps,[])
  assert.equal(cleared.showAnnotation,true)
  assert.equal(cleared.exportAnnotation,true)
  assert.equal(cleared.redistributeText,true)
})

test('unlicensed, unknown and self-contradictory records are withheld, never guessed', () => {
  assert.equal(PUBLIC_DOMAIN_INFERENCE,'prohibited')
  assert.equal(ANNOTATION_LICENSE_KINDS.includes('public-domain' as never),false)
  assert.equal(decidePublication({textRights:'unknown',
    annotation:{kind:'original-creative',attestedBy:'mw:agent:curator'},quotesText:false}).showText,false)
  const unlicensed = decidePublication({textRights:'cleared',
    annotation:{kind:'unlicensed',licenseId:'CC0',attestedBy:'mw:agent:curator'},quotesText:false})
  assert.equal(unlicensed.showAnnotation,false)
  assert.ok(unlicensed.gaps.includes('annotation:unlicensed_claims_licence_id'))
  assert.ok(unlicensed.gaps.includes('annotation:unlicensed_claims_attestation'))
  const invented = decidePublication({textRights:'cleared',annotation:{kind:'fair-use' as never},quotesText:false})
  assert.equal(invented.showAnnotation,false)
  assert.ok(invented.gaps.includes('annotation:unknown_kind'))
  // A note that claims to depend on a quotation while reproducing none is inconsistent.
  const mismatched = decidePublication({textRights:'cleared',
    annotation:{kind:'quotation-dependent',attestedBy:'mw:agent:curator'},quotesText:false})
  assert.equal(mismatched.showAnnotation,false)
  assert.ok(mismatched.gaps.includes('annotation:kind_claims_quotation_without_text'))
  // The licence validator agrees with the decision function about what is missing.
  assert.ok(validateAnnotationLicense({kind:'editorial-summary'}).includes('annotation licence attestation required'))
  assert.ok(validateAnnotationLicense({kind:'invented' as never}).some(error => /unknown annotation licence kind/.test(error)))
  assert.deepEqual(validateAnnotationLicense({kind:'original-creative',attestedBy:'mw:agent:curator'}),[])
})
