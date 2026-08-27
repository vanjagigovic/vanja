# Update repository documentation

Read `.ai/documentation-context.md` first. Treat it as the starting point for repository-level documentation review.

Then inspect the actual repository when additional context is required. Prefer source code, package configuration, Docker configuration, and CI workflow files as the source of truth. Existing Markdown is not authoritative when it contradicts the implementation.

## Objective

Compare the current implementation against the existing README files and AI/development guidance documents, and update only the documentation when it is stale or incomplete.

## Required behavior

1. Read `.ai/documentation-context.md`.
2. Inspect the actual repository when additional evidence is needed.
3. Treat source code and configuration as the source of truth.
4. Compare implementation against existing Markdown documentation.
5. Detect and fix:
   - outdated information
   - missing functionality
   - incorrect commands
   - outdated paths
   - outdated technologies
   - outdated testing information
   - outdated CI/CD information
   - contradictions
   - duplicated documentation
6. Update only documentation files.
7. Never invent functionality.
8. Never modify production code.
9. Never modify tests for a documentation-only task.
10. Preserve the existing documentation style and structure whenever possible.
11. Make the smallest reasonable documentation changes.
12. Validate the final Markdown content and check for formatting problems.

## README files

README files should explain the project to developers and users, including:

- project purpose and major features
- architecture at a useful high level
- technology stack
- development setup
- scripts and commands
- testing information
- CI/CD context
- important implementation details
- API or configuration information as applicable

Keep README files concise and developer-friendly.

## AI guidelines

AI/development guideline files should explain the repository architecture, conventions, testing expectations, validation requirements, and AI-specific guardrails.

They should not duplicate the entire README content. They should focus on instructions for AI coding agents, practical constraints, and workflow expectations.

## Required output

After updating documentation, report the following sections:

### Changed files
List every changed documentation file.

### Changes
For each file, briefly explain what changed and why.

### Validation
Report:

- Markdown issues found
- broken/outdated links found
- outdated commands found
- inconsistencies found

### Potential remaining documentation issues
Call out any unresolved or ambiguous items.

### Final assessment
State whether the documentation is synchronized with the current repository.

If no changes are needed, explicitly write:

```text
Documentation is already up to date.
```

## Important restrictions

- Do not invent functionality.
- Do not document planned functionality as implemented.
- Do not modify application code.
- Do not modify tests for documentation-only work.
- Do not rewrite documentation unnecessarily.
- Do not add duplicate sections.
- Do not change the architecture or commands without verifying them against the repo.
- Keep the work narrow and maintainable.
