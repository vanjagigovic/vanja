# Calendar API

The backend is a NestJS API for authentication and user-owned calendar events. It uses Drizzle ORM with PostgreSQL. Business rules live in services, while controllers expose validated DTOs and authenticated routes.

## Setup

From the repository root:

```bash
npm --prefix backend install
```

Create `backend/.env` with at least:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/calendar
JWT_ACCESS_SECRET=replace-with-a-long-local-development-secret
```

Start the local database from the repository root with `docker compose up -d db`, then apply the schema with:

```bash
npm --prefix backend run migrate:push
```

See the root [README](../README.md) for the complete environment variable reference and full application setup.

## Run

```bash
npm run start:dev
```

The API listens on port `3001` by default. Swagger UI is available at `/api/docs` outside production. Request logging uses a correlation ID in the request context, and the app logs security events for auth actions without exposing secrets or token material.

## API surface

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- Events: `GET /events`, `GET /events/:id`, `POST /events`, `PATCH /events/:id`, `DELETE /events/:id`

Event routes use JWT authentication and enforce user ownership. Event validation, recurrence rules, overlap prevention, and conflict suggestions are implemented in `EventsService`.

## Database commands

```bash
npm run migrate:generate
npm run migrate:push
npm run drizzle:studio
```

Schema definitions are in `src/db/schema.ts`; generated migrations are stored in `drizzle/`.

## Tests and checks

```bash
npm run test
npm run test:cov
npm run lint
npm run lint:ci
npm run build
```

Backend tests cover environment validation, authentication, event behavior, and database schema/index guardrails. The CI workflow runs the same lint/test/build flow with the project-level test env variables defined in `.github/workflows/ci.yml`. Coverage reports are generated with `npm run test:cov`, but the repo does not currently enforce a hard coverage threshold. Backend-specific AI implementation rules are in [AI.md](AI.md).
