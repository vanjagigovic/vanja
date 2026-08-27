# Calendar App AI Engineering Guidelines

This repository is a monorepo for a calendar application split into a React frontend and a NestJS backend. AI changes should preserve the current architecture, especially the existing auth flow, domain boundaries, validation strategy, and data model.

## Project purpose and high-level architecture

- The app is a calendar and scheduling system with day, week, and month views.
- The frontend renders the user interface and handles local UI state, calendar navigation, and reminder scheduling.
- The backend owns authentication, authorization, event validation, recurrence logic, overlap prevention, and PostgreSQL storage.
- The canonical event data is stored in UTC at the database layer, while time-zone-aware behavior is handled in the service logic and UI.
- Authentication currently uses email/password registration and login, JWT access tokens, and a refresh-token cookie set on the `/auth` path.

## Technology stack

- Frontend: React 19, TypeScript, Vite, Material UI, React Router, React Query, i18next, Luxon, Axios-based API wrapper.
- Backend: NestJS 11, TypeScript, PostgreSQL, Drizzle ORM, Swagger, Passport + JWT, class-validator/class-transformer, Zod env validation, Helmet, cookie-parser, Luxon.
- Local development: Docker Compose for PostgreSQL plus the repo-level `npm run dev` to start frontend + backend together.

## Repository structure

- `frontend/` contains the SPA and all UI code.
- `backend/` contains the NestJS API, config, schema, migrations, and tests.
- `docker-compose.yml` provides the PostgreSQL local environment.
- `drizzle.config.ts` at the project root and `backend/drizzle.config.ts` define Drizzle behavior for the backend.
- `README.md` provides project overview, but the actual conventions are derived from code and scripts.

## Frontend/backend responsibilities

- Frontend responsibilities:
  - Render pages and calendar components.
  - Use `AuthProvider` and `ProtectedRoute` to protect routes.
  - Use `@tanstack/react-query` for calendar event data loading and invalidation.
  - Transform backend responses into UI-facing data with helper mapping functions.
  - Handle user interaction, nav state, loading/error states, and reminder notifications.

- Backend responsibilities:
  - Validate incoming request bodies and query params.
  - Enforce auth and authorization via guards and current-user decorators.
  - Perform overlap checks and recurrence logic in `EventsService`.
  - Read/write PostgreSQL via Drizzle.
  - Return user-safe DTO shapes and clear exceptions.

## Important architectural patterns already used

- Backend modules are explicit (`AuthModule`, `EventsModule`) and imported from `AppModule`.
- Controllers are thin and delegate to services; services contain business logic and database access.
- DTOs drive validation and Swagger metadata.
- `ValidationPipe` is configured globally with `whitelist` and `forbidNonWhitelisted` enabled.
- Frontend API calls are centralized in `src/api/*.ts` with shared request/refresh logic in `api-client.ts`.
- Frontend state is mostly local component state plus React Query for server data; the app uses custom hooks for feature logic like `useCalendarEvents`.
- Database schema is defined centrally in `backend/src/db/schema.ts`; migrations are produced under `backend/drizzle/`.

## Coding and naming conventions

- Follow the repository’s existing naming flow:
  - PascalCase for components, classes, DTOs, services, and modules.
  - camelCase for variables, functions, and methods.
  - File names align with feature or domain names, e.g. `auth-api.ts`, `AuthProvider.tsx`, `events.service.ts`.
- Prefer domain names that match existing modules (`auth`, `events`, `db`, `config`, `common`, `hooks`, `pages`).
- Reuse existing helper names and export patterns instead of creating parallel utility layers.
- Keep behavior local unless the code already has a shared abstraction for the same purpose.

## Error-handling principles

- Backend: use NestJS exceptions such as `BadRequestException`, `UnauthorizedException`, `NotFoundException`, and `ConflictException` instead of ad hoc error strings.
- Frontend: normalize API failures through `ApiError` and surface user-friendly messages from `error.details` or `error.message`.
- Validation errors should surface with descriptive messages; do not swallow exceptions silently.
- Preserve the existing `HttpExceptionFilter` and global validation semantics unless a task requires a new error contract.

## Security principles

- Never hardcode secrets or tokens in source code.
- Preserve the existing JWT and refresh-token flow; do not weaken secure cookie settings, access-token validation, or refresh-token rotation behavior.
- Protect auth endpoints with rate limiting, origin validation, and secure cookie settings.
- Preserve `PasswordService` hashing behavior (`scrypt`) and the refresh-token hash pattern in `AuthService`.
- Never log access tokens, refresh tokens, passwords, or other sensitive auth material.
- Keep authorization checks at the controller/service boundary and do not bypass guards.

## Environment/configuration principles

- Use `zod`-based runtime validation for backend env settings in `backend/src/config/env.ts`.
- Keep environment variables defined through the current config patterns rather than introducing a new config system.
- Frontend API base URL is read from `import.meta.env.VITE_API_BASE_URL` with a localhost fallback; do not change the API boundary without a clear requirement.
- Keep secrets out of tracked files and do not add environment variables unless the codebase already expects them.

## Testing expectations

