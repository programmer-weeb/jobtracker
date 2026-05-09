export const queryKeys = {
  me: ["me"] as const,
  companies: ["companies"] as const,
  tags: ["tags"] as const,
  applicationDetail: (id: number) => ["applications", "detail", id] as const,
  applications: (filters?: Record<string, string | number | boolean | undefined>) =>
    ["applications", filters ?? {}] as const
};
