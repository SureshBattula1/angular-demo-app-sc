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

## CI & pre-commit automation

- **CI** (`.github/workflows/ci.yml`): on every push/PR, runs `npm run lint` (ESLint),
  `npm run lint:css` (Stylelint), `ng test --watch=false --browsers=ChromeHeadless`, and
  `npm run build`, on Node 22 (matching the Docker image).
- **Pre-commit hook** (Husky + lint-staged, `.husky/pre-commit`): runs ESLint `--fix` on
  staged `*.ts` and Stylelint `--fix` on staged `*.scss` before each commit. Activates
  automatically on `npm install`/`npm ci` via the `prepare` script — nothing to run
  manually. It's wrapped in `|| true` so it never breaks an install in an environment
  without `.git` (e.g. the Docker build).

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

## Design system

Colors are **runtime CSS custom properties**, not fixed SCSS values — `ThemeService`
(`core/services/theme.service.ts`) writes them onto `:root` from one of the 60+ presets in
`shared/config/theme.config.ts` whenever the user picks a theme. **Never hardcode a hex color
in component SCSS** — use the variable so the component repaints correctly under every theme:

| Use for | Variable |
|---|---|
| Primary brand color / shades | `var(--primary-color)`, `var(--primary-light)`, `var(--primary-dark)` |
| Accent color / shades | `var(--accent-color)`, `var(--accent-light)`, `var(--accent-dark)` |
| Muted text / borders | `var(--neutral-color)` |
| Page/card backgrounds | `var(--surface-color)`, `var(--soft-surface-color)`, `var(--card-background)` |
| Status colors | `var(--success-color)`, `var(--warning-color)`, `var(--error-color)`, `var(--info-color)` |

This is enforced by `npm run lint:css` (Stylelint, config in `.stylelintrc.json`) — currently
**warning-level**, because ~35 legacy component files still hardcode hex colors. Don't add to
that count in new code; feel free to fix a legacy one opportunistically while you're already
editing that file.

**Reuse shared building blocks before writing new ones** (`src/app/shared/components/`):
- `data-table` — server-side paginated/sortable/searchable list table; every feature list page
  uses this instead of a hand-rolled `<table>`.
- `advanced-search-sidebar` — the filter panel pattern used alongside `data-table`.
- `export-button` (+ `shared/export.service.ts`) — Excel/PDF/CSV export with permission checks.
- `file-upload`, `universal-attachments` — file/document upload and attachment management.
- `charts/*` — Chart.js wrappers (bar/doughnut/line) for dashboards.

**Global CSS** already covers the common HTML patterns — check `src/styles/` (`buttons.css`,
`cards.css`, `forms.css`, `modals.css`, `tables.css`, `tabs.css`, `view-pages.css`) before writing
bespoke SCSS for a button/card/modal/table look. Material's theme/palette lives in
`src/styles/theme.scss` and `material-theme.scss` — don't redefine a Material palette inside a
feature component.

## New feature checklist

Follow the shape already established by `features/students`, `features/admissions`, and
`features/promotions`:

1. `features/<name>/<name>.routes.ts`, lazy-loaded from `app.routes.ts`, each route carrying
   `data: { permissions: [...], permissionMode }` that matches the API's permission slug exactly.
2. A facade service (`<name>.service.ts`) built on `core/services/api.service.ts` — never call
   `HttpClient` directly from a component.
3. List page = `data-table` + `advanced-search-sidebar` + `export-button`, not a custom table.
4. Gate buttons/actions with `*hasPermission`, mirroring the route's permission slug (defaults to
   hidden, so a missing slug fails safe rather than leaking a button).
5. Style with the theme CSS variables above; run `npm run lint:css` before committing.
6. Add strongly-typed model interfaces to `core/models/`.
7. Keep it lazy-loaded and check `npm run build` doesn't blow the bundle budget (see Gotchas).

## Gotchas

- Permission slugs must stay in sync with the API's `permissions` table — a typo silently
  hides a feature.
- Production build budgets are strict (initial 500kB warn / 1MB error). Keep features
  lazy-loaded so the initial bundle stays small.
- Test coverage is currently near-zero (only `app.component.spec.ts`). Add specs for new
  services/components — services are the easiest high-value place to start.
- **Stylelint and lint-staged are pinned to Node-18-compatible majors on purpose**
  (`stylelint@16.15.0`, `lint-staged@15.5.2`, `stylelint-config-standard-scss@13.1.0`, all
  exact versions, not `^`-ranges). Newer majors of both (Stylelint 17, lint-staged 17) require
  Node ≥20 — lint-staged 17 in particular crashes on **every** commit on Node 18 (a `listr2`
  dependency imports a Node 20+-only `node:util` API), not just when touching `.scss`. Don't
  `npm update` these past their current majors without confirming the team's Node version, or
  the pre-commit hook will start hard-failing every commit again.
- ESLint (and therefore the pre-commit hook's `*.ts` step) is slow on this machine — a
  single-file `eslint` run took ~2.5 minutes in testing. That's WSL2's cross-filesystem
  overhead for a project on the Windows-mounted `/mnt/c/...` path, not a config problem;
  moving the repo to the native WSL2 filesystem (e.g. `~/projects/...`) would fix it.
