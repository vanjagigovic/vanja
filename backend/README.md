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

The API listens on port `3001` by default. Swagger UI is available at `/api/docs` outside production.

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
npm run build
```

Backend tests cover environment validation, authentication, event behavior, and database schema/index guardrails. Backend-specific AI implementation rules are in [AI.md](AI.md).
