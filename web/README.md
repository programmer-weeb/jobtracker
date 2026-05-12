# JobTracker Web

React 19 frontend for JobTracker, a portfolio-grade job application tracker. This Single Page Application (SPA) provides a highly interactive Kanban board, searchable data tables, and real-time-feeling updates via optimistic UI patterns.

## Tech Stack

- **React 19**: Utilizing the latest features and performance improvements.
- **TypeScript**: Ensuring type safety across routes, API responses, and component props.
- **TanStack Router**: Type-safe routing with nested layouts and search param validation.
- **TanStack Query (v5)**: Robust server-state management, caching, and optimistic updates.
- **Tailwind CSS 4**: Modern, high-performance styling using the new Vite plugin.
- **dnd-kit**: Complex drag-and-drop logic for the Kanban board.
- **React Hook Form + Zod**: Type-safe form validation and handling.
- **Axios**: Customized HTTP client with JWT interceptors.
- **Lucide React**: Consistent and accessible iconography.
- **Radix UI**: Unstyled, accessible UI primitives.

## Key Frontend Features

### Type-Safe Routing
The app uses **TanStack Router** to ensure that links, navigation, and search parameters are verified at compile-time. This prevents "broken links" and ensures that filters (like status or company) are always valid.

### Server State & Caching
**TanStack Query** acts as the "source of truth" for server data. It handles:
- **Automatic Revalidation**: Data stays fresh when moving cards or adding notes.
- **Query Keys**: Centralized key management in `src/lib/query-keys.ts`.
- **Global Error Handling**: Integrated with a global Error Boundary and toast notifications.

### Optimistic UI
When moving a job application on the Kanban board, the UI updates **instantly**.
1. The `onMutate` handler snapshots the current state.
2. The UI is updated immediately to the new position.
3. If the API request fails, the `onError` handler automatically rolls back the UI to the previous state and notifies the user.

### Complex Drag-and-Drop
Built with **@dnd-kit**, the Kanban board supports:
- Moving cards within and between columns.
- Sorting cards based on the backend's sparse positioning algorithm.
- Accessible keyboard and screen-reader support for drag-and-drop.

## Project Structure

```text
src/
├── app/            # Global providers, router, and query client setup
├── components/     # Shared UI components (Button, Input, Card, etc.)
├── features/       # Feature-based organization (the "Core" of the app)
│   ├── applications/ # Application details and forms
│   ├── auth/         # Login, Signup, and Auth Context
│   ├── board/        # Kanban board implementation and dnd-kit logic
│   └── companies/    # Company management
├── lib/            # Utility functions, axios config, and env helpers
├── routes/         # TanStack Router route definitions
└── styles/         # Tailwind CSS entry and global themes
```

## Local Development

### Prerequisites
- Node.js 22+
- npm

### Setup
```bash
npm install
```

### Environment
Copy `.env.example` to `.env` and set:
```text
VITE_API_BASE_URL=http://localhost:3000
```

### Run
```bash
npm run dev
```

## Testing and Quality

The project maintains high standards via automated checks:

- **Unit/Integration Tests**: Powered by **Vitest** and **React Testing Library**.
- **Linting**: Strict **ESLint** rules for React and TypeScript.
- **Typechecking**: `tsc` runs on every CI build to ensure zero type errors.

```bash
npm run lint
npm run test:coverage
npm run typecheck
```

## Interview Talking Points

- **Optimistic Updates**: How to handle race conditions and rollbacks when the network is unstable.
- **Server vs. Client State**: When to use TanStack Query vs. React `useState`.
- **Type-Safe Routing**: The benefits of catching routing errors during development rather than in production.
- **Component Composition**: How Radix UI primitives are used to build accessible custom components.
- **Frontend Performance**: Using Vite and React 19 for fast load times and minimal re-renders.
