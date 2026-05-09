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
});
