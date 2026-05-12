import type { ApplicationsFilters } from "../features/applications/filters";

export const queryKeys = {
  me: ["me"] as const,
  companies: ["companies"] as const,
  tags: ["tags"] as const,
  applicationDetail: (id: number) => ["applications", "detail", id] as const,
  applications: (filters?: ApplicationsFilters) =>
    ["applications", filters ?? {}] as const
};
