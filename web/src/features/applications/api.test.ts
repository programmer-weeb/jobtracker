import { describe, expect, it } from "vitest";
import { normalizeApplicationFilters } from "./api";

describe("normalizeApplicationFilters", () => {
  it("drops page when value is 1", () => {
    expect(normalizeApplicationFilters({ page: 1 })).toEqual({});
  });

  it("preserves page when not 1", () => {
    expect(normalizeApplicationFilters({ page: 2 })).toEqual({ page: 2 });
    expect(normalizeApplicationFilters({ page: 3 })).toEqual({ page: 3 });
  });

  it("drops per_page when value is 25", () => {
    expect(normalizeApplicationFilters({ per_page: 25 })).toEqual({});
  });

  it("preserves per_page when not 25", () => {
    expect(normalizeApplicationFilters({ per_page: 50 })).toEqual({ per_page: 50 });
    expect(normalizeApplicationFilters({ per_page: 10 })).toEqual({ per_page: 10 });
  });

  it("preserves other filters alongside pagination", () => {
    expect(normalizeApplicationFilters({ status: "applied", page: 2, per_page: 25 })).toEqual({
      status: "applied",
      page: 2
    });
  });

  it("handles page=2 round-trip with other filters", () => {
    const input = { status: "interview", q: "senior", page: 2, per_page: 25 };
    const normalized = normalizeApplicationFilters(input as Parameters<typeof normalizeApplicationFilters>[0]);
    expect(normalized).toEqual({ status: "interview", q: "senior", page: 2 });
  });

  it("trims search query and drops if empty", () => {
    expect(normalizeApplicationFilters({ q: "  hello  " })).toEqual({ q: "hello" });
    expect(normalizeApplicationFilters({ q: "   " })).toEqual({});
  });
});

import { vi } from "vitest";
import { http } from "../../lib/http";
import {
  fetchApplications,
  fetchApplication,
  createApplication,
  updateApplication,
  moveApplication,
  fetchTags,
  createNote,
  deleteNote
} from "./api";

vi.mock("../../lib/http", () => ({
  http: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

describe("api helpers", () => {
  it("fetchApplications calls GET /applications", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: "applications" });
    const result = await fetchApplications({ page: 2 });
    expect(http.get).toHaveBeenCalledWith("/applications", { params: { page: 2 } });
    expect(result).toBe("applications");
  });

  it("fetchApplication calls GET /applications/:id", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: "app" });
    const result = await fetchApplication(42);
    expect(http.get).toHaveBeenCalledWith("/applications/42");
    expect(result).toBe("app");
  });

  it("updateApplication calls PATCH /applications/:id", async () => {
    vi.mocked(http.patch).mockResolvedValueOnce({ data: "app" });
    const result = await updateApplication({ id: 42, application: { title: "New" } });
    expect(http.patch).toHaveBeenCalledWith("/applications/42", { application: { title: "New" } });
    expect(result).toBe("app");
  });

  it("createApplication calls POST /applications", async () => {
    vi.mocked(http.post).mockResolvedValueOnce({ data: "app" });
    const input = { company_id: 2, title: "Rails Engineer", status: "wishlist" as const, remote: true };
    const result = await createApplication(input);
    expect(http.post).toHaveBeenCalledWith("/applications", { application: input });
    expect(result).toBe("app");
  });

  it("moveApplication calls PATCH /applications/:id/move", async () => {
    vi.mocked(http.patch).mockResolvedValueOnce({ data: { data: "app" } });
    const result = await moveApplication({ id: 42, status: "applied", position: 1 });
    expect(http.patch).toHaveBeenCalledWith("/applications/42/move", { application: { status: "applied", position: 1 } });
    expect(result).toBe("app");
  });

  it("fetchTags calls GET /tags", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: "tags" });
    const result = await fetchTags();
    expect(http.get).toHaveBeenCalledWith("/tags");
    expect(result).toBe("tags");
  });

  it("createNote calls POST /applications/:id/notes", async () => {
    vi.mocked(http.post).mockResolvedValueOnce({ data: "note" });
    const result = await createNote(42, "hello");
    expect(http.post).toHaveBeenCalledWith("/applications/42/notes", { note: { body: "hello" } });
    expect(result).toBe("note");
  });

  it("deleteNote calls DELETE /notes/:id", async () => {
    vi.mocked(http.delete).mockResolvedValueOnce({});
    await deleteNote(10);
    expect(http.delete).toHaveBeenCalledWith("/notes/10");
  });
});
