import { cleanup, fireEvent, render, screen, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./context";

const meMock = vi.fn();
const configureHttpClientMock = vi.fn();
let capturedHttpOptions: { getToken: () => string | null; onUnauthorized: () => void } | undefined;

vi.mock("./api", () => ({
  me: (...args: unknown[]) => meMock(...args)
}));

vi.mock("../../lib/http", () => ({
  configureHttpClient: (opts: unknown) => {
    configureHttpClientMock(opts);
    capturedHttpOptions = opts as { getToken: () => string | null; onUnauthorized: () => void };
  },
  http: { get: vi.fn(), post: vi.fn(), delete: vi.fn() }
}));

const user = { id: 1, email: "test@example.com", name: "Test User" };

function Consumer() {
  const auth = useAuth();

  return (
    <div>
      <p data-testid="token">{auth.token ?? "none"}</p>
      <p data-testid="user">{auth.user?.email ?? "none"}</p>
      <p data-testid="hydrated">{String(auth.hydrated)}</p>
      <p data-testid="is-authenticated">{String(auth.isAuthenticated)}</p>
      <button type="button" onClick={() => auth.setSession("new-token", user)}>
        set session
      </button>
      <button type="button" onClick={() => auth.clearSession()}>
        clear session
      </button>
      <button type="button" onClick={() => void auth.refreshMe()}>
        refresh me
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    meMock.mockReset();
    configureHttpClientMock.mockReset();
    capturedHttpOptions = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  it("starts unauthenticated when token missing", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hydrated")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
    expect(meMock).not.toHaveBeenCalled();
  });

  it("sets session, refreshes user via API, then logs out and clears storage", async () => {
    meMock.mockResolvedValueOnce({ ...user, email: "updated@example.com" });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hydrated")).toHaveTextContent("true");
    });

    fireEvent.click(screen.getByRole("button", { name: /set session/i }));
    expect(localStorage.getItem("jobtracker.auth.token")).toBe("new-token");
    expect(screen.getByTestId("token")).toHaveTextContent("new-token");
    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: /refresh me/i }));
    await waitFor(() => {
      expect(meMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("user")).toHaveTextContent("updated@example.com");
    });

    fireEvent.click(screen.getByRole("button", { name: /clear session/i }));
    expect(localStorage.getItem("jobtracker.auth.token")).toBeNull();
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
  });

  it("restores session from storage on mount", async () => {
    localStorage.setItem("jobtracker.auth.token", "persisted-token");
    meMock.mockResolvedValueOnce(user);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(meMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("token")).toHaveTextContent("persisted-token");
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
      expect(screen.getByTestId("hydrated")).toHaveTextContent("true");
    });
  });

  it("clears bad persisted token when restore request fails", async () => {
    localStorage.setItem("jobtracker.auth.token", "bad-token");
    meMock.mockRejectedValueOnce(new Error("unauthorized"));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(meMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("token")).toHaveTextContent("none");
      expect(screen.getByTestId("user")).toHaveTextContent("none");
      expect(screen.getByTestId("hydrated")).toHaveTextContent("true");
    });

    expect(localStorage.getItem("jobtracker.auth.token")).toBeNull();
  });

  it("throws when useAuth used outside provider", () => {
    function OutsideConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<OutsideConsumer />)).toThrow("useAuth must be used inside AuthProvider");
  });

  it("getToken returns current session token after setSession", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("true"));
    expect(capturedHttpOptions?.getToken()).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /set session/i }));

    await waitFor(() => {
      expect(capturedHttpOptions?.getToken()).toBe("new-token");
    });
  });

  it("onUnauthorized clears session and redirects when not on login page", async () => {
    const originalLocation = window.location;
    const assignMock = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { ...originalLocation, assign: assignMock, pathname: "/board" };

    try {
      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("true"));

      fireEvent.click(screen.getByRole("button", { name: /set session/i }));
      expect(screen.getByTestId("token")).toHaveTextContent("new-token");

      await waitFor(() => expect(capturedHttpOptions?.getToken()).toBe("new-token"));

      act(() => {
        capturedHttpOptions?.onUnauthorized?.();
      });

      expect(screen.getByTestId("token")).toHaveTextContent("none");
      expect(assignMock).toHaveBeenCalledWith("/login");
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = originalLocation;
    }
  });

  it("onUnauthorized does not redirect when already on login page", async () => {
    const originalLocation = window.location;
    const assignMock = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { ...originalLocation, assign: assignMock, pathname: "/login" };

    try {
      render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>
      );

      await waitFor(() => expect(screen.getByTestId("hydrated")).toHaveTextContent("true"));

      act(() => {
        capturedHttpOptions?.onUnauthorized?.();
      });

      expect(assignMock).not.toHaveBeenCalled();
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = originalLocation;
    }
  });
});
