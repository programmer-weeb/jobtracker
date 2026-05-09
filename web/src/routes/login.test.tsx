import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { rootRoute } from "./root";
import { loginRoute } from "./login";

vi.mock("../features/auth/hooks", () => ({
  useLogin: () => ({ mutateAsync: vi.fn(), isPending: false })
}));

function renderLogin() {
  const routeTree = rootRoute.addChildren([loginRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/login"] }),
    context: { auth: { hydrated: true, isAuthenticated: false } }
  });

  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

describe("login form", () => {
  it("shows validation errors", async () => {
    renderLogin();
    fireEvent.click(await screen.findByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });
});
