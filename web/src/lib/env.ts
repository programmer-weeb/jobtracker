const DEFAULT_API_URL = "http://localhost:3000";

function toUrl(value: string): string {
  return value.startsWith("http") ? value : `https://${value}`;
}

export const env = {
  apiBaseUrl: toUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL)
};
