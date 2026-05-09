import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import { fetchApplications, moveApplication, type ApplicationsFilters } from "./api";
import type { Application, ApplicationStatus } from "./model";

export type { ApplicationsFilters };

export function useApplications(filters: ApplicationsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.applications(filters),
    queryFn: () => fetchApplications(filters)
  });
}

export interface MoveApplicationVariables {
  id: number;
  status: ApplicationStatus;
  position: number;
  fromStatus: ApplicationStatus;
}

export function useMoveApplication(
  options?: UseMutationOptions<Application, Error, MoveApplicationVariables, { previous?: import("./model").ApplicationsResponse }>
) {
  return useMutation({
    mutationFn: ({ id, status, position }) => moveApplication({ id, status, position }),
    ...options
  });
}
