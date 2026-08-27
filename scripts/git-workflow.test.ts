import assert from 'node:assert/strict';
import test from 'node:test';
import { BRANCH_TYPES, isValidBranchName, isValidCommitMessage } from './git-workflow.js';

test('accepts every supported branch type', () => {
  for (const type of BRANCH_TYPES) {
    assert.equal(isValidBranchName(`${type}/descriptive-change`), true);
  }
});

test('accepts the protected default branch', () => {
  assert.equal(isValidBranchName('main'), true);
});

test('rejects invalid branch names', () => {
  for (const branchName of ['feature/new-calendar', 'Feat/AddEvents', 'fix_calendar_bug', 'my-branch', 'FEATURE/add-events', 'fix/UPPER-case']) {
    assert.equal(isValidBranchName(branchName), false, branchName);
  }
});

test('accepts valid Conventional Commits', () => {
  for (const message of [
    'feat(events): add recurring event support',
    'fix(auth): handle expired refresh tokens',
    'test(events): increase service test coverage',
    'docs(readme): update project documentation',
    'ci(github): add documentation validation',
    'refactor(calendar): simplify event date handling',
    'chore(deps): update dependencies',
    'perf(events): optimize event lookup',
    'security(auth): rotate session tokens',
  ]) {
    assert.equal(isValidCommitMessage(message), true, message);
  }
});

test('accepts breaking-change syntax', () => {
  assert.equal(isValidCommitMessage('feat(api)!: change event response structure'), true);
  assert.equal(isValidCommitMessage('feat!(api): change event response structure'), false);
});

test('rejects invalid Conventional Commits', () => {
  for (const message of [
    'feature(events): add recurring event support',
    'feat: omit scope',
    'feat(events) add missing colon',
    'feat(events):',
    'Feat(events): uppercase type',
    'fix(events):\nmissing subject',
  ]) {
    assert.equal(isValidCommitMessage(message), false, message);
  }
});