import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, readToken, writeToken } from "./storage";

describe("auth storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads null when token missing", () => {
    expect(readToken()).toBeNull();
  });

  it("writes then reads token", () => {
    writeToken("token-123");

    expect(readToken()).toBe("token-123");
  });

  it("clears token", () => {
    writeToken("token-123");

    clearToken();

    expect(readToken()).toBeNull();
  });
});
