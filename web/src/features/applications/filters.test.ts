import { describe, expect, it } from "vitest";
import { normalizeFiltersFromSearch, toSearchFilters } from "./filters";

describe("application filter normalization", () => {
  it("normalizes valid params and drops invalid/unknown values", () => {
    expect(
      normalizeFiltersFromSearch({
        status: "applied",
        q: "  rails  ",
        tag: "5",
        company: "2",
        remote: "false",
        unknown: "value",
        badTag: "xx"
      })
    ).toEqual({ status: ["applied"], q: "rails", tag: [5], company: [2], remote: false, page: undefined, per_page: undefined });
  });

  it("parses remote true/false and invalid as undefined", () => {
    expect(normalizeFiltersFromSearch({ remote: "true" }).remote).toBe(true);
    expect(normalizeFiltersFromSearch({ remote: "false" }).remote).toBe(false);
    expect(normalizeFiltersFromSearch({ remote: "maybe" }).remote).toBeUndefined();
  });

  it("builds stable search object", () => {
    expect(toSearchFilters({ status: ["interview"], q: "x", tag: [1], remote: true, company: [7] })).toEqual({
      status: ["interview"],
      q: "x",
      tag: [1],
      remote: true,
      company: [7],
      page: undefined,
      per_page: undefined
    });
  });

  describe("pagination round-trip", () => {
    it("round-trips page and per_page through normalize and toSearch", () => {
      const search = { page: "2", per_page: "50" };
      const normalized = normalizeFiltersFromSearch(search);
      const result = toSearchFilters(normalized);

      expect(result).toEqual(expect.objectContaining({
        page: 2,
        per_page: 50
      }));
    });

    it("discards non-positive page values", () => {
      const normalized1 = normalizeFiltersFromSearch({ page: "0" });
      const normalized2 = normalizeFiltersFromSearch({ page: "-1" });

      expect(normalized1.page).toBeUndefined();
      expect(normalized2.page).toBeUndefined();
    });

    it("discards non-positive per_page values", () => {
      const normalized1 = normalizeFiltersFromSearch({ per_page: "0" });
      const normalized2 = normalizeFiltersFromSearch({ per_page: "-5" });

      expect(normalized1.per_page).toBeUndefined();
      expect(normalized2.per_page).toBeUndefined();
    });

    it("ignores non-numeric page and per_page", () => {
      const normalized = normalizeFiltersFromSearch({ page: "abc", per_page: "xyz" });

      expect(normalized.page).toBeUndefined();
      expect(normalized.per_page).toBeUndefined();
    });
  });
});
