import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { parseTextResearchState, type ResearchState } from './research-steward.js'

const TODO_MARKER_RE = /<!--\s*mw-todo:([A-Za-z0-9._-]+)\s*-->/g
const MACHINE_METADATA_RE = /^ROCKSOUL-RESEARCH-([A-Z-]+):(.+)$/gm
const RESEARCH_TITLE_RE = /^\[(?:AUTO-)?RESEARCH\]/
const SOURCE_URL_RE = /https?:\/\//i
const RIGHTS_RE = /\b(?:licen[cs]e|licen[cs]ing|rights|public domain|redistribut\w*)\b/i
const LOCATOR_RE = /\b(?:page|pages|p\.|line|lines|folio|column|surface|segment|verse|chapter|commitment|panel|plate)\b/i
const EVIDENCE_GATES = [
  'Actual witness/edition/source content has been inspected',
  'Exact-text identity is preserved',
  'TEXT ownership boundary is preserved',
] as const
const REQUIRED_METADATA = ['CONTRACT', 'DOMAIN', 'OWNER', 'STATE'] as const

export interface AuditIssue {
  number: number
  title: string
  state: 'open' | 'closed'
  body: string | null
  pull_request?: unknown
}

export interface AuditPullRequest {
  number: number
  title: string
  state: 'open' | 'closed'
  draft: boolean
  body: string | null
  head: { sha: string; ref: string; repo?: { full_name?: string } | null }
  base: { ref: string; sha: string }
  mergeable_state?: string | null
}

export type FindingSeverity = 'error' | 'warning' | 'info'

export interface Finding {
  severity: FindingSeverity
  code: string
  subject: string
  detail: string
}

export interface AuditReport {
  schema: 'moonwitness.research-contract-audit.v1'
  repository: string
  todo_tasks: number
  research_issues: number
  findings: Finding[]
  counts: Record<FindingSeverity, number>
}

export interface AuditInput {
  repository: string
  todoContent: string
  issues: AuditIssue[]
  pullRequests: AuditPullRequest[]
}

function finding(severity: FindingSeverity, code: string, subject: string, detail: string): Finding {
  return { severity, code, subject, detail }
}

function isResearchIssue(issue: AuditIssue): boolean {
  return !issue.pull_request && RESEARCH_TITLE_RE.test(issue.title)
}

export function extractTodoMarkers(content: string): string[] {
  return [...content.matchAll(TODO_MARKER_RE)].map((match) => match[1])
}

export function parseMachineMetadata(body: string): { values: Map<string, string>; duplicates: string[] } {
  const values = new Map<string, string>()
  const duplicates: string[] = []
  for (const match of body.matchAll(MACHINE_METADATA_RE)) {
    const key = match[1]
    const value = match[2].trim().replace(/^`|`$/g, '')
    if (values.has(key)) duplicates.push(key)
    values.set(key, value)
  }
  return { values, duplicates }
}

function hasCheckbox(body: string, text: string): boolean {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`- \\[[xX]\\] ${escaped}`, 'i').test(body)
}

