# Job Application Tracker

Monorepo for portfolio project: Rails API + React frontend for tracking job applications with kanban workflow.

## Structure

```text
.
├── api/    # Rails 8 API
├── web/    # React + Vite + TypeScript
└── plan.md
```

## Quick Start

1. `cd api && bundle install`
2. `cd ../web && npm install`
3. `cd .. && cp api/.env.example api/.env && cp web/.env.example web/.env`

Then run API and web dev servers in separate terminals:

- `cd api && bin/rails s`
- `cd web && npm run dev`

## Current Status

- Week 1 Day 1-2 started.
- API scaffold exists with route map, CORS config, and RSpec baseline.
- Web scaffold exists with React 19 + TanStack Query + TanStack Router shell.
- Root GitHub Actions workflow added for API RSpec and web lint/test.

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

## Next Implementation Slice

- Auth (Devise JWT) setup and request specs.
- Core models/migrations (`Company`, `Application`, `Tag`, `Note`, `Event`).
- Pundit policies + CRUD endpoints.
