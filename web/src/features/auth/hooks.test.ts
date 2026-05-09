import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLogin, useLogout, useMe, useSignup } from "./hooks";

const loginMock = vi.fn();
const signupMock = vi.fn();
const logoutMock = vi.fn();
const meMock = vi.fn();

const authState = {
  token: null as string | null,
  setSession: vi.fn(),
  clearSession: vi.fn()
};

vi.mock("./api", () => ({
  login: (...args: unknown[]) => loginMock(...args),
  signup: (...args: unknown[]) => signupMock(...args),
  logout: (...args: unknown[]) => logoutMock(...args),
  me: (...args: unknown[]) => meMock(...args)
}));

vi.mock("./context", () => ({
  useAuth: () => authState
}));

describe("auth hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    authState.token = null;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }

  it("useMe stays disabled without token", async () => {
    const { result } = renderHook(() => useMe(), { wrapper });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    expect(meMock).not.toHaveBeenCalled();
  });

  it("useMe fetches profile when token exists", async () => {
    authState.token = "token-123";
    meMock.mockResolvedValueOnce({ id: 1, email: "u@example.com", name: "User" });

    const { result } = renderHook(() => useMe(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(meMock).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ id: 1, email: "u@example.com", name: "User" });
  });

  it("useLogin stores returned session on success", async () => {
    loginMock.mockResolvedValueOnce({
      token: "login-token",
      user: { id: 1, email: "u@example.com", name: "User" }
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ email: "u@example.com", password: "secret123" });
    });

    expect(loginMock).toHaveBeenCalledWith({ email: "u@example.com", password: "secret123" });
    expect(authState.setSession).toHaveBeenCalledWith("login-token", {
      id: 1,
      email: "u@example.com",
      name: "User"
    });
  });

  it("useSignup stores returned session on success", async () => {
    signupMock.mockResolvedValueOnce({
      token: "signup-token",
      user: { id: 7, email: "new@example.com", name: "New User" }
    });

    const { result } = renderHook(() => useSignup(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        name: "New User",
        email: "new@example.com",
        password: "secret123",
        password_confirmation: "secret123"
      });
    });

    expect(signupMock).toHaveBeenCalledWith({
      name: "New User",
      email: "new@example.com",
      password: "secret123",
      password_confirmation: "secret123"
    });
    expect(authState.setSession).toHaveBeenCalledWith("signup-token", {
      id: 7,
      email: "new@example.com",
      name: "New User"
    });
  });

  it("useLogout clears session even when API call fails", async () => {
    logoutMock.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useLogout(), { wrapper });

    await expect(result.current.mutateAsync()).rejects.toThrow("boom");

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(authState.clearSession).toHaveBeenCalledTimes(1);
  });
});
