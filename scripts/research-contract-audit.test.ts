import assert from 'node:assert/strict'
import test from 'node:test'
import {
  auditPullRequest,
  auditResearchIssue,
  auditTodoMapping,
  buildAuditReport,
  type AuditIssue,
  type AuditPullRequest,
} from './research-contract-audit.js'

const researchBody = `## Research Card

| Field | Value |
|---|---|
| Canonical owner | \`rocksoul-rgbl\` |

- [x] Actual witness/edition/source content has been inspected
- [x] Exact-text identity is preserved
- [x] TEXT ownership boundary is preserved

https://example.org/witness.pdf page 2 line 4; license: public domain.

\`\`\`text
ROCKSOUL-RESEARCH-CONTRACT:v1
ROCKSOUL-RESEARCH-DOMAIN:TEXT
ROCKSOUL-RESEARCH-OWNER:rocksoul-rgbl
ROCKSOUL-RESEARCH-STATE:source_inspected
\`\`\`
`

function issue(overrides: Partial<AuditIssue> = {}): AuditIssue {
  return {
    number: 500,
    title: '[AUTO-RESEARCH] TEXT · example witness',
    state: 'open',
    body: researchBody,
    ...overrides,
  }
}

function codes(findings: Array<{ code: string }>): string[] {
  return findings.map((item) => item.code)
}

test('duplicate TODO task keys fail closed', () => {
  const { findings } = auditTodoMapping(
    '- [ ] duplicate <!-- mw-todo:P1-001 -->\n- [ ] duplicate <!-- mw-todo:P1-001 -->',
    [],
  )
  assert.ok(codes(findings).includes('duplicate-todo-task-key'))
})

test('two issues claiming one TODO key fail closed without synthetic issues', () => {
  const { findings } = auditTodoMapping(
    '- [ ] task <!-- mw-todo:P1-001 -->',
    [
      issue({ number: 1, title: 'one', body: '<!-- mw-todo:P1-001 -->', state: 'open' }),
      issue({ number: 2, title: 'two', body: '<!-- mw-todo:P1-001 -->', state: 'closed' }),
    ],
  )
  assert.ok(codes(findings).includes('duplicate-todo-issue-claim'))
  assert.ok(!codes(findings).includes('duplicate-todo-task-key'))
})

test('orphan issue claims are reported but never rewritten', () => {
  const { findings } = auditTodoMapping('', [
    issue({ number: 7, title: 'orphan', body: '<!-- mw-todo:P9-999 -->' }),
  ])
  assert.ok(codes(findings).includes('orphan-todo-issue-claim'))
})

test('malformed research state fails closed', () => {
  const findings = auditResearchIssue(issue({ body: researchBody.replace('source_inspected', 'invented_state') }))
  assert.ok(codes(findings).includes('malformed-research-state'))
})

test('closed GitHub issue is not treated as a terminal research state', () => {
  const findings = auditResearchIssue(issue({ state: 'closed' }))
  assert.ok(codes(findings).includes('closed-issue-nonterminal'))
})

test('terminal research state must not remain open', () => {
  const findings = auditResearchIssue(issue({ body: researchBody.replace('source_inspected', 'canonicalized') }))
  assert.ok(codes(findings).includes('terminal-state-still-open'))
  assert.ok(!codes(findings).includes('closed-issue-nonterminal'))
})

test('ready_for_observation requires every evidence gate checkbox', () => {
  const findings = auditResearchIssue(issue({
    body: researchBody
      .replace('source_inspected', 'ready_for_observation')
      .replace('- [x] Exact-text identity is preserved', '- [ ] Exact-text identity is preserved'),
  }))
  assert.ok(codes(findings).includes('ready-without-evidence-gate'))
})

test('missing source URL, rights statement, or locator stays non-promotable', () => {
  const findings = auditResearchIssue(issue({
    body: researchBody
      .replace('https://example.org/witness.pdf page 2 line 4; license: public domain.', 'No locator recorded.')
      .replace('https://example.org/witness.pdf page 2 line 4; license: public domain.', 'No locator recorded.'),
  }))
  const found = codes(findings)
  assert.ok(found.includes('missing-source-locator-url'))
  assert.ok(found.includes('missing-rights-statement'))
})

test('witness text without a bounded locator is reported', () => {
  const findings = auditResearchIssue(issue({
    body: researchBody.replace('page 2 line 4', 'somewhere'),
  }))
  assert.ok(codes(findings).includes('missing-witness-locator'))
})

test('foreign canonical ownership is rejected', () => {
  const findings = auditResearchIssue(issue({
    body: researchBody.replace('ROCKSOUL-RESEARCH-OWNER:rocksoul-rgbl', 'ROCKSOUL-RESEARCH-OWNER:other-repo'),
  }))
  assert.ok(codes(findings).includes('foreign-research-ownership'))
})

test('duplicate machine metadata keys fail closed', () => {
  const findings = auditResearchIssue(issue({
    body: `${researchBody}\nROCKSOUL-RESEARCH-STATE:triaged\n`,
  }))
  assert.ok(codes(findings).includes('duplicate-machine-metadata'))
})

test('stale PR head and draft references are reported without mutation', () => {
  const pr: AuditPullRequest = {
    number: 44,
    title: 'research staging',
    state: 'open',
    draft: true,
    body: 'Stages #380 locators.',
    head: { sha: 'a'.repeat(40), ref: 'research/example', repo: { full_name: 'bjo163/moonwitness-corpus' } },
    base: { ref: 'main', sha: 'b'.repeat(40) },
    mergeable_state: 'behind',
  }
  const found = codes(auditPullRequest(pr, 'bjo163/moonwitness-corpus'))
  assert.ok(found.includes('stale-pr-head'))
  assert.ok(found.includes('draft-pr-reference'))
})

test('PR without a full head SHA fails closed', () => {
  const pr: AuditPullRequest = {
    number: 45,
    title: 'short sha',
    state: 'open',
    draft: false,
    body: '',
    head: { sha: 'abc123', ref: 'x', repo: { full_name: 'bjo163/moonwitness-corpus' } },
    base: { ref: 'main', sha: 'b'.repeat(40) },
    mergeable_state: 'clean',
  }
  assert.ok(codes(auditPullRequest(pr, 'bjo163/moonwitness-corpus')).includes('missing-pr-head-sha'))
})

test('audit report is deterministic and contains no writes', () => {
  const input = {
    repository: 'bjo163/moonwitness-corpus',
    todoContent: '- [ ] task <!-- mw-todo:P1-001 -->',
    issues: [
      issue({ number: 1, title: 'roadmap', body: '<!-- mw-todo:P1-001 -->' }),
      issue({ number: 380 }),
    ],
    pullRequests: [],
  }
  const first = buildAuditReport(input)
  const second = buildAuditReport(input)
  assert.deepEqual(first, second)
  assert.equal(first.repository, 'bjo163/moonwitness-corpus')
  assert.equal(first.research_issues, 1)
  assert.equal(first.counts.error, 0)
})
