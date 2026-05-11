import { applicationStatuses, type ApplicationStatus } from "./model";
import type { ApplicationsFilters } from "./api";

const statuses = new Set<ApplicationStatus>(applicationStatuses);

function parseNumber(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeFiltersFromSearch(search: Record<string, unknown>): ApplicationsFilters {
  const status = typeof search.status === "string" && statuses.has(search.status as ApplicationStatus)
    ? (search.status as ApplicationStatus)
    : undefined;
  const q = typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined;
  const remote = search.remote === "true" ? true : search.remote === "false" ? false : undefined;

  const page = parseNumber(search.page);
  const per_page = parseNumber(search.per_page);

  return {
    status,
    q,
    tag: parseNumber(search.tag),
    company: parseNumber(search.company),
    remote,
    page: page !== undefined && page > 0 ? page : undefined,
    per_page: per_page !== undefined && per_page > 0 ? per_page : undefined
  };
}

export function toSearchFilters(filters: ApplicationsFilters) {
  const search: Record<string, string | number | boolean> = {};

  if (filters.status) search.status = filters.status;
  if (filters.q) search.q = filters.q;
  if (filters.tag !== undefined) search.tag = filters.tag;
  if (filters.remote !== undefined) search.remote = filters.remote;
  if (filters.company !== undefined) search.company = filters.company;
  if (filters.page !== undefined) search.page = filters.page;
  if (filters.per_page !== undefined) search.per_page = filters.per_page;

  return search;
}

