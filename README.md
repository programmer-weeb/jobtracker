# Job Application Tracker

**Live demo:** https://jobtracker-web-tpx8.onrender.com/

![Rails](https://img.shields.io/badge/Rails-8-CC0000?logo=rubyonrails) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Coverage API](https://img.shields.io/badge/api%20coverage-91.9%25-brightgreen) ![Coverage Web](https://img.shields.io/badge/web%20coverage-88.3%25-brightgreen)

I built this tracker to manage my own job applications while trying out Rails 8. It handles the usual stuff—Kanban board, searchable tables, notes—but the focus was really on seeing how a modern Rails API feels with React 19.

## The Stack

The app uses a Rails 8 backend and a React 19 frontend. I'm using Devise with JWT for auth, Pundit for user isolation, and dnd-kit for the board logic. On the infra side, I'm using the new "Solid" adapters in Rails 8 (Cache, Queue) to keep everything in Postgres and skip Redis.

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

## Some interesting parts

### Skipping Redis with Rails 8
One of the best parts of Rails 8 is the shift toward "Solid" adapters. I'm using Solid Cache and Solid Queue, which means caching and background jobs live in Postgres. It makes the deployment much simpler since I only have one database to manage.

### Drag-and-drop that doesn't lag
Moving cards on a board can be heavy if the API is slow. I implemented optimistic updates on the frontend, so cards move instantly and only roll back if the server errors out. On the backend, I used sparse positioning (step by 1024) to keep move operations fast without re-ordering the whole database.

### Data isolation
Since this is a multi-user app, I used Pundit policy scopes to filter records at the database level. Every query for companies or applications is scoped to the current user, so there's no risk of data leaking between accounts.

## Local Setup

You'll need Ruby 3.3+, Node 22+, and Postgres.

### Backend
```bash
cd api
bundle install
bin/rails db:prepare db:seed
bin/rails s
```

### Frontend
```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Login with `demo@example.com` / `password123`.

## Deployment

I've included a `render.yaml` blueprint. It sets up the whole stack on Render (API, static site, worker, and DB) in one go. You'll just need to provide your `RAILS_MASTER_KEY`.

If you're deploying elsewhere, check `api/fly.toml` for Fly.io or `web/vercel.json` for Vercel.
