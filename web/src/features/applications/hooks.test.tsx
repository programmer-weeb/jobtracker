import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useCreateNote, useUpdateApplication } from "./hooks";
import { queryKeys } from "../../lib/query-keys";
import type { Application } from "./model";

const updateApplicationMock = vi.fn();
const createNoteMock = vi.fn();

vi.mock("./api", () => ({
  updateApplication: (...args: unknown[]) => updateApplicationMock(...args),
  createNote: (...args: unknown[]) => createNoteMock(...args)
}));

const baseApplication: Application = {
  id: 42,
  user_id: 1,
  company_id: 2,
  title: "Backend Engineer",
  status: "applied",
  source: "LinkedIn",
  salary_min: 100000,
  salary_max: 150000,
  currency: "USD",
  remote: true,
  location: "Remote",
  url: "https://example.com/jobs/42",
  applied_at: "2026-05-01",
  position: 0,
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-02T10:00:00Z",
  company: { id: 2, name: "Acme", website: null, location: null },
  tags: [],
  notes: [{ id: 10, application_id: 42, body: "Initial note", created_at: "2026-05-03T10:00:00Z", updated_at: "2026-05-03T10:00:00Z" }],
  events: [
    {
      id: 100,
      kind: "status_changed",
      payload: { from: "wishlist", to: "applied" },
      created_at: "2026-05-02T11:00:00Z",
      updated_at: "2026-05-02T11:00:00Z"
    }
  ]
};

describe("Application Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    queryClient.setQueryData(queryKeys.applicationDetail(42), { data: baseApplication });
  });

  afterEach(() => {
    queryClient.clear();
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it("updateApplication keeps existing notes and events when API does not return them, and invalidates detail query", async () => {
    // API response without notes/events (as per actual behavior)
    const updatedApplication = { ...baseApplication, title: "Senior Backend Engineer", notes: undefined, events: undefined };
    updateApplicationMock.mockResolvedValueOnce({ data: updatedApplication });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateApplication(), { wrapper });

    result.current.mutate({ id: 42, application: { title: "Senior Backend Engineer" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<{ data: Application }>(queryKeys.applicationDetail(42));
    
    // Notes and events should be preserved from cache
    expect(cached?.data.notes).toHaveLength(1);
    expect(cached?.data.events).toHaveLength(1);
    expect(cached?.data.title).toBe("Senior Backend Engineer");

    // Invalidation should be called to refresh
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["applications"] });
  });

  it("createNote updates notes array and invalidates detail query to refresh activity", async () => {
    const newNote = { id: 11, application_id: 42, body: "New note", created_at: "2026-05-04T10:00:00Z", updated_at: "2026-05-04T10:00:00Z" };
    createNoteMock.mockResolvedValueOnce({ data: newNote });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateNote(42), { wrapper });

    result.current.mutate("New note");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<{ data: Application }>(queryKeys.applicationDetail(42));

    // Note should be added to the front
    expect(cached?.data.notes).toHaveLength(2);
    expect(cached?.data.notes?.[0].body).toBe("New note");

    // Invalidation should be called to fetch events
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.applicationDetail(42) });
  });

  it("optimistic update preserves pagination meta when updating application in list", async () => {
    const listMeta = { page: 2, per_page: 25, total: 50 };
    const initialListData = {
      data: [baseApplication],
      meta: listMeta
    };
    queryClient.setQueryData(queryKeys.applications({ page: 2, per_page: 25 }), initialListData);

    updateApplicationMock.mockResolvedValueOnce({ data: { ...baseApplication, title: "Senior Backend Engineer", notes: undefined, events: undefined } });

    const { result } = renderHook(() => useUpdateApplication(), { wrapper });

    result.current.mutate({ id: 42, application: { title: "Senior Backend Engineer" } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<{ data: Application[], meta: typeof listMeta }>(queryKeys.applications({ page: 2, per_page: 25 }));

    // Meta should be preserved
    expect(cached?.meta).toEqual(listMeta);
    expect(cached?.data[0].title).toBe("Senior Backend Engineer");
  });
});
