import assert from 'node:assert/strict'
import test from 'node:test'
import {
  REVIEW_TRANSITIONS, replayReviewHistory, validateClaimedReviewStatus,
  validateReviewEvent, validateReviewTransition, type ReviewEvent
} from './review-workflow.js'

function event(overrides:Partial<ReviewEvent>={}):ReviewEvent {
  return {id:'rev:1',subjectId:'mw:assessment:wf:1',from:'draft',to:'reviewed',at:'2026-10-01T00:00:00Z',
    actor:'mw:agent:reviewer',reason:'Evidence reviewed against the licensed witness.',evidenceIds:['mw:evidence:wf'],
    previousEventId:null,...overrides}
}

test('the lifecycle is a closed machine and deprecated is terminal', () => {
  assert.deepEqual(validateReviewTransition('draft','reviewed'),[])
  assert.deepEqual(validateReviewTransition('reviewed','disputed'),[])
  assert.deepEqual(validateReviewTransition('disputed','reviewed'),[])
  // No self-transition: a status change is an event, not a re-statement.
  assert.ok(validateReviewTransition('draft','draft').some(error => /illegal review transition draft -> draft/.test(error)))
  assert.ok(validateReviewTransition('reviewed','draft').some(error => /illegal review transition reviewed -> draft/.test(error)))
  assert.ok(validateReviewTransition('deprecated','reviewed').some(error => /allowed: none \(terminal\)/.test(error)))
  assert.deepEqual(Object.keys(REVIEW_TRANSITIONS).map(status => [status, REVIEW_TRANSITIONS[status as never]]),
    [['draft',['reviewed','disputed','deprecated']],['reviewed',['disputed','deprecated']],['disputed',['reviewed','deprecated']],['deprecated',[]]])
  assert.ok(validateReviewTransition('approved' as never,'reviewed').some(error => /invalid review status/.test(error)))
})

test('promotion and dispute must be attributable, and no automation may sign them', () => {
  assert.deepEqual(validateReviewEvent(event()),[])
  assert.ok(validateReviewEvent(event({actor:''})).some(error => /review event actor required/.test(error)))
  assert.ok(validateReviewEvent(event({actor:'reviewer-name'})).some(error => /canonical mw: principal/.test(error)))
  assert.ok(validateReviewEvent(event({actor:'mw:agent:system'})).some(error => /may not be an automated principal/.test(error)))
  assert.ok(validateReviewEvent(event({reason:'   '})).some(error => /review event reason required/.test(error)))
  assert.ok(validateReviewEvent(event({evidenceIds:[]})).some(error => /review event evidence required/.test(error)))
  assert.ok(validateReviewEvent(event({at:'not-a-date'})).some(error => /not an ISO-8601 instant/.test(error)))
  // Reopening a dispute without a reason is not a review.
  assert.ok(validateReviewEvent(event({from:'reviewed',to:'disputed',reason:'',id:'rev:2',previousEventId:'rev:1'}))
    .some(error => /a dispute needs a stated reason/.test(error)))
})

test('a chain replays to one status, and a broken link stops the replay', () => {
  const chain = [
    event(),
    event({id:'rev:2',from:'reviewed',to:'disputed',reason:'Second reviewer disagrees on scope.',at:'2026-10-02T00:00:00Z',previousEventId:'rev:1'}),
    event({id:'rev:3',from:'disputed',to:'reviewed',reason:'Scope note added.',at:'2026-10-03T00:00:00Z',previousEventId:'rev:2'}),
    event({id:'rev:4',from:'reviewed',to:'deprecated',reason:'Source withdrawn after rights review.',at:'2026-10-04T00:00:00Z',previousEventId:'rev:3'})
  ]
  const history = replayReviewHistory(chain)
  assert.deepEqual(history.errors,[])
  assert.equal(history.status,'deprecated')
  assert.equal(history.subjectId,'mw:assessment:wf:1')
  assert.equal(history.audit.length,4)
  assert.deepEqual(history.audit.map(item => item.id),['rev:1','rev:2','rev:3','rev:4'])
  // The audit copy is not the caller's object.
  history.audit[0].evidenceIds.push('mw:evidence:injected')
  assert.deepEqual(chain[0].evidenceIds,['mw:evidence:wf'])

  const gapped = replayReviewHistory([chain[0],chain[2],chain[3]])
  assert.ok(gapped.errors.some(error => /broken audit chain at event 2/.test(error)))
  // The accepted prefix survives; everything after the gap is refused.
  assert.equal(gapped.status,'reviewed')
  assert.equal(gapped.audit.length,1)
  const backwards = replayReviewHistory([chain[0],{...chain[1],at:'2026-09-30T00:00:00Z'}])
  assert.ok(backwards.errors.some(error => /ordered by time/.test(error)))
  const reused = replayReviewHistory([chain[0],{...chain[1],id:'rev:1'}])
  assert.ok(reused.errors.some(error => /duplicate review event id rev:1/.test(error)))
})

test('a claimed status must be backed by history, never by the field alone', () => {
  assert.deepEqual(validateClaimedReviewStatus('draft',[]),[])
  assert.deepEqual(validateClaimedReviewStatus('reviewed',[event()]),[])
  assert.deepEqual(validateClaimedReviewStatus('deprecated',[event(),
    event({id:'rev:2',from:'reviewed',to:'deprecated',reason:'Withdrawn.',previousEventId:'rev:1',at:'2026-10-02T00:00:00Z'})]),[])
  // An empty history stops at draft: asserting a review is not the same as recording one.
  assert.deepEqual(validateClaimedReviewStatus('reviewed',[]),
    ['claimed review status reviewed does not match audited status draft'])
  assert.ok(validateClaimedReviewStatus('reviewed',[event({to:'disputed',reason:'Disagreement.'})])
    .some(error => /does not match audited status disputed/.test(error)))
  // A corrupt chain is reported, not papered over with the claimed value.
  assert.ok(validateClaimedReviewStatus('reviewed',[event({previousEventId:'rev:99'})]).some(error => /broken audit chain/.test(error)))
})
