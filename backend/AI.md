# Backend AI Development Guidelines

This document is for AI coding agents working in the NestJS backend. Keep changes aligned with the existing NestJS module structure, Drizzle schema patterns, validation flow, and auth/security controls.

## NestJS architecture

- The app is bootstrapped in `backend/src/main.ts` with global validation, CORS configuration, cookie parsing, Helmet security headers, and Swagger setup in non-production.
- `AppModule` imports `ScheduleModule.forRoot()`, `AuthModule`, and `EventsModule`.
- Module boundaries are explicit: `auth/`, `events/`, `db/`, `common/`, and `config/`.
- Controllers are thin and delegate to services; services contain the actual business logic and database access.
- The `@Inject(DATABASE_CONNECTION)` pattern is the current way to access the Drizzle DB instance.

## Module boundaries

- `auth/` owns auth flow, JWT strategy, guard setup, DTOs, and password hashing.
- `events/` owns event CRUD and overlap/recurrence logic.
- `db/` owns the Drizzle instance and schema definitions.
- `common/` contains shared middleware and exception filters.
- `config/` owns runtime env validation with `zod`.

Do not move logic across modules just to make a small change easier unless the repository already organizes that logic in the same module boundary.

## Controllers

- Controllers use NestJS decorators for Swagger metadata and route-level auth behavior.
- Auth endpoints expose registration, login, refresh, and logout logic; event endpoints are guarded with `JwtAuthGuard` and `@ApiBearerAuth('JWT-auth')`.
- Use DTOs and parameter decorators instead of ad hoc parsing in controller methods.
- Keep controllers focused on HTTP concerns: request extraction, response shaping, and delegation to the service layer.

## Services

- Business logic belongs in services, not controllers.
- Services frequently validate domain rules and call Drizzle queries directly.
- Preserve the repo’s pattern of explicit exception throwing (`BadRequestException`, `UnauthorizedException`, `ConflictException`, `NotFoundException`) rather than returning ambiguous success/failure values.
- Keep service methods focused on a single responsibility and avoid creating extra layers for one-off logic.

## Repositories/data-access layer

- There is no separate repository class pattern in the current codebase; Drizzle queries are performed directly in services.
- Continue using the direct `db.select()`, `db.insert()`, `db.update()`, and `db.delete()` patterns from the existing services.
- Keep query logic close to the service using it rather than introducing repository-only wrappers for everything.

## DTOs

- DTOs are the API contract for request validation and Swagger docs.
- Validation is handled with NestJS metadata and `ValidationPipe` in the bootstrap config.
- Preserve existing DTO field names, types, and validation semantics.
- Do not silently broaden or narrow a DTO shape without requirement.

## Validation

- Validation is global and strict: `whitelist: true` and `forbidNonWhitelisted: true` are enabled in `main.ts`.
- Keep validation in DTOs and service-layer domain checks; do not weaken guards or request validation to satisfy a narrow test.
- Preserve date validation, overlap rules, recurrence rules, and negative-duration checks already implemented in `EventsService`.

## Guards

- `JwtAuthGuard` is the current authenticated route guard.
- The application already uses `ThrottlerGuard` on auth endpoints and relies on the JWT bearer token for protected routes.
- Apply authorization at the appropriate layer; for example, the event service receives the authenticated `userId` from the request and re-checks ownership in database queries.
- Do not bypass guards in tests or production code.

## Interceptors

- No custom interceptor patterns were identified in the observed code; the normalization and exception handling are done through filters, pipes, and controller/service logic.
- Avoid introducing interceptors unless the repo already has a clear pattern for the use case.

## Exception/error handling

- Use NestJS exceptions for invalid input, unauthorized access, missing resources, or conflicts.
- Keep error payloads aligned with the existing app behavior; e.g., `AuthService` returns unauthorized responses for invalid refresh tokens and `EventsService` returns structured conflict suggestions on overlaps.
- Do not convert errors to generic 500s for valid user-facing failures.
- Preserve the `HttpExceptionFilter` and validation behavior rather than swallowing exceptions.

## Authentication

- Authentication currently uses email/password sign-in and registration.
- Access tokens are JWT bearer tokens issued with `JwtService.signAsync({ sub: user.id })`.
- Refresh tokens are random tokens stored as SHA-256 hashes in the `sessions` table and sent via a secure cookie under the configured cookie name.
- Refresh-token rotation is intentional and security-sensitive; preserve it.
- Preserve existing normalized-email behavior (`trim().toLowerCase()`) and password verification logic.

## Authorization

- Authorization is enforced by the JWT guard and by ownership queries in service methods.
- Event access is user-scoped: queries filter by `eventsTable.userId` and the authenticated user id.
- Do not loosen user-scoped queries to allow cross-user access.

## Access tokens

- Access tokens are issued in response payloads and sent in the Authorization header as `Bearer <access-token>`.
- The backend config defines expiry values via `JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS` and `JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS`.
- Preserve token validation and expiration checks, especially in the refresh flow.

