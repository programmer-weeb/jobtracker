import { describe, expect, it } from "vitest";
import { router } from "./router";

describe("router", () => {
  it("registers root route", () => {
    expect(router).toBeDefined();
  });
});
