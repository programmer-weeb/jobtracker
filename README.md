# Job Application Tracker

Portfolio-grade job application tracker built with a Rails API and a React TypeScript frontend.

![Rails](https://img.shields.io/badge/Rails-8-CC0000?logo=rubyonrails) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Coverage API](https://img.shields.io/badge/api%20coverage-92.6%25-brightgreen) ![Coverage Web](https://img.shields.io/badge/web%20coverage-92%25-brightgreen)

JobTracker helps users manage job applications through a Kanban workflow, searchable table view, companies, notes, tags, and activity history. I built it to demonstrate full-stack product engineering: data modeling, secure API design, frontend state management, optimistic UI, testing, and deployment-oriented configuration.

## What This Project Demonstrates

- **Full-stack architecture**: Rails 8 API-only backend with a separate React 19 SPA.
- **Authentication**: Devise + devise-jwt login/signup flow with bearer tokens.
- **Token revocation**: JTI-based logout invalidates previously issued JWTs.
- **Authorization**: Pundit policies and policy scopes isolate each user's data.
- **Relational modeling**: Users, companies, applications, notes, tags, join table, and event timeline.
- **Kanban workflow**: Drag-and-drop status movement with sparse position ordering.
- **Optimistic UI**: Board cards move instantly and roll back if the API request fails.
- **Search and filtering**: Status, company, tag, remote flag, and text search.
- **Pagination**: API returns pagination metadata and caps page size.
- **Testing discipline**: RSpec request/model specs, Vitest/RTL frontend tests, coverage gates.
- **CI quality gates**: Tests, linting, typechecking, production build, Brakeman, and bundler-audit.
- **Deployment awareness**: Render Blueprints for multi-service infrastructure (Web, API, Worker, DB).

## Product Features

- User signup, login, logout, and authenticated session restore.
- Company CRUD, scoped to the current user.
- Job applications with title, company, source, salary range, currency, remote flag, location, URL, status, tags, and applied date.
- Kanban board with columns: Wishlist, Applied, Interview, Offer, Rejected, Archived.
- Application table with filters, debounced search, and pagination.
- Application detail page with editable fields, notes, tags, and activity timeline.
- Notes create timeline events.
- Demo seed data for two users to show data isolation.

## Architecture

```text
┌──────────────┐   JSON + JWT    ┌────────────────┐
│ React 19 SPA │ ──────────────▶ │ Rails 8 API    │
│ TypeScript   │                 │ Devise + JWT   │
│ TanStack     │ ◀────────────── │ Pundit         │
│ dnd-kit      │                 │ Rack::Attack   │
└──────────────┘                 └───────┬────────┘
                                         │
                                         ▼
                                  ┌────────────┐
                                  │ PostgreSQL │
                                  └────────────┘
```

The repo is a monorepo:

```text
.
├── api/    # Rails 8 API, PostgreSQL, Devise JWT, Pundit, RSpec
├── web/    # React 19, Vite, TypeScript, TanStack Query/Router, Vitest
└── plan.md
```

## Key Engineering Decisions

### API-First Rails Backend

Rails runs in API mode and returns JSON only. This keeps the backend focused on authentication, authorization, validation, persistence, and API contracts while the React app owns the browser experience.

### Per-User Data Isolation

Every company, application, and tag belongs to a user. Controllers use Pundit policy scopes such as `policy_scope(Application)` so records are filtered at the database query level. The API also validates that submitted `company_id` and `tag_ids` belong to the current user.

### JWT With JTI Revocation

The app uses stateless JWT authentication for API requests. To support logout, each user has a `jti` value. Logging out rotates the JTI, causing previously issued tokens to fail validation.

### Rails 8 "Solid" Architecture

In production, the app leverages the new Rails 8 **Solid Cache**, **Solid Queue**, and **Solid Cable** adapters. This allows background processing and caching to persist directly in the PostgreSQL database, eliminating the need for Redis while maintaining professional-grade performance and reliability.

### Kanban Sparse Positioning

Cards are ordered with an integer `position` and a `POSITION_STEP` of `1024`. Moving a card usually inserts it between neighboring positions instead of renumbering the whole column. When gaps become too small, the backend rebalances the column.

### Optimistic Board Updates

The frontend updates the TanStack Query cache immediately when a card is dragged. If the backend move request fails, the previous cache snapshot is restored. This makes the board feel responsive without giving up server authority over final ordering.

### Focused Test Strategy

The backend leans on request specs for end-to-end API behavior: auth, authorization, filtering, pagination, status movement, and JSON response shape. The frontend tests hooks, route guards, HTTP interceptors, board helper logic, and user-visible component states.

## Backend Overview

The Rails API exposes auth, companies, applications, Kanban movement, notes, and tags as JSON endpoints. It owns the backend contract, security model, database constraints, and deployment requirements.

For backend-specific details, use [api/README.md](api/README.md) as the source of truth. It documents:

- routes and request behavior
- auth and JWT revocation
- Pundit authorization strategy
- database/domain model
- application filtering and pagination
- Kanban move algorithm
- API setup, tests, env vars, CI, and deployment

Keeping those details in the API README avoids drift between the monorepo overview and the backend service docs.

## Local Development

### Prerequisites

- Ruby matching `api/.ruby-version`
- PostgreSQL
- Node 22+
- npm

### Setup

```bash
cd api
bundle install
bin/rails db:create db:migrate db:seed
```

```bash
cd ../web
npm install
```

Copy environment examples if needed:

```bash
cd ..
cp api/.env.example api/.env
cp web/.env.example web/.env
```

Start both apps in separate terminals:

```bash
cd api
bin/rails s
```

```bash
cd web
npm run dev
```

Open:

```text
http://localhost:5173
```

The API runs on:

```text
http://localhost:3000
```

## Demo Credentials

Seed data creates:

```text
demo@example.com / password123
scoped@example.com / password123
```

Use both accounts to verify that each user only sees their own companies, applications, notes, and tags.

## Test and Quality Commands

### API

```bash
cd api
bundle exec rspec
bin/rubocop
bin/brakeman --quiet --no-pager
bin/bundler-audit check
```

### Web

```bash
cd web
npm run lint
npm run test:coverage
npm run typecheck
npm run build
```

## CI

GitHub Actions runs two jobs.

API job:

- PostgreSQL 16 service
- `bundle exec rspec`
- `bin/rubocop`
- `bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error`
- `bin/bundler-audit check`

Web job:

- Node 22
- `npm ci`
- `npm run lint`
- `npm run test:coverage`
- `npm run typecheck`
- `npm run build`

## Deployment

### Recommended Git Workflow

Use a focused deployment-readiness branch:

```bash
git switch -c deploy/resume-demo-readiness
```

Suggested commit groups:

- `fix: prepare api production deployment config`
- `feat: add guarded production demo seed task`
- `feat: complete application creation demo flow`
- `docs: document resume demo deployment`

Deployment templates are included for both services:

- **Render Blueprint**: `render.yaml` (Recommended for full multi-service stack)
- Fly.io API template: `api/fly.toml`
- Vercel SPA rewrites: `web/vercel.json`

### Deployment via Render (Recommended)

This project includes a `render.yaml` Blueprint that automates the creation of a professional infrastructure:

1. Connect your GitHub repo to **Render**.
2. Select the **Blueprint** option.
3. Render will provision:
   - **PostgreSQL Database**
   - **Rails 8 API** (Dockerized)
   - **Background Worker** (for Solid Queue processing)
   - **React Static Site**
4. Set the `RAILS_MASTER_KEY` environment variable from `api/config/master.key`.

### API on Fly.io

From the API directory:

```bash
cd api
fly apps create APP_NAME
fly postgres create --name APP_NAME-db --region sjc
fly postgres attach APP_NAME-db --app APP_NAME
fly secrets set RAILS_MASTER_KEY=... DEVISE_JWT_SECRET_KEY=... CORS_ALLOWED_ORIGINS=https://YOUR-WEB.vercel.app
fly deploy
```

Fly Postgres attach provides `DATABASE_URL`; production is configured to use that single primary database for this demo. Required Fly secrets:

```text
RAILS_MASTER_KEY
DEVISE_JWT_SECRET_KEY
CORS_ALLOWED_ORIGINS
```

After deployment, seed the deterministic public demo data only when intentional:

```bash
fly ssh console --app APP_NAME -C "cd /rails && ALLOW_DEMO_SEED=1 bundle exec rails demo:seed"
```

### Web on Vercel

Create the Vercel project from the monorepo root and set:

```text
Root Directory: web
VITE_API_BASE_URL=https://APP_NAME.fly.dev
```

Set the Fly secret `CORS_ALLOWED_ORIGINS` to the deployed Vercel URL, for example:

```bash
fly secrets set CORS_ALLOWED_ORIGINS=https://YOUR-WEB.vercel.app --app APP_NAME
```

The Vercel rewrite in `web/vercel.json` sends all routes to `index.html`, which is required for the React SPA when users refresh protected routes like `/board`.

## Trade-Offs and Future Improvements

Current trade-offs:

- JWTs are stored in localStorage for simplicity. For a higher-security production app, HttpOnly cookies with CSRF protection would be worth considering.
- Search uses PostgreSQL `ILIKE`, which is fine for this scope. At larger scale, PostgreSQL full-text search or trigram indexes would be better.
- The board fetches at most 100 applications for usability and rendering performance. The table view is the better interface for larger result sets.
- Production deployment uses **Render Blueprints** to manage a professional multi-service stack (Web + API + Background Worker + PostgreSQL).

High-value next improvements:

- Add one Playwright end-to-end test for login, create company, create application, move card, and add note.
- Add follow-up reminders using background jobs and the existing `reminder_sent` event type.
- Add resume/version attachment support with Active Storage and object storage.

## Interview Talking Points

If discussing this project in an interview, the strongest technical areas are:

- Why Rails API mode and React SPA are separated.
- How Pundit scopes prevent cross-user data leaks.
- How Devise JWT and JTI revocation work.
- Why the board uses sparse positions instead of simple sequential ordering.
- How optimistic updates are implemented and rolled back.
- How request specs prove API behavior across auth, authorization, validation, and JSON responses.
- How CI protects quality with tests, linting, typechecking, build checks, and security scanners.

## Additional Documentation

- `PROJECT_DEEP_DIVE_FOR_JUNIORS.md` explains the project for a junior developer joining the codebase.
- `INTERVIEW_QUESTION_BANK.md` contains project-specific interview questions and answer outlines.
- `plan.md` records the original build plan and milestone checklist.
