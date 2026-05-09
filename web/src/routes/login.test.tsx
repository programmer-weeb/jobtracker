import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRoute, createRouter } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loginRoute } from "./login";
import { rootRoute } from "./root";

const loginMutateAsyncMock = vi.fn();

vi.mock("../features/auth/hooks", () => ({
  useLogin: () => ({ mutateAsync: loginMutateAsyncMock, isPending: false })
}));

function renderLogin() {
  const boardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/board",
    component: () => <div>Board</div>
  });
  const routeTree = rootRoute.addChildren([loginRoute, boardRoute]);
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
  afterEach(() => {
    cleanup();
  });

  it("shows validation errors", async () => {
    loginMutateAsyncMock.mockResolvedValue(undefined);
    renderLogin();

    fireEvent.click(await screen.findByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
    expect(loginMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits entered credentials", async () => {
    loginMutateAsyncMock.mockResolvedValue(undefined);
    renderLogin();

    const submitButton = await screen.findByRole("button", { name: /sign in/i });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "dev@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginMutateAsyncMock).toHaveBeenCalledWith({
        email: "dev@example.com",
        password: "secret123"
      });
    });
  });
});
