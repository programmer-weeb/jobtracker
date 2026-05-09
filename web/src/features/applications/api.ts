import { http } from "../../lib/http";
import type { ApplicationStatus, ApplicationsResponse } from "./model";

export interface ApplicationsFilters extends Record<string, string | number | boolean | undefined> {
  status?: string;
  q?: string;
}

export interface MoveApplicationInput {
  id: number;
  status: ApplicationStatus;
  position: number;
}

export async function fetchApplications(filters: ApplicationsFilters = {}) {
  const { data } = await http.get<ApplicationsResponse>("/applications", { params: filters });
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
