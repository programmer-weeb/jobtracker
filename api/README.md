# JobTracker API

Rails 8 API backend for JobTracker, a portfolio-grade job application tracker. This service owns authentication, authorization, persistence, filtering, Kanban movement, notes, tags, timeline events, and JSON API responses for the React frontend.

## What This API Demonstrates

- **API-only Rails architecture** with JSON responses and no server-rendered UI.
- **JWT authentication** with Devise and devise-jwt.
- **Token revocation** through Devise JWT `JTIMatcher`.
- **Per-user authorization** with Pundit policies and policy scopes.
- **Relational database design** using PostgreSQL, foreign keys, indexes, and uniqueness constraints.
- **Secure association handling** so users cannot attach records to another user's companies or tags.
- **Kanban ordering logic** using sparse integer positions and rebalancing.
- **Transactional writes** for operations that create multiple related records.
- **Search, filtering, and pagination** for application listing.
- **Rate limiting** on login and signup with Rack::Attack.
- **Test coverage and CI quality gates** with RSpec, SimpleCov, RuboCop, Brakeman, and bundler-audit.

## Tech Stack

| Tool | Purpose |
|---|---|
| Rails 8.1 | API framework |
| PostgreSQL | Database |
| Devise | User accounts and password authentication |
| devise-jwt | JWT authentication for API requests |
| Pundit | Authorization |
| Rack CORS | Browser cross-origin API access |
| Rack::Attack | Auth endpoint throttling |
| Solid Cache / Queue / Cable | Rails database-backed adapters |
| RSpec | Test framework |
| FactoryBot | Test data factories |
| Shoulda Matchers | Model spec matchers |
| SimpleCov | Coverage enforcement |
| RuboCop | Ruby linting/style |
| Brakeman | Rails security scanning |
| bundler-audit | Gem vulnerability scanning |

## Domain Model

```text
User
  ├── has many Companies
  ├── has many Applications
  └── has many Tags

Company
  └── has many Applications

Application
  ├── belongs to User
  ├── belongs to Company
  ├── has many Notes
  ├── has many Events
  └── has many Tags through ApplicationTags

Tag
  └── has many Applications through ApplicationTags

Note
  └── belongs to Application

Event
  └── belongs to Application
```

Core application statuses:

```text
wishlist
applied
interview
offer
rejected
archived
```

Important database protections:

- Companies are unique per user by `(user_id, name)`.
- Tags are unique per user by `(user_id, name)`.
- An application cannot receive the same tag twice because `(application_id, tag_id)` is unique.
- Foreign keys protect relationships between users, companies, applications, notes, tags, and events.
- Application queries are supported by indexes such as `(user_id, status)` and `(status, position)`.

## API Surface

### Auth

```text
POST   /auth/signup
POST   /auth/login
DELETE /auth/logout
GET    /auth/me
```

### Companies

```text
GET    /companies
POST   /companies
GET    /companies/:id
PATCH  /companies/:id
DELETE /companies/:id
```

### Applications

```text
GET    /applications
POST   /applications
GET    /applications/:id
PATCH  /applications/:id
DELETE /applications/:id
PATCH  /applications/:id/move
```

### Notes and Tags

```text
POST   /applications/:id/notes
DELETE /notes/:id

GET    /tags
POST   /tags
DELETE /tags/:id
```

Implementation note: Rails route helpers may generate conventional `edit` routes because the resources use `except: :new`. The JSON API contract above is the intended surface for consumers.

## Authentication Flow

1. Client sends `POST /auth/login` or `POST /auth/signup`.
2. Devise validates credentials or creates the user.
3. The API returns the user payload in JSON.
4. The API also sets:

```text
Authorization: Bearer <jwt>
```

5. The client sends that token on later requests.
6. Devise JWT verifies the token and sets `current_user`.

Logout rotates the user's `jti`:

```ruby
current_user.update!(jti: SecureRandom.uuid)
```

That invalidates previously issued tokens because their embedded JTI no longer matches the database.

## Authorization Strategy

Authentication proves who the user is. Authorization decides what that user can access.

This API uses Pundit policies:

- `ApplicationPolicy`
- `CompanyPolicy`
- `TagPolicy`
- `NotePolicy`

The most important pattern is policy scoping:

```ruby
policy_scope(Application)
```

For applications, the scope resolves to:

```ruby
scope.where(user_id: user.id)
```

That means a controller query only returns the current user's records. Notes are scoped through their parent applications because notes do not have a direct `user_id`.

## Applications Endpoint

`GET /applications` supports:

| Param | Purpose |
|---|---|
| `status` | Filter by application status |
| `company` | Filter by company ID |
| `tag` | Filter by tag ID |
| `remote` | Filter remote or onsite |
| `q` | Search title, source, location, and company name |
| `page` | Page number |
| `per_page` | Page size |

Behavior:

- Invalid status values are ignored.
- Blank search strings are ignored.
- Non-numeric company and tag IDs are ignored.
- `remote` accepts `true`, `1`, `false`, or `0`.
- Valid filters combine with intersection semantics.
- Results are always scoped to `current_user`.
- Default pagination is `page=1`, `per_page=25`.
- `per_page` is capped at `100`.

