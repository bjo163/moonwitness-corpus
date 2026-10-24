import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const ci = read('.github/workflows/ci.yml');
const release = read('.github/workflows/release.yml');
const upstream = read('.github/workflows/upstream-sync.yml');
const branches = read('.github/workflows/branch-policy.yml');
const todoSync = read('.github/workflows/todo-issues-sync.yml');
const workflows = new Map(
  readdirSync(new URL('../.github/workflows/', import.meta.url))
    .filter((file) => file.endsWith('.yml'))
    .map((file) => [file, read('.github/workflows/' + file)])
);

function noMutatingGitOperations(content) {
  assert.doesNotMatch(content, /^\s*(?:git\s+(?:push|tag|reset|branch\s+-[dD])|gh\s+release\s+create)\b/m);
}
test('all safety workflows retain read-only contents permissions', () => {
  for (const workflow of [ci, release, upstream, branches, todoSync]) {
    assert.match(workflow, /permissions:\s*\n\s+contents: read/);
    assert.doesNotMatch(workflow, /contents:\s*write/);
  }
});
test('TODO sync never pushes to a protected branch', () => {
  assert.match(todoSync, /permissions:\s*\n\s+contents: read/);
  assert.doesNotMatch(todoSync, /contents:\s*write/);
  assert.doesNotMatch(todoSync, /git\s+(?:add|commit|push)\b/);
  assert.match(todoSync, /persist-credentials: false/);
  assert.match(todoSync, /TODO_SYNC_NO_WRITE: '1'/);
  assert.match(todoSync, /reconcile-issue-status\.ts --check/);
});
test('upstream audit is a read-only weekly default-branch schedule with gated acquisition', () => {
  assert.match(upstream, /schedule:[\s\S]*?cron:/);
  assert.match(upstream, /workflow_dispatch:/);
  assert.match(upstream, /persist-credentials: false/);
  assert.match(upstream, /pnpm install --frozen-lockfile/);
  assert.match(upstream, /if: inputs\.acquire == true/);
  assert.doesNotMatch(upstream, /^\s*git\s+commit\b/m);
  noMutatingGitOperations(upstream);
});
test('release candidate is non-publishing and explicitly read only', () => {
  assert.doesNotMatch(release, /\bcron:/);
  assert.match(release, /permissions:\s*\n\s+contents: read/);
  assert.match(release, /pnpm release:verify/);
  assert.match(release, /persist-credentials: false/);
  noMutatingGitOperations(release);
});
test('branch policy has no destructive mutation', () => {
  assert.match(branches, /permissions:\s*\n\s+contents: read/);
  assert.match(branches, /node --test scripts\/branch-retention-policy\.test\.mjs/);
  noMutatingGitOperations(branches);
});
test('CI is hosted, frozen-lockfile based and checks API', () => {
  assert.match(ci, /runs-on: ubuntu-latest/);
  assert.match(ci, /pnpm install --frozen-lockfile/);
  assert.match(ci, /pnpm check/);
  assert.match(ci, /Fastify API Engine/);
  noMutatingGitOperations(ci);
});
test('workflows avoid unmanaged runners and unlocked dependency installs', () => {
  for (const [file, content] of workflows) {
    assert.doesNotMatch(content, /runs-on:\s*self-hosted/, `${file} must run on a hosted runner`);
    assert.doesNotMatch(content, /--no-frozen-lockfile/, `${file} must install frozen dependencies`);
  }
});
test('workflow actions are pinned to immutable commit SHAs', () => {
  for (const [file, content] of workflows) {
    for (const line of content.split('\n').filter((candidate) => candidate.trim().startsWith('uses:'))) {
      assert.match(line, /@[0-9a-f]{40}(?:\s+#|$)/, `${file} must pin ${line.trim()}`);
    }
  }
});
test('manual materialization audits are hosted, pinned, locked and non-mutating', () => {
  for (const file of [
    'materialize-ancient-egypt-book-dead-budge.yml',
    'materialize-ancient-egypt-budge.yml',
    'materialize-ancient-egypt-renouf.yml',
    'materialize-zhuangzi.yml'
  ]) {
    const content = workflows.get(file);
    assert.ok(content, `${file} must exist`);
    assert.match(content, /runs-on: ubuntu-latest/);
    assert.match(content, /node-version: 24/);
    assert.match(content, /pnpm install --frozen-lockfile/);
    noMutatingGitOperations(content);
  }
});
test('fast-track audit uses the canonical Budge script and dataset path', () => {
  const fasttrack = workflows.get('fasttrack-egypt.yml');
  assert.match(fasttrack, /pnpm materialize:ancient-egypt-budge/);
  assert.match(fasttrack, /datasets\/ancient-egypt-book-dead-budge/);
  assert.doesNotMatch(fasttrack, /book-of-dead-budge/);
  noMutatingGitOperations(fasttrack);
});
test('web catalog verification never writes to a canonical branch', () => {
  const catalog = workflows.get('generate-web-catalog.yml');
  assert.match(catalog, /permissions:\s*\n\s+contents: read/);
  assert.match(catalog, /export-web-catalog\.mjs --check/);
  assert.doesNotMatch(catalog, /git (?:add|commit|push)\b/);
  assert.doesNotMatch(catalog, /contents: write/);
  noMutatingGitOperations(catalog);
});
test('browser database publication is manual and explicitly opt-in', () => {
  const browserDb = workflows.get('publish-browser-db.yml');
  assert.doesNotMatch(browserDb, /^\s{2}push:/m);
  assert.match(browserDb, /workflow_dispatch:/);
  assert.match(browserDb, /if: inputs\.publish == true/);
  assert.match(browserDb, /permissions:\s*\n\s+contents: read/);
  assert.match(browserDb, /if-no-files-found: error/);
});
