import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

export interface RouterContext {
  auth: {
    hydrated: boolean;
    isAuthenticated: boolean;
  };
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />
});
