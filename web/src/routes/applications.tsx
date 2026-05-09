import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "./authenticated";
import { ApplicationsPage } from "../features/applications/list-page";
import { applicationStatuses, type ApplicationStatus } from "../features/applications/model";

const statuses = new Set<ApplicationStatus>(applicationStatuses);

export const applicationsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/applications",
  validateSearch: (search: Record<string, unknown>) => {
    const status = typeof search.status === "string" && statuses.has(search.status as ApplicationStatus)
      ? (search.status as ApplicationStatus)
      : undefined;

    const q = typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined;

    const parseNumber = (value: unknown) => {
      if (typeof value !== "string" || !value.trim()) {
        return undefined;
      }

      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const remote =
      search.remote === "true"
        ? true
        : search.remote === "false"
          ? false
          : undefined;

    return {
      status,
      q,
      tag: parseNumber(search.tag),
      company: parseNumber(search.company),
      remote
    };
  },
  component: ApplicationsPage
});
