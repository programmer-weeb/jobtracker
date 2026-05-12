import { createLazyRoute } from "@tanstack/react-router";
import { ApplicationDetailPage } from "../features/applications/detail-page";

export const Route = createLazyRoute("/authenticated/applications/$id")({
  component: ApplicationDetailPage
});
