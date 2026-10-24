import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyBranch } from './branch-retention-policy.mjs';

const branch = (name = 'research/witness') => ({
  repository: 'example/corpus',
  name,
  sha: '012345',
  protected: false,
});
const compare = (ahead_by) => ({ ahead_by });
const pull = (ref, number, draft = false) => ({
  number, draft,
  head: { ref, repo: { full_name: 'example/corpus' } },
});
test('canonical heads are always retained', () => {
  for (const name of ['main', 'dev']) {
    const r = classifyBranch(branch(name));
    assert.equal(r.disposition, 'RETAIN');
    assert.equal(r.automaticDelete, false);
  }
});
test('open PR heads remain retained even when contained in main', () => {
  const r = classifyBranch(branch(), { main: compare(0), dev: compare(0), openPulls: [pull('research/witness', 393)] });
  assert.equal(r.disposition, 'RETAIN');
  assert.deepEqual(r.prNumbers, [393]);
});
test('draft PR heads remain retained', () => {
  const r = classifyBranch(branch(), { main: compare(0), dev: compare(0), openPulls: [pull('research/witness', 394, true)] });
  assert.equal(r.disposition, 'RETAIN');
});
test('foreign fork PR does not impersonate branch head', () => {
  const foreign = pull('research/witness', 300);
  foreign.head.repo.full_name = 'other/repo';
  const r = classifyBranch(branch(), { main: compare(0), dev: compare(0), openPulls: [foreign] });
  assert.equal(r.disposition, 'REVIEW_ONLY');
});
test('protected branch is always retained', () => {
  const r = classifyBranch({ ...branch(), protected: true }, { main: compare(0), dev: compare(0) });
  assert.equal(r.disposition, 'RETAIN');
});
test('unique commits retain branch regardless of its name', () => {
  for (const name of ['fix/x', 'research/y', 'ecosystem/z', 'feature/a']) {
    const r = classifyBranch(branch(name), { main: compare(1), dev: compare(4) });
    assert.equal(r.disposition, 'RETAIN');
    assert.equal(r.automaticDelete, false);
  }
});
test('contained old branch only becomes a human review candidate', () => {
  for (const [a, b] of [[0, 6], [3, 0], [0, 0]]) {
    const r = classifyBranch(branch('fix/old'), { main: compare(a), dev: compare(b) });
    assert.equal(r.disposition, 'REVIEW_ONLY');
    assert.equal(r.automaticDelete, false);
  }
});
test('missing, malformed or failed comparison fails closed', () => {
  for (const options of [{}, { main: compare(0) }, { main: compare(-1), dev: compare(0) }, { main: {}, dev: compare(0) }]) {
    const r = classifyBranch(branch(), options);
    assert.equal(r.disposition, 'RETAIN');
    assert.equal(r.automaticDelete, false);
  }
});
test('invalid branch identity is rejected', () => {
  assert.throws(() => classifyBranch({ name: 'fix/unknown' }), /name\/SHA/);
});
