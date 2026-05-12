# JobTracker Web

This is the React 19 frontend for JobTracker. I wanted to build something that felt like a local app—fast, type-safe, and zero spinners.

## The Stack

- **React 19** with **TypeScript**
- **TanStack Router** & **Query** (v5)
- **Tailwind CSS 4**
- **dnd-kit** for the board logic
- **Vitest** for unit and integration tests

## Implementation Highlights

### End-to-end Type Safety
I'm using TanStack Router to keep everything type-safe. It validates search params and routes at compile-time, so I don't have to worry about broken internal links. I've also typed the API responses to match the backend, which catches a lot of bugs before I even hit refresh.

### Zero-lag Board Moves
When you drag an application to a new column, it moves instantly. I used TanStack Query's optimistic update pattern (`onMutate`) to snapshot the current state and update the UI immediately. If the backend move fails for some reason, the UI just snaps back to where it was.

### Complex Drag-and-Drop
The Kanban board is built with `dnd-kit`. It handles the messy parts of moving cards between columns and interacts with the backend's sparse positioning logic to keep the database updates minimal.

### Global Error States
I integrated a global error boundary and toast notifications so the user is never left guessing. If an API call fails or a route crashes, the app shows a clear message instead of just hanging.

## Development

1. `npm install`
2. `cp .env.example .env`
3. `npm run dev`

Open `http://localhost:5173`. Make sure the API is running on port 3000.

### Useful Commands
- `npm run lint`: Check for style and code issues.
- `npm run test`: Run the Vitest suite.
- `npm run typecheck`: Run TSC across the project.
- `npm run build`: Build for production.

## Project Layout
Everything is organized by feature in `src/features/`. Each folder (auth, board, applications) has its own components, logic, and types. General UI pieces like buttons and inputs live in `src/components/`.