Responses use:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 0
  }
}
```

## Kanban Move Endpoint

The board calls:

```text
PATCH /applications/:id/move
```

Payload:

```json
{
  "application": {
    "status": "interview",
    "position": 2
  }
}
```

Here `position` means target index in the destination column. The backend converts that index into a sparse database position.

The move operation:

1. Authorizes the application.
2. Validates status and position.
3. Locks sibling records in the target status.
4. Calculates a position between neighboring cards.
5. Rebalances the column if gaps are exhausted.
6. Updates status and position in a transaction.
7. Creates a `status_changed` event if the status changed.

Sparse ordering uses:

```ruby
POSITION_STEP = 1024
```

This avoids renumbering every card on most drag operations.

## Events and Timeline

Events provide an audit-style activity timeline for applications.

Current event kinds:

```text
status_changed
note_added
reminder_sent
```

Examples:

```json
{ "from": "applied", "to": "interview" }
```

```json
{ "note_id": 123 }
```

`reminder_sent` is already modeled as an event kind, which makes follow-up reminders a natural future feature.

## Security Notes

- Passwords are encrypted by Devise.
- JWTs expire after one day.
- Logout revokes old JWTs with JTI rotation.
- Pundit scopes protect multi-user data.
- Association IDs are validated against `current_user`.
- Rack::Attack throttles `/auth/login` and `/auth/signup` to 10 requests per 60 seconds per IP.
- CORS allows configured origins through `CORS_ALLOWED_ORIGINS`.
- The `Authorization` response header is exposed for the React client.
- Search uses parameterized SQL and `ActiveRecord::Base.sanitize_sql_like`.
- CI runs Brakeman and bundler-audit.

## Local Setup

### Requirements

- Ruby matching `.ruby-version`
- PostgreSQL
- Bundler

### Install

```bash
bundle install
```

### Environment

Copy the example env file if needed:

```bash
cp .env.example .env
```

Important variables:

```text
DATABASE_URL
DEVISE_JWT_SECRET_KEY
CORS_ALLOWED_ORIGINS
RAILS_MASTER_KEY
```

In development, Devise JWT falls back to `Rails.application.secret_key_base` if `DEVISE_JWT_SECRET_KEY` is not provided. Production requires `DEVISE_JWT_SECRET_KEY`.

`config/master.key` and `config/credentials/*.key` are local secrets and must not be committed. Store the rotated Rails master key in a password manager and provide it to deployments through `RAILS_MASTER_KEY`.

### Database

```bash
bin/rails db:create
bin/rails db:migrate
bin/rails db:seed
```

Seed data creates:

```text
demo@example.com / password123
scoped@example.com / password123
```

### Run Server

```bash
bin/rails s
```

Default API URL:

```text
http://localhost:3000
```

Health check:

```text
GET /up
```

## Test and Quality Commands

```bash
bundle exec rspec
bin/rubocop
bin/brakeman --quiet --no-pager
bin/bundler-audit check
```

SimpleCov is configured with:

```ruby
minimum_coverage 85
```

## Test Coverage Areas

Request specs cover:

- Signup, login, logout, and current-user lookup.
- Missing, malformed, expired, and revoked JWTs.
- Rack::Attack throttling.
- Company CRUD and user scoping.
- Application listing, filtering, search, pagination, creation, update, destroy, and move behavior.
- Rejection of another user's company or tag IDs.
- Notes creation/deletion and timeline event creation.
- Tags listing, creation, and deletion.

Model specs cover:

- Associations.
- Validations.
- Enums.
- `applied_at` callback behavior.
- Join-table uniqueness.

## CI

The API job in GitHub Actions:

1. Starts PostgreSQL 16.
2. Sets `RAILS_ENV=test`.
3. Installs gems with bundler cache.
4. Runs RSpec.
5. Runs RuboCop.
6. Runs Brakeman with warnings/errors as failures.
7. Runs bundler-audit.

## Deployment

The API includes a Fly.io template:

```text
fly.toml
```

Required production environment variables:

```text
DATABASE_URL
DEVISE_JWT_SECRET_KEY
RAILS_MASTER_KEY
CORS_ALLOWED_ORIGINS
```

Deploy outline:

```bash
fly apps create APP_NAME
fly postgres create --name APP_NAME-db
fly postgres attach APP_NAME-db --app APP_NAME
fly secrets set RAILS_MASTER_KEY=... DEVISE_JWT_SECRET_KEY=... CORS_ALLOWED_ORIGINS=...
fly deploy
```

## Interview Talking Points

Strong API-specific topics to discuss:

- Why API-only Rails fits a React SPA.
- How Pundit policy scopes prevent cross-user leaks.
- How JWT auth works and why JTI revocation matters.
- How the `/applications/:id/move` endpoint handles Kanban ordering safely.
- Why sparse integer positions are used instead of sequential positions.
- How transactions protect multi-write operations like application creation and note creation.
- How request specs test the real HTTP/API behavior.
- How CI combines tests, linting, and security scanning.

## Known Trade-Offs and Next Improvements

- JWTs are stored by the frontend in localStorage, which is simple but less XSS-resistant than HttpOnly cookies.
- Search currently uses `ILIKE`; larger datasets would benefit from full-text search or trigram indexes.
- The frontend detail form includes status, but the normal update endpoint intentionally does not permit status changes. Board status changes go through `/move`.
- A follow-up reminder feature would fit naturally because `reminder_sent` already exists as an event kind.
- A Playwright end-to-end test could validate the full API plus frontend workflow through the browser.
