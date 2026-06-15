# CLAUDE.md — School Management UI

Guidance for Claude Code when working in this repository.

## What this is

**Angular 21 single-page app** for the multi-tenant School Management SaaS. It is the
frontend for the Laravel API in the sibling `../api` repo, which it reaches over
REST/JSON using Sanctum bearer tokens.

## Stack

- **Angular 21** — standalone components, lazy-loaded feature routes (no NgModules for features)
- **Angular Material 21** + **Angular CDK** — UI components; theme in `src/styles/material-theme.scss`
- **RxJS 7** — async/state
- **Chart.js 4** — dashboard charts
- **jsPDF** — client-side PDF export
- TypeScript 5.9, ESLint + angular-eslint, Karma + Jasmine for tests

## Commands

```bash
npm install
npm start            # ng serve, development config, http://localhost:4200
npm run start:prod   # serve with production config
npm run build        # production build (default config)
npm run build:dev    # development build
npm test             # Karma + Jasmine
npm run lint         # ESLint
```

API base URL is per-environment in `src/environments/` — `environment.development.ts`
points at `http://localhost:8000/api`. Configs exist for development, testing, docker,
and production (selected via `angular.json` fileReplacements).

## Running with Docker

A full-stack Docker setup lives in the **parent directory** (`../docker-compose.yml`),
covering this UI, the `../api` Laravel backend, and a dedicated MySQL. Run `docker`
commands from **inside WSL2 Ubuntu** (Docker Engine CLI — no Docker Desktop needed):

```bash
cd /mnt/c/.../Projects        # the folder containing docker-compose.yml
docker compose up --build -d  # build + start db, api, ui
docker compose down           # stop (keeps DB volume)
```

Then open the app at **`http://localhost:8080`** (NOT 4200 — that's the local `ng serve`).

How it's wired: [Dockerfile](Dockerfile) is a multi-stage build — `npm ci` +
`ng build --configuration=docker`, then the static output is served by nginx
([nginx.conf](nginx.conf)). The `docker` config uses `apiUrl: '/api'`, and nginx
**reverse-proxies `/api` → the `api` container** (same origin, so no CORS). The image
bakes in the built app, so **rebuild (`up --build`) after UI code changes**.

## Architecture & conventions

**Folder layout:**
- `src/app/core/` — singletons: `services/` (`auth`, `api`, `permission`, `branch`,
  `school`, `academic-year-context`), `guards/`, `interceptors/`, `models/`.
- `src/app/features/<feature>/` — one folder per business module (students, teachers,
  fees, exams, attendance, admissions, library, transport, accounts, communications…),
  each **lazy-loaded** via its own `*.routes.ts`. This is where most work happens.
- `src/app/company-portal/` — the SaaS owner admin area (companies, schools, impersonation),
  with its own auth/guards/services, separate from the school app.
- `src/app/shared/` — reusable components + the Material module.
- `src/app/layouts/main-shell/` — authenticated app shell.

**HTTP interceptors (registered in `app.config.ts`, run on every request, in order):**
1. `authInterceptor` — attaches the Sanctum bearer token.
2. `academicYearInterceptor` — injects the selected academic year context.
3. `errorInterceptor` — global API error handling.

**Routing & access control (`app.routes.ts`):**
- `authGuard` protects the authenticated shell.
- `permissionGuard` gates each feature route via `data: { permissions, permissionMode }`
  where `permissionMode: 'any'` means any-of. Permission slugs mirror the API exactly
  (e.g. `students.view`, `fees.collect`).
- Use the `*hasPermission` directive (`core/directives/has-permission.directive.ts`)
  to show/hide UI elements — keep UI gating consistent with route gating.
- `roleGuard` and `guest.guard` also exist; the company portal uses `company-auth.guard`.

**Conventions to follow:**
- New features = a `features/<name>/` folder with a `<name>.routes.ts`, lazy-loaded from
  `app.routes.ts`, guarded by `permissionGuard` with the matching API permission slug.
- Prefer **standalone components** (the whole app uses them).
- Put API calls in a feature `services/*.service.ts` that builds on `core/services/api.service.ts`;
  don't call `HttpClient` directly from components.
- Strongly type API payloads with interfaces in `core/models/`.

## Gotchas

- Permission slugs must stay in sync with the API's `permissions` table — a typo silently
  hides a feature.
- Production build budgets are strict (initial 500kB warn / 1MB error). Keep features
  lazy-loaded so the initial bundle stays small.
- Test coverage is currently near-zero (only `app.component.spec.ts`). Add specs for new
  services/components — services are the easiest high-value place to start.
