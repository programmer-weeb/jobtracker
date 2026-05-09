import { describe, expect, it, vi } from "vitest";
import { login, me, signup } from "./api";

const httpMock = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn()
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
});
