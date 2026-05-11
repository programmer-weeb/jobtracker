import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

export interface RouterContext {
  queryClient: QueryClient;
  auth: {
    hydrated: boolean;
    isAuthenticated: boolean;
  };
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />
});
