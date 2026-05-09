import { describe, expect, it, vi } from "vitest";
import { login, logout, me, signup } from "./api";

const httpMock = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  delete: vi.fn()
}));

vi.mock("../../lib/http", () => ({
  http: httpMock
}));

describe("auth api contract", () => {
  it("login unwraps user and token from response header", async () => {
    httpMock.post.mockResolvedValueOnce({
      data: { data: { id: 1, email: "demo@example.com", name: "Demo" } },
      headers: { authorization: "Bearer jwt-login-token" }
    });

    await expect(login({ email: "demo@example.com", password: "password123" })).resolves.toEqual({
      token: "jwt-login-token",
      user: { id: 1, email: "demo@example.com", name: "Demo" }
    });
  });

  it("signup unwraps user and token from response header", async () => {
    httpMock.post.mockResolvedValueOnce({
      data: { data: { id: 2, email: "new@example.com", name: "New User" } },
      headers: { authorization: "Bearer jwt-signup-token" }
    });

    await expect(
      signup({
        name: "New User",
        email: "new@example.com",
        password: "password123",
        password_confirmation: "password123"
      })
    ).resolves.toEqual({
      token: "jwt-signup-token",
      user: { id: 2, email: "new@example.com", name: "New User" }
    });
  });

  it("me unwraps nested data payload", async () => {
    httpMock.get.mockResolvedValueOnce({
      data: { data: { id: 7, email: "me@example.com", name: "Me" } }
    });

    await expect(me()).resolves.toEqual({ id: 7, email: "me@example.com", name: "Me" });
  });

  it("login throws when authorization header is missing", async () => {
    httpMock.post.mockResolvedValueOnce({
      data: { data: { id: 1, email: "demo@example.com", name: "Demo" } },
      headers: {}
    });

    await expect(login({ email: "demo@example.com", password: "password123" })).rejects.toThrow(
      "Missing Authorization token in login response"
    );
  });

  it("signup throws when authorization header is missing", async () => {
    httpMock.post.mockResolvedValueOnce({
      data: { data: { id: 2, email: "new@example.com", name: "New User" } },
      headers: {}
    });

    await expect(
      signup({ name: "New User", email: "new@example.com", password: "password123", password_confirmation: "password123" })
    ).rejects.toThrow("Missing Authorization token in signup response");
  });

  it("login strips lowercase bearer prefix from authorization header", async () => {
    httpMock.post.mockResolvedValueOnce({
      data: { data: { id: 1, email: "demo@example.com", name: "Demo" } },
      headers: { authorization: "bearer lowercase-token" }
    });

    const result = await login({ email: "demo@example.com", password: "password123" });
    expect(result.token).toBe("lowercase-token");
  });

  it("signup strips lowercase bearer prefix from authorization header", async () => {
    httpMock.post.mockResolvedValueOnce({
      data: { data: { id: 2, email: "new@example.com", name: "New User" } },
      headers: { authorization: "bearer signup-token" }
    });

    const result = await signup({
      name: "New User",
      email: "new@example.com",
      password: "password123",
      password_confirmation: "password123"
    });
    expect(result.token).toBe("signup-token");
  });

  it("logout calls DELETE /auth/logout and returns nothing", async () => {
    httpMock.delete.mockResolvedValueOnce({});

    const result = await logout();
    expect(httpMock.delete).toHaveBeenCalledWith("/auth/logout");
    expect(result).toBeUndefined();
  });
});
