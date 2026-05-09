const AUTH_TOKEN_KEY = "jobtracker.auth.token";

export function readToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function writeToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
