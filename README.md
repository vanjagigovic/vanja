# Calendar

Calendar is a full-stack scheduling application for creating, viewing, and managing events across day, week, and month views. It keeps event timestamps in UTC while retaining each event's time zone for correct presentation and scheduling. The current application includes:

- Email/password registration and login
- JWT access tokens with rotated refresh-token sessions
- Authenticated event CRUD
- Weekly recurrence and reminder settings
- Backend overlap prevention with suggested alternative slots
- Responsive Material UI screens with localized date/time presentation

## Architecture

```text
React + Vite frontend
        |
        v
Central API client + React Query
        |
        v
NestJS HTTP API (controllers, guards, DTOs)
        |
        v
Feature services (auth and events)
        |
        v
Drizzle ORM
        |
        v
PostgreSQL
```

The repository is organized as a small monorepo:

- `frontend/` contains the React single-page application, routes, pages, calendar components, API wrappers, and frontend tests.
- `backend/` contains the NestJS API, DTOs, authentication, event rules, database schema, migrations, and backend tests.
- `docker-compose.yml` provides the local PostgreSQL service.
- `AGENTS.md`, `backend/AI.md`, and `frontend/AI.md` describe development conventions for AI-assisted work.

## Technology stack

### Frontend

- React 19 and TypeScript
- Vite
- Material UI and MUI X Date Pickers
- React Router
- TanStack React Query
- Luxon for date/time handling
- i18next for localization
- A centralized `fetch`-based API client

### Backend

- NestJS and TypeScript
- Passport/JWT authentication
- `class-validator` and `class-transformer` DTO validation
- Swagger/OpenAPI
- Helmet, CORS, cookie-parser, and NestJS throttling
- Zod runtime environment validation

### Database

- PostgreSQL 16 for local development
- Drizzle ORM and Drizzle Kit
- Versioned migrations in `backend/drizzle/`
- Schema definitions in `backend/src/db/schema.ts`

### Testing and tooling

- Frontend: Vitest, jsdom, and React Testing Library
- Backend: Jest and `ts-jest`
- Coverage: Vitest V8 provider and Jest coverage
- ESLint and Prettier
- Husky and lint-staged for staged-file linting

## Authentication and security

- Registration and login return a JWT access token for the client to use as `Authorization: Bearer <token>`.
- Refresh tokens are kept in an HTTP-only cookie on the `/auth` path. The backend stores only a SHA-256 hash in the `sessions` table and rotates/revokes sessions during refresh and logout.
- Passwords are hashed with `scrypt`; credentials and token material are not returned in API responses or logged.
- Event routes require JWT authentication. Event queries are scoped to the authenticated user, preventing access to another user's events.
- DTOs are validated by a global NestJS `ValidationPipe` with whitelisting, transformation, and rejection of unknown properties.
- Auth routes use throttling and origin validation. Helmet security headers and credentialed CORS are configured at startup.
- Cookie security is configurable through environment variables and is required to be secure in production. Production also requires a longer, non-placeholder JWT secret.

## API

The API is served by the backend on port `3001` by default. Main route groups are:

| Group  | Routes                                                                                      |
| ------ | ------------------------------------------------------------------------------------------- |
| Auth   | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`        |
| Events | `GET /events`, `GET /events/:id`, `POST /events`, `PATCH /events/:id`, `DELETE /events/:id` |

Event list requests accept a time range, and event creation/update applies date, recurrence, ownership, and overlap rules in the service layer. Errors are normalized through the backend HTTP exception filter; conflicts can include suggested alternative times.

In development and test environments, Swagger UI is available at [http://localhost:3001/api/docs](http://localhost:3001/api/docs). The generated OpenAPI document is also available at `/api/docs-json`. Swagger is not mounted in production.

## Database

The schema contains three primary entities:

- `users`: email and password hash for each account.
- `sessions`: refresh-token hashes, expiry, revocation, and usage timestamps; sessions reference users and cascade on user deletion.
- `events`: user-owned event details, UTC start/end timestamps, time zone, type, reminder setting, and weekly recurrence metadata.

Database checks enforce `end_time > start_time` and prevent a recurrence end before the event start. The unique email and token-hash constraints protect account and session identity. The `events_user_id_start_utc_idx` composite index supports the calendar query that filters events by user and orders/selects them from a UTC time range. The index is covered by `backend/src/db/schema-indexes.spec.ts`; it is documented here because it corresponds to an actual query pattern, not a speculative optimization.

## Local development

### Prerequisites

- Node.js and npm
- Docker with Docker Compose

### Install dependencies

Run from the repository root:

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

### Configure the environment

Create `backend/.env` with the variables listed below. Create `frontend/.env` only when the API is not at the default `http://localhost:3001`.

