import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import {
  createNote,
  deleteNote,
  fetchApplication,
  fetchApplications,
  fetchTags,
  moveApplication,
  updateApplication,
  type ApplicationsFilters,
  type UpdateApplicationInput
} from "./api";
import type { Application, ApplicationStatus, ApplicationsResponse, Note, TagSummary } from "./model";

export type { ApplicationsFilters };

function syncApplicationInCaches(
  queryClient: QueryClient,
  application: Application
) {
  queryClient.setQueryData(queryKeys.applicationDetail(application.id), { data: application });

  const allApplicationsLists = queryClient.getQueriesData<ApplicationsResponse>({
    queryKey: ["applications"]
  });

  for (const [key, value] of allApplicationsLists) {
    if (!value?.data || !Array.isArray(key) || key[1] === "detail") {
      continue;
    }

    queryClient.setQueryData<ApplicationsResponse>(key, {
      data: value.data.map((item) => (item.id === application.id ? { ...item, ...application } : item))
    });
  }
}

export function useApplications(filters: ApplicationsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.applications(filters),
    queryFn: () => fetchApplications(filters)
  });
}

export function useApplication(id: number) {
  return useQuery({
    queryKey: queryKeys.applicationDetail(id),
    queryFn: () => fetchApplication(id)
  });
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: fetchTags
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateApplicationInput) => updateApplication(input),
    onSuccess: (response) => {
      syncApplicationInCaches(queryClient, response.data);
    }
  });
}

export function useCreateNote(applicationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => createNote(applicationId, body),
    onSuccess: (response) => {
      queryClient.setQueryData<{ data: Application }>(queryKeys.applicationDetail(applicationId), (current) => {
        if (!current) {
          return current;
        }

        const notes = [response.data, ...(current.data.notes ?? [])];
        const updated = { ...current.data, notes };
        syncApplicationInCaches(queryClient, updated);
        return { data: updated };
      });
    }
  });
}

export function useDeleteNote(applicationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: number) => deleteNote(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.applicationDetail(applicationId) });
      const previous = queryClient.getQueryData<{ data: Application }>(queryKeys.applicationDetail(applicationId));

      if (previous) {
        const updated = {
          ...previous.data,
          notes: (previous.data.notes ?? []).filter((note) => note.id !== noteId)
        };
        syncApplicationInCaches(queryClient, updated);
      }

      return { previous };
    },
    onError: (_error, _noteId, context) => {
      if (context?.previous) {
        syncApplicationInCaches(queryClient, context.previous.data);
      }
    }
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

export function toTagIds(tags: TagSummary[]): number[] {
  return tags.map((tag) => tag.id);
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
