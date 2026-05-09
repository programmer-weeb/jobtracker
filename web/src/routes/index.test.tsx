import { describe, expect, it } from "vitest";
import { indexRoute } from "./index";

describe("index route", () => {
  it("redirects unauthenticated users to login", () => {
    let thrown: unknown;

    try {
      indexRoute.options.beforeLoad?.({
        context: { auth: { hydrated: true, isAuthenticated: false } }
      } as never);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ options: { to: "/login" } });
  });

  it("redirects authenticated users to board", () => {
    let thrown: unknown;

    try {
      indexRoute.options.beforeLoad?.({
        context: { auth: { hydrated: true, isAuthenticated: true } }
      } as never);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ options: { to: "/board" } });
  });
});
