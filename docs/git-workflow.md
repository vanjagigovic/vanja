# Git Workflow

## Branch names

Branches use `<type>/<short-description>`. The type must be one of `feat`, `fix`, `refactor`, `test`, `docs`, `ci`, `chore`, `perf`, or `security`. Descriptions use lowercase words separated by hyphens, for example `feat/add-recurring-events`. The protected default branch `main` is also allowed.

## Commit messages

Commit messages use Conventional Commits: `<type>(<scope>): <description>`. The same types are supported, scopes use lowercase hyphenated words, and breaking changes use `!`, such as `feat(api)!: change event response structure`.

## Validation

Husky validates the current branch before commits and pushes, and validates commit messages with the `commit-msg` hook. The same checks are available manually with `npm run git:validate-branch`, `npm run git:validate-commit -- <message>`, and `npm run git:test`. CI validates commit messages in pull requests with `npm run git:validate-commits`.