## Refresh tokens

- Refresh tokens are stored as hashed values and revoked when reused or logged out.
- Refresh-token storage and revocation are security-sensitive functionality.
- Never log refresh tokens or token hashes.
- Preserve the current rotation and revocation semantics.

## PostgreSQL

- PostgreSQL is the database used by the app.
- Database connections are created via `Pool` and Drizzle in `backend/src/db/db.module.ts`.
- Keep schema definitions and business logic consistent with the existing UTC timestamp handling and checks.

## Drizzle ORM

- The data model is defined in `backend/src/db/schema.ts`.
- Use the existing table names, column names, and relation patterns.
- Do not add a schema or query layer just to abstract existing Drizzle usage.
- Keep schema changes coordinated with migration files under `backend/drizzle/`.

## Database migrations

- Migrations are generated by `npx drizzle-kit generate --config ./drizzle.config.ts` and pushed by `npx drizzle-kit push --config ./drizzle.config.ts`.
- When the schema changes, include the migration and consider any required data migration or compatibility edge case.
- Never modify production data directly as part of a normal development task.

## Database indexes

Do not add indexes just because they are theoretically possible.

- Every new index should have a concrete query pattern it supports.
- Consider existing indexes and constraints before adding another index.
- Consider selectivity and query patterns.
- Avoid redundant indexes.
- Existing schema tests explicitly protect against speculative indexing patterns; keep that intent.

The repo already enforces the rule that only the query-appropriate index patterns remain in the schema, and new schema work should follow that discipline.

## Redis if present

- No Redis usage was found in the repository. Do not add Redis for a task that can be solved with the existing PostgreSQL/Drizzle approach.

## Swagger/OpenAPI

- The app sets up Swagger in `main.ts` when `NODE_ENV !== 'production'`.
- Keep controller method decorators and DTO metadata aligned with the API docs.
- Preserve bearer-auth metadata and route documentation when changing auth or event endpoints.

## Environment configuration

- The backend uses `zod` in `backend/src/config/env.ts` to validate env config.
- Values like `DATABASE_URL`, `JWT_ACCESS_SECRET`, cookie settings, and `FRONTEND_URL` are validated at startup.
- Keep environment validation and startup behavior in place rather than creating a separate config layer.
- Do not add new secrets or config keys unless there is a direct requirement and the existing configuration pattern already expects them.

## Security practices

- Keep `helmet`, CORS, and same-origin validation in place.
- Preserve `OriginValidationMiddleware` behavior for auth endpoints.
- Keep `ThrottlerGuard` and rate limits on auth routes.
- Maintain secure cookie semantics and consistent same-site/secure validation.
- Never expose or hardcode secrets.
- Never log access tokens, refresh tokens, passwords, or sensitive credentials.

## Testing conventions

- Backend tests are Jest-based and live beside the feature code as `*.spec.ts` files.
- Existing tests cover environment validation, auth behavior, event controller behavior, and schema/index guardrails.
- Add or update tests when behavior changes.
- Do not disable test coverage or validation just to make a change pass.

## API response conventions

- Auth endpoints return `{ user, accessToken }` and keep refresh tokens in cookies.
- Successful delete operations return `{ success: true }`.
- Event DTOs are shaped consistently with the response models and `CurrentUser` ownership checks.
- Do not change response contracts unless there is an explicit requirement to do so.

## Logging/observability

- The app uses NestJS logger calls for security events in `AuthService`.
- Logs should remain operational and not include sensitive auth material.
- Keep the logging style focused on security-related events and avoid noisy, general-purpose logging for routine behavior.

## Authentication and security rules for AI agents

- Never hardcode secrets.
- Never log access tokens, refresh tokens, passwords, or sensitive credentials.
- Preserve existing password hashing behavior.
- Preserve token validation and expiration behavior.
- Validate authentication input.
- Apply authorization at the appropriate layer.
- Do not weaken guards or validation to make tests pass.
- Treat refresh-token storage and revocation as security-sensitive functionality.

## Backend AI workflow

1. Identify the relevant module.
2. Inspect controller, DTO, service, repository, schema, and tests.
3. Understand the existing data flow.
4. Check existing validation and security behavior.
5. Implement the smallest appropriate change.
6. Update migrations/tests/API documentation where required.
7. Run relevant backend validation.
8. Review the diff for unintended changes.

## Backend validation commands

- `npm --prefix backend run lint`
- `npm --prefix backend run test`
- `npm --prefix backend run build`
- `npm --prefix backend run start:dev`
- `npm --prefix backend run migrate:generate`
- `npm --prefix backend run migrate:push`
- `npm --prefix backend run drizzle:studio`

## Final rule for AI backend work

Keep backend changes aligned with the repository’s actual NestJS, Drizzle, auth, and validation patterns. Favor the smallest correct fix, preserve the existing security posture, and update migrations and tests when the schema or behavior changes.
