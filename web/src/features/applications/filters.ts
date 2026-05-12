import { z } from "zod";
import { applicationStatuses } from "./model";

const applicationStatusSchema = z.enum(applicationStatuses);

export const applicationsFiltersSchema = z.object({
  status: z.array(applicationStatusSchema).optional(),
  q: z.string().optional(),
  tag: z.array(z.number()).optional(),
  company: z.array(z.number()).optional(),
  remote: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional()
});

export type ApplicationsFilters = z.infer<typeof applicationsFiltersSchema>;

/**
 * Normalizes search params from the URL into the type-safe ApplicationsFilters object.
 * This is used by TanStack Router's validateSearch.
 */
export function normalizeFiltersFromSearch(search: Record<string, unknown>): ApplicationsFilters {
  const parsePositiveIntArray = (value: unknown): number[] | undefined => {
    if (value === undefined) return undefined;
    const values = Array.isArray(value) ? value : [value];
    const parsed = values
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0);
    return parsed.length > 0 ? parsed : undefined;
  };

  const parsePositiveInt = (value: unknown): number | undefined => {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  };

  const statusValues = Array.isArray(search.status)
    ? search.status
    : search.status !== undefined
      ? [search.status]
      : [];
  const status = statusValues
    .map((item) => String(item))
    .filter((item): item is typeof applicationStatuses[number] => applicationStatuses.includes(item as typeof applicationStatuses[number]));
  const qValue = typeof search.q === "string" ? search.q.trim() : "";

  return applicationsFiltersSchema.parse({
    status: status.length > 0 ? status : undefined,
    q: qValue || undefined,
    tag: parsePositiveIntArray(search.tag),
    company: parsePositiveIntArray(search.company),
    remote:
      search.remote === "true" || search.remote === true
        ? true
        : search.remote === "false" || search.remote === false
          ? false
          : undefined,
    page: parsePositiveInt(search.page),
    per_page: parsePositiveInt(search.per_page)
  });
}

/**
 * Converts filters back to a plain object for use in search params.
 */
export function toSearchFilters(filters: ApplicationsFilters) {
  return normalizeFiltersFromSearch(filters as Record<string, unknown>);
}
