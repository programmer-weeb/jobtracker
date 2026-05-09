# Job Application Tracker

Visual job application tracker with kanban board, built as a portfolio piece.

Monorepo for portfolio project: Rails API + React frontend for tracking job applications with kanban workflow.

## Why I built this

I was applying to engineering roles in 2026 and wanted a single place to track applications, interviews, and notes — built it as a portfolio piece showcasing a Rails 8 API with full RSpec coverage and a React 19 + TanStack Query frontend with optimistic kanban drag-drop.

## Structure

```text
.
├── api/    # Rails 8 API
├── web/    # React + Vite + TypeScript
└── plan.md
```

## Architecture

```
┌────────────┐    HTTPS/JWT     ┌──────────────┐
│ React 19   │ ───────────────▶ │  Rails 8 API │
│ TanStack   │                  │  Devise+JWT  │
│ + dnd-kit  │ ◀─────────────── │  Pundit      │
└────────────┘     JSON         └──────┬───────┘
                                       │
                                ┌──────▼───────┐
                                │ PostgreSQL   │
                                └──────────────┘
```

<!-- TODO: hero GIF of kanban drag -->

## Quick Start

1. `cd api && bundle install`
2. `cd ../web && npm install`
3. `cd .. && cp api/.env.example api/.env && cp web/.env.example web/.env`

Then run API and web dev servers in separate terminals:

- `cd api && bin/rails s`
- `cd web && npm run dev`

## Demo Credentials

- `demo@example.com / password123`
- `scoped@example.com / password123`

## Seeds

- Run `cd api && bin/rails db:seed` to load demo/scoped users and sample records.

## API Contract Notes

- `GET /applications` filter behavior:
  - Unknown `status` value is ignored.
  - Blank/whitespace `q` is ignored.
  - Non-numeric `company` or `tag` is ignored.
  - `remote` accepts only `true|1|false|0` (case-insensitive); invalid values are ignored.
  - All valid filters combine with intersection semantics.
  - Responses always scoped to `current_user` records.
- `PATCH /applications/:id/move` validation behavior:
  - Missing `application` payload returns `422` with `errors`.
  - Missing/invalid `status` returns `422` with `errors`.
  - Missing/non-numeric/negative `position` returns `422` with `errors`.
  - Unauthorized access to another user's application returns `404`.

## Test Commands

- API:
  - `cd api && bundle exec rspec`
  - `cd api && bin/rubocop`
  - `cd api && bin/brakeman --quiet --no-pager`
  - `cd api && bin/bundler-audit check`
- Web:
  - `cd web && npm run lint`
  - `cd web && npm run test:coverage`
  - `cd web && npm run typecheck`
  - `cd web && npm run build`

## Deploy

### Environment Variables Required

Both API and Web deployments require the following environment variables:

**API (Fly.io)**
- `DATABASE_URL` - PostgreSQL connection string
- `DEVISE_JWT_SECRET_KEY` - Generate with `rails secret`
- `RAILS_MASTER_KEY` - From `config/master.key`
- `CORS_ALLOWED_ORIGINS` - Web frontend URL (e.g., `https://jobtracker.vercel.app`)

**Web (Vercel)**
- `VITE_API_BASE_URL` - API base URL (e.g., `https://jobtracker.fly.dev`)

### Deployment Templates

- **API**: See `api/fly.toml` for Fly.io configuration
- **Web**: See `web/vercel.json` for Vercel SPA rewrites

### Deploy Steps

1. **API (Rails on Fly.io)**
   - Update `api/fly.toml` with app name and region
   - Run `fly apps create APP_NAME`
   - Run `fly postgres create --name APP_NAME-db`
   - Run `fly postgres attach APP_NAME-db --app APP_NAME`
   - Set environment variables: `fly secrets set DEVISE_JWT_SECRET_KEY=... CORS_ALLOWED_ORIGINS=...`
   - Deploy: `fly deploy`

2. **Web (React on Vercel)**
   - Connect GitHub repo to Vercel
   - Configure root directory: `web`
   - Set environment variable: `VITE_API_BASE_URL=https://API_URL.fly.dev`
   - Deploy on push to main
