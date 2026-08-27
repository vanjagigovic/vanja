# Calendar frontend

The frontend is a React 19 single-page application built with Vite and TypeScript. It provides authenticated calendar views, event forms, navigation, reminders, localization, and responsive Material UI components.

## Setup

From the repository root:

```bash
npm --prefix frontend install
```

The API client defaults to `http://localhost:3001`. To use another API URL, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Start the development server with:

```bash
npm --prefix frontend run dev
```

The complete full-stack setup, including PostgreSQL and backend environment variables, is documented in the root [README](../README.md).

## Frontend patterns

- React Router defines application routes and protected navigation.
- `AuthProvider` owns authentication state.
- The shared API client attaches bearer access tokens, includes refresh-cookie credentials, retries once after a 401 refresh, and normalizes API errors.
- TanStack React Query manages server-backed calendar data and invalidation.
- Luxon handles time-zone-aware calendar calculations and presentation.

## Tests and checks

```bash
npm run test
npm run test:coverage
npm run lint
npm run build
```

Tests use Vitest and React Testing Library and focus on rendered behavior, user interaction, authentication state, API-boundary behavior, and calendar query behavior. Frontend-specific AI implementation rules are in [AI.md](AI.md).
