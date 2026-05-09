import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { SettingsPage } from "../features/auth/settings-page";

export const settingsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/settings",
  component: SettingsPage
});
