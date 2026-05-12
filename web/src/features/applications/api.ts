import { http } from "../../lib/http";
import type { ApplicationsFilters } from "./filters";
import type {
  ApplicationResponse,
  ApplicationStatus,
  ApplicationsResponse,
  NoteResponse,
  TagSummary,
  TagsResponse
} from "./model";

export interface MoveApplicationInput {
  id: number;
  status: ApplicationStatus;
  position: number;
}

export interface CreateApplicationInput {
  company_id: number;
  title: string;
  status: ApplicationStatus;
  source?: string | null;
  remote: boolean;
  location?: string | null;
  tag_ids?: number[];
}

export interface UpdateApplicationInput {
  id: number;
  application: {
    company_id?: number;
    title?: string;
    source?: string | null;
    salary_min?: number | null;
    salary_max?: number | null;
    currency?: string | null;
    remote?: boolean;
    location?: string | null;
    url?: string | null;
    applied_at?: string | null;
    tag_ids?: number[];
  };
}

export function normalizeApplicationFilters(filters: ApplicationsFilters = {}): ApplicationsFilters {
  const normalized: ApplicationsFilters = {};

  if (filters.status) {
    const status = filters.status.filter(Boolean);
    if (status.length > 0) {
      normalized.status = status;
    }
  }

  if (filters.q && filters.q.trim()) normalized.q = filters.q.trim();

  if (filters.tag !== undefined) {
    const tag = filters.tag.filter((t) => t !== undefined);
    if (tag.length > 0) {
      normalized.tag = tag;
    }
  }

  if (filters.remote !== undefined) normalized.remote = filters.remote;

  if (filters.company !== undefined) {
    const company = filters.company.filter((c) => c !== undefined);
    if (company.length > 0) {
      normalized.company = company;
    }
  }

  if (filters.page !== undefined && filters.page !== 1) normalized.page = filters.page;
  if (filters.per_page !== undefined && filters.per_page !== 25) normalized.per_page = filters.per_page;

  return normalized;
}

export async function fetchApplications(filters: ApplicationsFilters = {}) {
  const { data } = await http.get<ApplicationsResponse>("/applications", { params: filters });
  return data;
}

export async function fetchApplication(id: number) {
  const { data } = await http.get<ApplicationResponse>(`/applications/${id}`);
  return data;
}

export async function updateApplication(input: UpdateApplicationInput) {
  const { data } = await http.patch<ApplicationResponse>(`/applications/${input.id}`, {
    application: input.application
  });
  return data;
}

export async function createApplication(input: CreateApplicationInput) {
  const { data } = await http.post<ApplicationResponse>("/applications", {
    application: input
  });
  return data;
}

export async function moveApplication(input: MoveApplicationInput) {
  const { data } = await http.patch<ApplicationResponse>(`/applications/${input.id}/move`, {
    application: {
      status: input.status,
      position: input.position
    }
  });
  return data.data;
}

export async function fetchTags() {
  const { data } = await http.get<TagsResponse>("/tags");
  return data;
}

export async function createTag(input: { name: string; color: string }) {
  const { data } = await http.post<{ data: TagSummary }>("/tags", {
    tag: input
  });
  return data;
}

export async function deleteTag(id: number) {
  await http.delete(`/tags/${id}`);
}

export async function createNote(applicationId: number, body: string) {
  const { data } = await http.post<NoteResponse>(`/applications/${applicationId}/notes`, {
    note: { body }
  });
  return data;
}

export async function deleteNote(id: number) {
  await http.delete(`/notes/${id}`);
}
