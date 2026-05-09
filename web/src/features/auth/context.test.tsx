import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./context";

const meMock = vi.fn();

vi.mock("./api", () => ({
  me: (...args: unknown[]) => meMock(...args)
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
});
