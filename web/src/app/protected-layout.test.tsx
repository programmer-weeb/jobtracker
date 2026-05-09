import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { routeTree } from "./router";

vi.mock("../features/auth/hooks", () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
  useLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSignup: () => ({ mutateAsync: vi.fn(), isPending: false })
}));

vi.mock("../features/applications/hooks", () => ({
  useApplications: () => ({ isLoading: false }),
  useMoveApplication: () => ({ mutateAsync: vi.fn() }),
  useTags: () => ({ data: { data: [] } })
}));

vi.mock("../features/companies/hooks", () => ({
  useCompanies: () => ({ data: { data: [] } })
}));

describe("protected layout", () => {
  it("renders board route when authenticated", async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/board"] }),
      context: { auth: { hydrated: true, isAuthenticated: true } }
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ auth: { hydrated: true, isAuthenticated: true } }} />
      </QueryClientProvider>
    );

    expect(await screen.findByText("JobTracker")).toBeInTheDocument();
  });
});