- Backend tests are Jest-based (`*.spec.ts`), and they validate both business logic and env/config behavior.
- Frontend tests are Vitest + React Testing Library based and often mock API modules directly rather than broad browser-level setup.
- Add or update the smallest relevant tests when changing behavior.
- Do not disable or bypass tests to make a change pass.
- Ensure schema/index decisions are backed by tests where the repo already asserts them, as in `backend/src/db/schema-indexes.spec.ts`.

## Git and branching conventions

- No strict repository policy was found in checked-in files, and no PR template or commit hook configuration was identified.
- The repo currently uses short, descriptive branch prefixes such as `chore/...` and `feature/...` style naming when working on scoped changes.
- Keep branches small and task-focused.
- Keep commits focused on a single concern, with messages that explain the code change and reason.

## Commit/PR expectations

- No explicit commit template or PR template was found in the repository.
- For AI-assisted changes, include a summary of the problem, the fix, relevant validation, and any residual risk.
- Group unrelated edits separately; avoid mixing refactors with feature work unless explicitly requested.

## Database change principles

- Database changes must happen via Drizzle schema edits and migration generation, not by editing generated SQL by hand unless required by the repo’s migration workflow.
- Do not add new indexes unless there is a concrete query pattern or performance need.
- Consider existing indexes and constraints before adding another one. The repository explicitly guards against speculative index additions.
- Keep schema changes compatible with existing data and migrations.
- Never modify production data as part of a normal development task.

## API contract principles

- Preserve existing route names, payload shapes, response shapes, and auth semantics unless requirements explicitly change them.
- Backend API docs are generated from NestJS decorators and Swagger metadata; keep DTOs and controller annotations in sync.
- Frontend code should use the existing `api-client.ts` and `*-api.ts` wrappers rather than bypassing the standard request flow.
- Do not change the public API contract without explicit requirement or a coordinated contract update.

## Rules for AI-assisted development

- Inspect existing patterns before introducing new ones.
- Prefer consistency with the existing architecture.
- Reuse existing utilities, services, hooks, components, and abstractions where appropriate.
- Avoid unnecessary dependencies.
- Avoid speculative optimizations.
- Avoid adding database indexes without a concrete query/use case.
- Avoid changing public API contracts without explicit requirements.
- Avoid weakening authentication, authorization, validation, or security controls.
- Never expose or hardcode secrets.
- Run the most relevant validation commands after making changes.
- Clearly identify assumptions when requirements are ambiguous.

The AI should not:

- Rewrite unrelated code.
- Perform broad refactors unless explicitly requested.
- Introduce new architectural patterns without justification.
- Duplicate existing functionality.
- Disable tests, lint rules, type checking, or security controls just to make a change pass.
- Modify generated files unless required.
- Change database schema without considering migrations and existing data.
- Add dependencies when existing project capabilities are sufficient.

## AI Development Rules

The AI should:

- Inspect existing patterns before introducing new ones.
- Prefer consistency with the existing architecture.
- Reuse existing utilities, services, hooks, components, and abstractions where appropriate.
- Avoid unnecessary dependencies.
- Avoid speculative optimizations.
- Avoid adding database indexes without a concrete query/use case.
- Avoid changing public API contracts without explicit requirements.
- Avoid weakening authentication, authorization, validation, or security controls.
- Never expose or hardcode secrets.
- Run the most relevant validation commands after making changes.
- Clearly identify assumptions when requirements are ambiguous.

The AI should NOT:

- Rewrite unrelated code.
- Perform broad refactors unless explicitly requested.
- Introduce new architectural patterns without justification.
- Duplicate existing functionality.
- Disable tests, lint rules, type checking, or security controls just to make a change pass.
- Modify generated files unless required.
- Change database schema without considering migrations and existing data.
- Add dependencies when existing project capabilities are sufficient.

## Recommended workflow

1. Understand the task.
2. Inspect relevant code.
3. Identify existing patterns.
4. Plan the smallest appropriate change.
5. Implement the change.
6. Run relevant validation.
7. Review the diff.
8. Report what changed and any remaining risks.

## Validation commands

Use the commands that match the change being made. The repo already defines these scripts:

Backend:

- `npm --prefix backend run lint`
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- `npm --prefix backend run start:dev` for local dev
- `npm --prefix backend run migrate:generate`
- `npm --prefix backend run migrate:push`
- `npm --prefix backend run drizzle:studio`

Frontend:

- `npm --prefix frontend run lint`
- `npm --prefix frontend run test`
- `npm --prefix frontend run build`
- `npm --prefix frontend run dev`

Project-level:

- `npm run dev` (starts frontend and backend together)

## Rules for avoiding unnecessary abstractions and configuration

- Do not add a new abstraction when the current module, hook, service, or helper already handles the behavior.
- Do not add new dependencies or wrappers when the repository already has an established path.
- Do not create extra configuration layers or env variables unless the code already depends on them.
- Do not add database indexes without a concrete query/use case.
- Do not change architecture for a local problem that can be resolved within the current module/service pattern.
- Preserve existing behavior unless the task explicitly requires a behavioral change.

## Final AI rule

When working in this repository, the default behavior should be: minimal, relevant, and consistent. Make the smallest correct change that matches the existing patterns, validate the affected behavior, and leave the codebase in a state that matches the current architecture and security standards.
