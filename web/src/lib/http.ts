import axios from "axios";
import { env } from "./env";

type AuthTokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: AuthTokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

export function configureHttpClient(options: {
  getToken: AuthTokenGetter;
  onUnauthorized: UnauthorizedHandler;
}) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);
