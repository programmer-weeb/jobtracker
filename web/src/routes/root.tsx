import { Outlet, createRootRoute } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <div className="app-shell">
      <header className="app-header">
        <h1>Job Application Tracker</h1>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
});
