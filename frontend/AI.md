# Frontend AI Development Guidelines

This document is for AI coding agents working in the React frontend. Follow the current implementation patterns in `frontend/src` and avoid broad architectural churn.

## React architecture

- The app is a single-page React application bootstrapped with Vite.
- Routing is handled with `react-router-dom` in `src/App.tsx` and uses `ProtectedRoute` to guard authenticated screens.
- Auth state is centralized in `src/auth/AuthProvider.tsx` and consumed through `useAuth()`.
- Calendar data is fetched with `@tanstack/react-query`; relevant hooks include `useCalendarEvents` and query invalidation patterns.
- Local UI state is kept in component state or hooks rather than introducing a new global store unless the existing code already demands it.

## TypeScript conventions

- Use TypeScript types to model API payloads, UI state, and route state.
- Reuse existing response types from `frontend/src/types` and helper mappers in `frontend/src/helpers` rather than creating duplicate shapes.
- Prefer concrete types over `any` and avoid broad type assertions unless the existing code already does so in a narrow, justified place.
- Keep naming aligned with current code: `CalendarEvent`, `EventPayload`, `ApiError`, `AuthResponse`, and similar domain names.

## Component conventions

- Prefer existing component patterns in `src/components` and `src/pages`.
- MUI is the main UI system; prefer `@mui/material` components and `sx` props for styling.
- Theme values are accessed through `theme.custom.*` rather than introducing new CSS variables or large styling files.
- Keep presentational logic separate from data-fetching logic; use existing hooks for query logic and keep page components focused on composition.
- Create a new component only when it encapsulates repeated or non-trivial UI that is used in more than one place or makes a page too large to follow.

## Hooks

- Custom hooks are used for feature logic, such as `useCalendarEvents` and other stateful patterns.
- Hooks should be small, focused, and narrow in scope.
- Keep side effects, mutation orchestration, and query invalidation logic inside the same hook when that is the project’s pattern.
- Do not create a hook just to wrap a couple of lines that are only used once.

## State management

- Prefer component state for local form and view state.
- Use React Query for server-backed calendar data and invalidation.
- Keep auth/session state in `AuthProvider` and access it via `useAuth()`.
- Avoid introducing a new global state library unless there is a concrete missing capability and the existing code pattern demonstrates it.

## API/data-fetching patterns

- API calls flow through `frontend/src/api/api-client.ts` and feature-specific wrappers like `authApi` and `eventsApi`.
- `apiRequest()` is the central fetch helper; it handles credentials, Authorization headers, 401 refresh, and error normalization.
- When the access token expires, the client automatically tries a refresh via `/auth/refresh` and then retries the original request.
- Frontend code should not bypass these wrappers for normal backend calls.
- Follow existing mapper patterns in `frontend/src/helpers` to transform backend DTOs into UI event objects.

## Routing

- Route definitions live in `src/App.tsx`.
- Protected routes use `ProtectedRoute` and redirect unauthenticated users to `/login` while preserving the original route in `location.state`.
- Default navigation is implemented with redirect components rather than ad hoc redirects across different pages.
- Preserve route paths and auth behavior unless the task explicitly changes navigation behavior.

## Forms and validation

- Forms use component-local validation and inline error message state.
- Client validation is performed before submit, as in the login and registration pages.
- Keep validation behavior aligned with backend constraints and user-friendly messaging.
- Do not add extra dependencies for validation when the existing form patterns are sufficient.

## Loading/error/empty states

- Loading states use `CircularProgress` or similar MUI patterns.
- Error messages are surfaced through `Alert` and API error normalization helpers.
- Empty states should be handled in the component or hook using the existing data values rather than creating a broad wrapper component.
- If data fails to load, keep the failure explicit and user-visible rather than silently swallowing it.

## Accessibility expectations

- Use MUI components that provide accessible defaults.
- Keep labels and helper text explicit for form fields.
- Do not rely on color alone to communicate errors, state, or validation.
- Preserve the existing screen-reader-friendly patterns used in the current components.

## Styling/UI conventions

- Styling is primarily done with MUI `sx` props and custom theme values such as `theme.custom.glass.*` and `theme.custom.layout.*`.
- Follow the material theme and existing custom styles instead of introducing new CSS files for one-off UI changes.
- Reuse style helpers in `frontend/src/styles` when the code already organizes related styling there.

## Reusable components

- Reuse existing calendar, dialog, account menu, and form components before creating another variant.
- Keep components domain-focused and avoid generic wrappers for a single feature.
- If the same pattern appears more than once, factor it into the existing component structure rather than inventing a new abstraction.

## Testing with Vitest and React Testing Library

