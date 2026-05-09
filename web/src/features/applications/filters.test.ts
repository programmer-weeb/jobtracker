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
    ).toEqual({ status: "applied", q: "rails", tag: 5, company: 2, remote: false });
  });

  it("parses remote true/false and invalid as undefined", () => {
    expect(normalizeFiltersFromSearch({ remote: "true" }).remote).toBe(true);
    expect(normalizeFiltersFromSearch({ remote: "false" }).remote).toBe(false);
    expect(normalizeFiltersFromSearch({ remote: "maybe" }).remote).toBeUndefined();
  });

  it("builds stable search object", () => {
    expect(toSearchFilters({ status: "interview", q: "x", tag: 1, remote: true, company: 7 })).toEqual({
      status: "interview",
      q: "x",
      tag: 1,
      remote: true,
      company: 7
    });
  });
});
