import { http } from "../../lib/http";
import type {
  ApplicationResponse,
  ApplicationStatus,
  ApplicationsResponse,
  NoteResponse,
  TagsResponse
} from "./model";

export interface ApplicationsFilters extends Record<string, string | number | boolean | undefined> {
  status?: string;
  q?: string;
}

export interface MoveApplicationInput {
  id: number;
  status: ApplicationStatus;
  position: number;
}

export interface UpdateApplicationInput {
  id: number;
  application: {
    company_id?: number;
    title?: string;
    status?: ApplicationStatus;
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

export async function moveApplication(input: MoveApplicationInput) {
  const { data } = await http.patch<ApplicationsResponse["data"][number]>(`/applications/${input.id}/move`, {
    application: {
      status: input.status,
      position: input.position
    }
  });
  return data;
}

export async function fetchTags() {
  const { data } = await http.get<TagsResponse>("/tags");
  return data;
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
