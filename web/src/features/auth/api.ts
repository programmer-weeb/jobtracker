import { http } from "../../lib/http";
import type { AuthResponse, LoginInput, SignupInput, User } from "./types";

export async function login(input: LoginInput) {
  const { data } = await http.post<AuthResponse>("/auth/login", { user: input });
  return data;
}

export async function signup(input: SignupInput) {
  const { data } = await http.post<AuthResponse>("/auth/signup", { user: input });
  return data;
}

export async function logout() {
  await http.delete("/auth/logout");
}

export async function me() {
  const { data } = await http.get<User>("/auth/me");
  return data;
}
