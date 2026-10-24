import assert from 'node:assert/strict'
import test from 'node:test'
import { describeReconcileChanges, reconcileTodoContent } from './reconcile-issue-status.js'

test('reconciles every managed issue state, not only the triggering issue', () => {
  const todo = [
    '- [ ] A <!-- mw-todo:P1-010 -->',
    '- [ ] B <!-- mw-todo:P1-011 -->',
    '- [x] C <!-- mw-todo:P1-012 -->'
  ].join('\n')
  const issues = [
    { number: 12, body: '<!-- mw-todo:P1-010 -->', state: 'closed' as const },
    { number: 13, body: '<!-- mw-todo:P1-011 -->', state: 'closed' as const },
    { number: 14, body: '<!-- mw-todo:P1-012 -->', state: 'open' as const }
  ]
  const result = reconcileTodoContent(todo, issues)
  assert.equal(result.changed, 3)
  assert.match(result.content, /\[x\] A/)
  assert.match(result.content, /\[x\] B/)
  assert.match(result.content, /\[ \] C/)
})

test('ignores unmanaged issues and fails duplicate markers', () => {
  const todo = '- [ ] A <!-- mw-todo:P1-010 -->'
  assert.equal(reconcileTodoContent(todo, [{ number: 1, body: null, state: 'closed' }]).changed, 0)
  assert.throws(() => reconcileTodoContent(todo, [
    { number: 1, body: '<!-- mw-todo:P1-010 -->', state: 'open' },
    { number: 2, body: '<!-- mw-todo:P1-010 -->', state: 'closed' }
  ]), /Multiple GitHub issues/)
})

test('reports only changed lines for check-only runs', () => {
  const todo = [
    '- [ ] A <!-- mw-todo:P1-010 -->',
    '- [x] B <!-- mw-todo:P1-011 -->'
  ].join('\n')
  const reconciled = reconcileTodoContent(todo, [
    { number: 12, body: '<!-- mw-todo:P1-010 -->', state: 'closed' }
  ])
  assert.deepEqual(describeReconcileChanges(todo, reconciled.content), [
    'line 1: - [ ] A <!-- mw-todo:P1-010 --> -> - [x] A <!-- mw-todo:P1-010 -->'
  ])
})