- The repo uses Vitest and React Testing Library in `frontend/src/**/*.test.tsx` and `*.test.ts` files.
- Mock the API layer directly when testing auth/session flows, as shown in `AuthProvider.test.tsx`.
- Do not use MSW because no MSW setup was found in the codebase.
- Keep tests focused on actual behavior: rendered output, user interaction, auth state, and query behavior.
- Coverage is generated via `npm run test:coverage`, but this project does not currently enforce a hard coverage threshold. Prefer behavior-first tests over coverage-only changes.
- If a task is limited to documentation or tests, avoid touching production code unless there is a specific runtime change to validate.

## Mocking conventions

- Mock the API boundary when testing UI logic; the repo does this by mocking `../api/auth-api` and `../api/api-client`.
- Prefer minimal mocks that reflect real behavior and required response shapes.
- Do not assert on mock-only implementation details when the real user-visible behavior can be tested.

## How frontend code should communicate with the backend

- Use feature APIs in `src/api` and the shared `apiRequest()` helper.
- Maintain the current auth flow: access token as bearer token, refresh token in an httpOnly cookie, and automatic refresh on 401.
- Keep API paths aligned with existing backend route structure and helper builders in `frontend/src/helpers`.
- Do not bypass the API client or construct manual fetch calls for normal app requests.

## Authentication/token handling

- Access tokens are stored in module-level state via `auth-token-store.ts` and set through `AuthProvider`.
- Refresh tokens remain in `httpOnly` cookies managed by the backend.
- `api-client.ts` responds to 401s by refreshing the session and retrying the request.
- Preserve existing login, logout, and session-expiration behavior; do not weaken token handling just to simplify test setup.

## Environment variables

- Frontend runtime config is loaded with `import.meta.env.VITE_API_BASE_URL`.
- Default to `http://localhost:3001` when the env var is absent.
- Do not add new frontend config patterns unless the repo already requires them.

## Error handling

- Convert API failures to `ApiError` and show user-visible messages using the existing helpers.
- Keep all API error messages in the same format as current patterns.
- Do not hide failures or return empty success states when the request failed.

## Performance considerations

- Keep query keys consistent with `useQuery` usage and invalidation patterns.
- Avoid adding unnecessary re-renders or broad query invalidation that affects unrelated screens.
- Reuse memoized range calculations and existing helpers rather than duplicating date logic.
- Do not add speculative optimization layers without direct evidence of a bottleneck.

## When to create a component

Create a new component when:

- the markup is reused across screens or repeated inside a page;
- the UI is substantial enough to benefit from isolation;
- the logic is visually meaningful and not just a small local block.

Do not create a new component when:

- the code is only used once;
- it would duplicate an existing pattern already used in another component;
- it adds a wrapper without improving readability or reuse.

## When to create a custom hook

Create a custom hook when:

- a feature’s logic is shared across components;
- the code includes data-fetching, mutation orchestration, or stateful behavior that should remain testable;
- a pattern already exists for that domain, such as `useCalendarEvents`.

Do not create a hook when:

- the logic is a one-off component concern;
- the repository already has a simpler or more direct pattern for the task;
- you are only extracting a tiny local callback that does not improve clarity.

## When to reuse an existing abstraction

- Reuse `AuthProvider`, `ProtectedRoute`, `api-client`, `eventsApi`, and helper mappers before creating new wrappers.
- Reuse validation/error helpers that already exist in the same feature area.
- Match the current feature naming conventions and file organization.

## When NOT to introduce an abstraction

- Do not add a new utility for a one-line transform already handled in place.
- Do not create a new state container when a local state hook or React Query pattern already solves the problem.
- Do not add new dependency layers or API wrappers when the codebase already has the necessary endpoint and request infrastructure.

## Frontend AI workflow

1. Find the existing component/page/feature pattern.
2. Inspect related hooks, API calls, state, and tests.
3. Reuse existing conventions.
4. Implement the smallest change.
5. Add or update tests.
6. Run frontend validation.
7. Review the final diff for unnecessary changes.

Before merging AI-assisted frontend work, a developer must review the generated code and documentation. Treat AI output and generated tests as untrusted drafts: verify user-visible behavior against the existing routes, API client, auth provider, hooks, and tests, and do not increase coverage without testing meaningful behavior. Run the relevant lint, build/typecheck, and Vitest commands. Never place secrets, credentials, tokens, passwords, or sensitive user data in prompts or generated files. Changes touching authentication, token handling, authorization, or API contracts require explicit security and contract review.

## Frontend validation commands

- `npm --prefix frontend run lint`
- `npm --prefix frontend run test`
- `npm --prefix frontend run build`
- `npm --prefix frontend run dev`

## Final rule for AI frontend work

Prefer the existing design language, auth/session flow, and query-driven architecture in this repo. Keep changes narrow, testable, and aligned with the existing Material UI and React Query conventions; do not add complexity without a concrete need.
