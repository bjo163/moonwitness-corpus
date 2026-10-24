import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const ci = read('.github/workflows/ci.yml');
const release = read('.github/workflows/release.yml');
const upstream = read('.github/workflows/upstream-sync.yml');
const branches = read('.github/workflows/branch-policy.yml');

function noMutatingGitOperations(content) {
  assert.doesNotMatch(content, /^\s*(?:git\s+(?:push|tag|reset|branch\s+-[dD])|gh\s+release\s+create)\b/m);
}
test('all safety workflows retain read-only contents permissions', () => {
  for (const workflow of [ci, release, upstream, branches]) {
    assert.match(workflow, /permissions:\s*\n\s+contents: read/);
    assert.doesNotMatch(workflow, /contents:\s*write/);
  }
});
test('upstream dev audit cannot commit, push or run a scheduled source import', () => {
  assert.match(upstream, /workflow_dispatch:/);
  assert.doesNotMatch(upstream, /\bcron:/);
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