```env
# backend/.env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/calendar
JWT_ACCESS_SECRET=replace-with-a-long-local-development-secret
```

The Compose defaults use database `calendar`, user `postgres`, and password `postgres`. Those defaults are for local development only. Do not commit secrets.

### Start PostgreSQL and apply migrations

```bash
docker compose up -d db
npm --prefix backend run migrate:push
```

Generate a migration after a schema change with `npm --prefix backend run migrate:generate`. Open Drizzle Studio with `npm --prefix backend run drizzle:studio`.

### Start the application

Start both processes from the repository root:

```bash
npm run dev
```

Or start them independently:

```bash
npm --prefix frontend run dev
npm --prefix backend run start:dev
```

Vite serves the frontend at its displayed local URL, normally `http://localhost:5175`; the API defaults to `http://localhost:3001`.

## Environment variables

Backend variables are validated in `backend/src/config/env.ts`:

| Variable                               | Required | Default or notes                                                                 |
| -------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `NODE_ENV`                             | No       | `development`; accepts `development`, `test`, or `production`                    |
| `TRUST_PROXY`                          | No       | `false`                                                                          |
| `DATABASE_URL`                         | Yes      | PostgreSQL connection URL                                                        |
| `PORT`                                 | No       | `3001`                                                                           |
| `FRONTEND_URL`                         | No       | `http://localhost:5175`                                                          |
| `JWT_ACCESS_SECRET`                    | Yes      | At least 32 characters; production requires at least 64 and rejects placeholders |
| `JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS`  | No       | `900`                                                                            |
| `JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS` | No       | `2592000`                                                                        |
| `REFRESH_TOKEN_COOKIE_NAME`            | No       | `refresh_token`                                                                  |
| `AUTH_COOKIE_SECURE`                   | No       | `false` locally; must be `true` in production                                    |
| `AUTH_COOKIE_SAME_SITE`                | No       | `lax`; accepts `strict`, `lax`, or `none`                                        |

Frontend configuration is read from `VITE_API_BASE_URL` and falls back to `http://localhost:3001`.

## Observability and request tracing

The backend uses a request-scoped context and middleware to attach a correlation ID to each request and log the start/completion of HTTP calls without exposing tokens or secrets. `RequestLoggingMiddleware` records method, path, status, and duration for debugging, while `AuthService` emits structured security-event logs for registration, login, refresh, and logout outcomes. The app keeps these logs operational and focused on auditability rather than sensitive payload data.

## Testing and quality checks

Run the focused checks from the repository root:

```bash
npm --prefix frontend run test
npm --prefix frontend run test:coverage
npm --prefix backend run test
npm --prefix backend run test:cov
npm --prefix frontend run lint
npm --prefix backend run lint
npm --prefix frontend run build
npm --prefix backend run build
```

Frontend tests use Vitest and React Testing Library for rendered behavior, user interaction, auth/session state, and query-driven calendar behavior. Backend tests use Jest for environment validation, authentication, event controller/service behavior, and schema/index guardrails. These are unit and focused integration-style tests; the repository does not currently provide an end-to-end test suite. Coverage reports are generated with the `--coverage` scripts, but the repo does not currently enforce a single global coverage threshold.

The root `prepare` script initializes Husky, and lint-staged runs the relevant ESLint configuration for staged TypeScript files. The root `test` script is not a project test runner; use the frontend and backend commands above.

## CI/CD and GitHub Actions

GitHub Actions runs the frontend and backend validation pipeline on pull requests and on pushes to `main` via `.github/workflows/ci.yml`.

- Frontend job: install, lint, test, and build the React app.
- Backend job: install, run `lint:ci`, run Jest, and build the NestJS app.
- CI also sets the required `NODE_ENV` and test `DATABASE_URL`/JWT secret values for backend execution.

## Documentation map

- `README.md`: project overview, setup, architecture, API, security, and verification commands.
- `backend/README.md`: backend-specific setup and operational commands.
- `frontend/README.md`: frontend-specific setup and test/build commands.
- `AGENTS.md`: repository-wide engineering and AI-assisted development rules.
- `backend/AI.md` and `frontend/AI.md`: implementation guidance for their respective application layers.

Documentation should be checked against package scripts, source behavior, and environment validation whenever the application changes.
