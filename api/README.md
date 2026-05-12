# JobTracker API

This is the Rails 8 backend for the JobTracker app. It manages the data, authentication, and the move logic for the Kanban board.

## The Setup

- **Rails 8.1** (API mode)
- **Postgres** for everything (Data, Cache, and Queue)
- **Devise + JWT** for stateless auth
- **Pundit** for scoped data access
- **RSpec** (mostly request specs)

## Implementation Details

### Stateless Auth with JTI
I used `devise-jwt` with a JTI (JSON Token Identifier) matcher. When you log in, you get a token. When you log out, the app rotates your JTI in the database. This instantly kills any existing tokens without needing to track them in a blacklist or store sessions.

### Scoped Data Access
To prevent users from seeing each other's data, I rely on Pundit's `policy_scope`. Every query for applications, companies, or tags is automatically filtered by `user_id` at the database level. It's safer than manually adding `.where(user: current_user)` to every controller action.

### Kanban Board Positioning
Moving cards uses sparse integer positioning (stepping by 1024). When a card moves, I calculate the midpoint between its new neighbors. This means most moves only update one record. If the gaps between cards get too small, the backend rebalances the column automatically.

### Events Timeline
Actions like status changes or adding notes create `Event` records. This powers the activity timeline on the frontend so you can see exactly when you applied or moved an application.

## Local Development

1. `bundle install`
2. `bin/rails db:prepare db:seed`
3. `bin/rails s`

Run `bundle exec rspec` to check the API specs. I've also included RuboCop and Brakeman for linting and security.

## Production Note
I'm using Rails 8's "Solid" adapters (Solid Cache and Solid Queue). They store everything in the Postgres database, so you don't need a Redis instance. It keeps the infrastructure simple and cheap for a demo app.
