import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { ApplicationDetailPage } from "../features/applications/detail-page";
import { queryKeys } from "../lib/query-keys";
import { fetchApplication, fetchTags } from "../features/applications/api";

export const applicationDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/applications/$id",
  loader: async ({ context: { queryClient }, params: { id } }) => {
    const applicationId = Number(id);
    
    // ensureQueryData fetches only if data is stale or missing
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.applicationDetail(applicationId),
        queryFn: () => fetchApplication(applicationId)
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.tags,
        queryFn: fetchTags
      })
    ]);
  },
  component: ApplicationDetailPage
});
