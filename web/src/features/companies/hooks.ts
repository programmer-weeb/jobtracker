import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import { createCompany, deleteCompany, fetchCompanies, updateCompany } from "./api";
import type { Company, UpsertCompanyPayload } from "./model";

export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies,
    queryFn: fetchCompanies
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (company: UpsertCompanyPayload) => createCompany(company),
    onSuccess: (response) => {
      queryClient.setQueryData<{ data: Company[] }>(queryKeys.companies, (current) => {
        const currentData = current?.data ?? [];
        return { data: [response.data, ...currentData] };
      });
    }
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, company }: { id: number; company: UpsertCompanyPayload }) => updateCompany(id, company),
    onSuccess: (response) => {
      queryClient.setQueryData<{ data: Company[] }>(queryKeys.companies, (current) => {
        if (!current) {
          return current;
        }

        return {
          data: current.data.map((item) => (item.id === response.data.id ? response.data : item))
        };
      });
    }
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCompany(id),
    onSuccess: (_response, id) => {
      queryClient.setQueryData<{ data: Company[] }>(queryKeys.companies, (current) => {
        if (!current) {
          return current;
        }

        return { data: current.data.filter((item) => item.id !== id) };
      });
    }
  });
}