export function auditTodoMapping(todoContent: string, issues: AuditIssue[]): { findings: Finding[]; tasks: number } {
  const findings: Finding[] = []
  const todoMarkers = extractTodoMarkers(todoContent)
  const seenInTodo = new Map<string, number>()
  for (const id of todoMarkers) {
    seenInTodo.set(id, (seenInTodo.get(id) ?? 0) + 1)
  }
  for (const [id, count] of seenInTodo) {
    if (count > 1) {
      findings.push(finding('error', 'duplicate-todo-task-key', `TODO.md:${id}`, `TODO.md contains ${count} tasks with the same mw-todo key.`))
    }
  }

  const claimed = new Map<string, number[]>()
  for (const issue of issues) {
    if (issue.pull_request) continue
    for (const id of extractTodoMarkers(issue.body ?? '')) {
      claimed.set(id, [...(claimed.get(id) ?? []), issue.number])
    }
  }
  for (const [id, numbers] of claimed) {
    if (new Set(numbers).size > 1) {
      findings.push(finding('error', 'duplicate-todo-issue-claim', `mw-todo:${id}`, `Issues ${numbers.map((n) => `#${n}`).join(', ')} all claim this roadmap key; fail closed.`))
    }
    if (!seenInTodo.has(id)) {
      findings.push(finding('warning', 'orphan-todo-issue-claim', `mw-todo:${id}`, `Issue ${numbers.map((n) => `#${n}`).join(', ')} claims a key that is absent from TODO.md.`))
    }
  }
  for (const id of seenInTodo.keys()) {
    if (!claimed.has(id)) {
      findings.push(finding('info', 'unclaimed-todo-task-key', `TODO.md:${id}`, 'TODO task has no GitHub issue claim yet.'))
    }
  }

  return { findings, tasks: todoMarkers.length }
}

export function auditResearchIssue(issue: AuditIssue): Finding[] {
  if (!isResearchIssue(issue)) return []
  const body = issue.body ?? ''
  const subject = `#${issue.number}`
  const findings: Finding[] = []
  const { values, duplicates } = parseMachineMetadata(body)

  for (const key of duplicates) {
    findings.push(finding('error', 'duplicate-machine-metadata', subject, `ROCKSOUL-RESEARCH-${key} appears more than once.`))
  }
  for (const key of REQUIRED_METADATA) {
    if (!values.has(key)) {
      findings.push(finding('warning', 'missing-machine-metadata', subject, `ROCKSOUL-RESEARCH-${key} is missing.`))
    }
  }

  let state: ResearchState | null = null
  try {
    state = parseTextResearchState(body)
  } catch (error) {
    findings.push(finding('error', 'malformed-research-state', subject, error instanceof Error ? error.message : 'Unknown research state.'))
  }

  if (state) {
    const active = state !== 'canonicalized' && state !== 'merged' && state !== 'rejected'
    if (issue.state === 'closed' && active) {
      findings.push(finding('error', 'closed-issue-nonterminal', subject, `Issue is closed while its machine state is "${state}"; GitHub closed is not canonicalized.`))
    }
    if (issue.state === 'open' && !active) {
      findings.push(finding('error', 'terminal-state-still-open', subject, `Issue is open while its machine state is terminal ("${state}").`))
    }
    if (state === 'ready_for_observation') {
      for (const gate of EVIDENCE_GATES) {
        if (!hasCheckbox(body, gate)) {
          findings.push(finding('error', 'ready-without-evidence-gate', subject, `ready_for_observation lacks checked gate: "${gate}".`))
        }
      }
    }
    if ((state === 'source_inspected' || state === 'ready_for_observation') && !LOCATOR_RE.test(body)) {
      findings.push(finding('warning', 'missing-witness-locator', subject, `State "${state}" records no page/line/segment locator.`))
    }
  }

  const owner = values.get('OWNER')
  if (owner && owner !== 'rocksoul-rgbl') {
    findings.push(finding('error', 'foreign-research-ownership', subject, `Canonical owner "${owner}" is outside the TEXT owner repository rocksoul-rgbl.`))
  }
  if (!SOURCE_URL_RE.test(body)) {
    findings.push(finding('warning', 'missing-source-locator-url', subject, 'No source or witness URL is recorded. Fail closed on promotion.'))
  }
  if (!RIGHTS_RE.test(body)) {
    findings.push(finding('warning', 'missing-rights-statement', subject, 'No license, rights, public-domain, or redistribution statement is recorded.'))
  }
  if (caseInsensitiveCount(body, 'witness') > 0 && !LOCATOR_RE.test(body)) {
    findings.push(finding('warning', 'witness-without-locator', subject, 'Witness language is present without a bounded locator.'))
  }

  return findings
}

function caseInsensitiveCount(body: string, word: string): number {
  return [...body.matchAll(new RegExp(`\\b${word}\\b`, 'gi'))].length
}

export function auditPullRequest(pr: AuditPullRequest, repository: string): Finding[] {
  const subject = `PR #${pr.number}`
  const findings: Finding[] = []
  if (!pr.head.sha || pr.head.sha.length !== 40) {
    findings.push(finding('error', 'missing-pr-head-sha', subject, 'PR head does not expose a full 40-character SHA.'))
  }
  if (pr.state === 'open' && pr.head.repo?.full_name && pr.head.repo.full_name !== repository) {
    findings.push(finding('warning', 'foreign-pr-repository', subject, `PR head repository "${pr.head.repo.full_name}" is not "${repository}".`))
  }
  if (pr.state === 'open' && (pr.mergeable_state === 'behind' || pr.mergeable_state === 'dirty')) {
    findings.push(finding('warning', 'stale-pr-head', subject, `PR mergeable state is "${pr.mergeable_state}"; rebase/review before use as evidence.`))
  }
  if (pr.state === 'open' && pr.base.ref !== 'main' && pr.base.ref !== 'dev') {
    findings.push(finding('warning', 'noncanonical-pr-base', subject, `PR targets non-canonical base "${pr.base.ref}".`))
  }
  if (pr.state === 'open' && pr.draft && /#[0-9]+/.test(pr.body ?? '')) {
    findings.push(finding('info', 'draft-pr-reference', subject, 'Draft PR references an issue; draft status is not an observation state.'))
  }
  return findings
}

export function buildAuditReport(input: AuditInput): AuditReport {
  const todo = auditTodoMapping(input.todoContent, input.issues)
  const findings = [
    ...todo.findings,
    ...input.issues.flatMap((issue) => auditResearchIssue(issue)),
    ...input.pullRequests.flatMap((pr) => auditPullRequest(pr, input.repository)),
  ]
  const counts: Record<FindingSeverity, number> = { error: 0, warning: 0, info: 0 }
  for (const item of findings) counts[item.severity] += 1
  return {
    schema: 'moonwitness.research-contract-audit.v1',
    repository: input.repository,
    todo_tasks: todo.tasks,
    research_issues: input.issues.filter(isResearchIssue).length,
    findings,
    counts,
  }
}

function repositoryParts(): { owner: string; repo: string } {
  const full = process.env.GITHUB_REPOSITORY
  if (!full || !full.includes('/')) throw new Error('GITHUB_REPOSITORY must be set to owner/repo')
  const [owner, repo] = full.split('/', 2)
  return { owner, repo }
}

function token(): string {
  const value = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!value) throw new Error('GITHUB_TOKEN or GH_TOKEN is required')
  return value
}

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token()}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`)
  return (await response.json()) as T
}

async function listAllIssues(owner: string, repo: string): Promise<AuditIssue[]> {
  const issues: AuditIssue[] = []
  for (let page = 1; ; page += 1) {
    const batch = await api<AuditIssue[]>(`/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`)
    issues.push(...batch.filter((issue) => !issue.pull_request))
    if (batch.length < 100) break
  }
  return issues
}

function markdown(report: AuditReport): string {
  const lines = [
    `# Research contract audit — ${report.repository}`,
    '',
    `- TODO markers: ${report.todo_tasks}`,
    `- Research issues: ${report.research_issues}`,
    `- Errors: ${report.counts.error} · Warnings: ${report.counts.warning} · Info: ${report.counts.info}`,
    '',
  ]
  if (report.findings.length === 0) {
    lines.push('No findings. This run performed zero writes.')
    return lines.join('\n')
  }
  lines.push('| Severity | Code | Subject | Detail |', '|---|---|---|---|')
  for (const item of report.findings) {
    lines.push(`| ${item.severity} | \`${item.code}\` | ${item.subject} | ${item.detail.replace(/\|/g, '\\|')} |`)
  }
  lines.push('', 'This run performed zero writes.')
  return lines.join('\n')
}

async function main(): Promise<void> {
  if (!process.argv.includes('--check')) {
    throw new Error('research-contract-audit is read-only; run with --check')
  }
  const { owner, repo } = repositoryParts()
  const repository = `${owner}/${repo}`
  const [issues, pullRequests, todoContent] = await Promise.all([
    listAllIssues(owner, repo),
    api<AuditPullRequest[]>(`/repos/${owner}/${repo}/pulls?state=open&per_page=100`),
    readFile('TODO.md', 'utf8'),
  ])
  const report = buildAuditReport({ repository, todoContent, issues, pullRequests })
  console.log(markdown(report))
  if (report.counts.error > 0) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(2)
  })
}
