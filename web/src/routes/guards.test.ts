import { describe, expect, it } from "vitest";
import { authenticatedRoute } from "./authenticated";
import { loginRoute } from "./login";

describe("auth guards", () => {
  it("redirects unauthenticated user from protected route", () => {
    expect(() =>
      authenticatedRoute.options.beforeLoad?.({
        context: { auth: { hydrated: true, isAuthenticated: false } }
      } as never)
    ).toThrow();
  });

  it("redirects authenticated user away from /login", () => {
    expect(() =>
      loginRoute.options.beforeLoad?.({
        context: { auth: { hydrated: true, isAuthenticated: true } }
      } as never)
    ).toThrow();
  });
});
