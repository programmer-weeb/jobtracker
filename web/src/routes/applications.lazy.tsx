import { createLazyRoute } from "@tanstack/react-router";
import { ApplicationsPage } from "../features/applications/list-page";

export const Route = createLazyRoute("/authenticated/applications")({
  component: ApplicationsPage
});
