import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompaniesPage } from "./page";

const fetchCompaniesMock = vi.fn();
const createCompanyMock = vi.fn();
const updateCompanyMock = vi.fn();
const deleteCompanyMock = vi.fn();

vi.mock("./api", () => ({
  fetchCompanies: (...args: unknown[]) => fetchCompaniesMock(...args),
  createCompany: (...args: unknown[]) => createCompanyMock(...args),
  updateCompany: (...args: unknown[]) => updateCompanyMock(...args),
  deleteCompany: (...args: unknown[]) => deleteCompanyMock(...args)
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CompaniesPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchCompaniesMock.mockResolvedValue({
    data: [{ id: 1, user_id: 1, name: "Acme", website: "https://acme.io", location: "SF", notes: "priority", created_at: "", updated_at: "" }]
  });
  createCompanyMock.mockResolvedValue({
    data: { id: 2, user_id: 1, name: "OpenAI", website: null, location: "Remote", notes: null, created_at: "", updated_at: "" }
  });
  updateCompanyMock.mockResolvedValue({
    data: { id: 1, user_id: 1, name: "Acme Updated", website: "https://acme.io", location: "SF", notes: "priority", created_at: "", updated_at: "" }
  });
  deleteCompanyMock.mockResolvedValue({});
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CompaniesPage", () => {
  it("fetches and renders companies", async () => {
    renderPage();

    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(fetchCompaniesMock).toHaveBeenCalledTimes(1);
  });

  it("create, edit, delete call correct APIs and update UI", async () => {
    renderPage();
    await screen.findByText("Acme");

    fireEvent.change(screen.getByLabelText("Create company name"), { target: { value: "OpenAI" } });
    fireEvent.change(screen.getByLabelText("Create location"), { target: { value: "Remote" } });
    fireEvent.click(screen.getByRole("button", { name: /add company/i }));

    await waitFor(() => expect(createCompanyMock).toHaveBeenCalledWith({
      name: "OpenAI",
      website: null,
      location: "Remote",
      notes: null
    }));
    expect(await screen.findByText("OpenAI")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    const nameInputs = screen.getAllByLabelText("Company name");
    fireEvent.change(nameInputs[0], { target: { value: "Acme Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateCompanyMock).toHaveBeenCalledWith(1, expect.objectContaining({ name: "Acme Updated" })));
    expect(await screen.findByText("Acme Updated")).toBeInTheDocument();

    const acmeRow = screen.getByText("Acme Updated").closest("tr");
    expect(acmeRow).toBeTruthy();
    fireEvent.click(within(acmeRow as HTMLElement).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteCompanyMock).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText("Acme Updated")).not.toBeInTheDocument());
  });
});
