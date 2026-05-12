import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRoute, createRouter } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { rootRoute } from "./root";
import { signupRoute } from "./signup";

const signupMutateAsyncMock = vi.fn();

vi.mock("../features/auth/hooks", () => ({
  useSignup: () => ({ mutateAsync: signupMutateAsyncMock, isPending: false })
}));

function renderSignup() {
  const queryClient = new QueryClient();
  const boardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/board",
    component: () => <div>Board</div>
  });
  const routeTree = rootRoute.addChildren([signupRoute, boardRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/signup"] }),
    context: { queryClient, auth: { hydrated: true, isAuthenticated: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient, auth: { hydrated: true, isAuthenticated: false } }} />
    </QueryClientProvider>
  );
}

describe("signup form", () => {
  afterEach(() => {
    cleanup();
  });

  it("blocks submit when required fields are missing", async () => {
    signupMutateAsyncMock.mockResolvedValue(undefined);
    renderSignup();

    fireEvent.click(await screen.findByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/expected string to have >=6 characters/i)).toBeInTheDocument();
    expect(signupMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("shows mismatch password validation error", async () => {
    signupMutateAsyncMock.mockResolvedValue(undefined);
    renderSignup();

    const submitButton = await screen.findByRole("button", { name: /create account/i });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Dev User" } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "dev@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "secret123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "secret124" } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/passwords must match/i)).toBeInTheDocument();
    expect(signupMutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits valid signup payload", async () => {
    signupMutateAsyncMock.mockResolvedValue(undefined);
    renderSignup();

    const submitButton = await screen.findByRole("button", { name: /create account/i });
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Dev User" } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "dev@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "secret123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "secret123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signupMutateAsyncMock).toHaveBeenCalledWith({
        name: "Dev User",
        email: "dev@example.com",
        password: "secret123",
        password_confirmation: "secret123"
      });
    });
  });
});
