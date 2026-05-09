import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import { login, logout, me, signup } from "./api";
import { useAuth } from "./context";
import type { LoginInput, SignupInput } from "./types";

export function useMe() {
  const auth = useAuth();
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: me,
    enabled: Boolean(auth.token)
  });
}

export function useLogin() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (data) => auth.setSession(data.token, data.user)
  });
}

export function useSignup() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (input: SignupInput) => signup(input),
    onSuccess: (data) => auth.setSession(data.token, data.user)
  });
}

export function useLogout() {
  const auth = useAuth();
  return useMutation({
    mutationFn: logout,
    onSettled: () => auth.clearSession()
  });
}
