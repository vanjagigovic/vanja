import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

export const BRANCH_TYPES = ['feat', 'fix', 'refactor', 'test', 'docs', 'ci', 'chore', 'perf', 'security'] as const;
export const COMMIT_TYPES = BRANCH_TYPES;

const branchPattern = new RegExp(`^(?:${BRANCH_TYPES.join('|')})/[a-z0-9]+(?:-[a-z0-9]+)*$`);
const commitPattern = new RegExp(`^(?:${COMMIT_TYPES.join('|')})\\([a-z0-9]+(?:-[a-z0-9]+)*\\)(!)?: [^\\s].*$`);

export function isValidBranchName(branchName: string): boolean {
  return branchName === 'main' || branchPattern.test(branchName);
}

export function isValidCommitMessage(message: string): boolean {
  const subject = message.split(/\r?\n/, 1)[0].trimEnd();
  return commitPattern.test(subject);
}

function fail(message: string): never {
  console.error(`Git workflow validation failed: ${message}`);
  process.exit(1);
}

function getCurrentBranch(): string {
  return execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
}

function validateBranch(branchName = getCurrentBranch()): void {
  if (!isValidBranchName(branchName)) {
    fail(`branch '${branchName}' must use <type>/<lowercase-hyphenated-description>. Allowed types: ${BRANCH_TYPES.join(', ')}.`);
  }
  console.log(`Branch name is valid: ${branchName}`);
}

function readCommitMessage(value: string | undefined): string {
  if (!value) {
    return '';
  }

  try {
    return fs.readFileSync(value, 'utf8');
  } catch {
    return value;
  }
}

function validateCommit(messageOrPath: string | undefined): void {
  const message = readCommitMessage(messageOrPath);
  if (!isValidCommitMessage(message)) {
     fail('commit messages must use <type>(<scope>): <description>; supported types: feat, fix, refactor, test, docs, ci, chore, perf, security. Breaking changes use <type>(<scope>)!: <description>.');
  }
  console.log('Commit message is valid.');
}

function validateCommits(revisionRange: string): void {
  const messages = execFileSync('git', ['log', '--no-merges', '--format=%s', revisionRange], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);

  for (const message of messages) {
    if (!isValidCommitMessage(message)) {
      fail(`invalid commit message in ${revisionRange}: ${message}`);
    }
  }
  console.log(`Validated ${messages.length} commit message(s).`);
}

function main(): void {
  const [command, value] = process.argv.slice(2);

  if (command === 'branch') {
    validateBranch(value || undefined);
  } else if (command === 'commit') {
    validateCommit(value);
  } else if (command === 'commits' && value) {
    validateCommits(value);
  } else {
    fail('usage: git-workflow.ts branch [name] | commit <message-or-file> | commits <revision-range>');
  }
}

if (process.argv[1]?.endsWith('git-workflow.ts')) {
  main();
}