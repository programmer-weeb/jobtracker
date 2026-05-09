import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <p>Board route scaffolded. Kanban implementation next milestone.</p>
});
