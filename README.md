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

## Next Implementation Slice

- Auth (Devise JWT) setup and request specs.
- Core models/migrations (`Company`, `Application`, `Tag`, `Note`, `Event`).
- Pundit policies + CRUD endpoints.
