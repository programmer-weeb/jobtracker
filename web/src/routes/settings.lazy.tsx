import { createLazyRoute } from "@tanstack/react-router";
import { SettingsPage } from "../features/auth/settings-page";

export const Route = createLazyRoute("/authenticated/settings")({
  component: SettingsPage
});
