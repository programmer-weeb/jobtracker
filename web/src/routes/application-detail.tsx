import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { ApplicationDetailPage } from "../features/applications/detail-page";

export const applicationDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/applications/$id",
  component: ApplicationDetailPage
});
