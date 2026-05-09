import { useMutation, useQuery } from "@tanstack/react-query";
import { http } from "../../lib/http";
import { queryKeys } from "../../lib/query-keys";

export interface ApplicationsFilters extends Record<string, string | number | boolean | undefined> {
  status?: string;
  q?: string;
}

export function useApplications(filters: ApplicationsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.applications(filters),
    queryFn: async () => {
      const { data } = await http.get("/applications", { params: filters });
      return data;
    }
  });
}

export function useMoveApplication() {
  return useMutation({
    mutationFn: async (input: { id: number; status: string; position: number }) => {
      const { data } = await http.patch(`/applications/${input.id}/move`, input);
      return data;
    }
  });
}
