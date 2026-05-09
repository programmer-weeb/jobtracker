import { http } from "../../lib/http";
import type { AuthResponse, LoginInput, SignupInput, User } from "./types";

interface AuthApiEnvelope {
  data: User;
}

export async function login(input: LoginInput) {
  const response = await http.post<AuthApiEnvelope>("/auth/login", { user: input });
  const user = response.data.data;
  const token = response.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Missing Authorization token in login response");
  }

  return { token, user } satisfies AuthResponse;
}

export async function signup(input: SignupInput) {
  const response = await http.post<AuthApiEnvelope>("/auth/signup", { user: input });
  const user = response.data.data;
  const token = response.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Missing Authorization token in signup response");
  }

  return { token, user } satisfies AuthResponse;
}

export async function logout() {
  await http.delete("/auth/logout");
}

export async function me() {
  const { data } = await http.get<AuthApiEnvelope>("/auth/me");
  return data.data;
}
