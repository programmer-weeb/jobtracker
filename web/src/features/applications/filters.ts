import { z } from "zod";
import { applicationStatuses, type ApplicationStatus } from "./model";

export const applicationsFiltersSchema = z.object({
  status: z.array(z.enum(applicationStatuses as [string, ...string[]])).optional(),
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
  return applicationsFiltersSchema.parse({
    ...search,
    // Handle cases where single values might come as strings but schema expects arrays
    status: search.status ? (Array.isArray(search.status) ? search.status : [search.status]) : undefined,
    tag: search.tag ? (Array.isArray(search.tag) ? search.tag.map(Number) : [Number(search.tag)]) : undefined,
    company: search.company ? (Array.isArray(search.company) ? search.company.map(Number) : [Number(search.company)]) : undefined,
    remote: search.remote === "true" || search.remote === true ? true : search.remote === "false" || search.remote === false ? false : undefined,
    page: search.page ? Number(search.page) : undefined,
    per_page: search.per_page ? Number(search.per_page) : undefined
  });
}

/**
 * Converts filters back to a plain object for use in search params.
 */
export function toSearchFilters(filters: ApplicationsFilters) {
  return filters;
}

