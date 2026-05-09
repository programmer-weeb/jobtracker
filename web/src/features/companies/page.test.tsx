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

const acme = { id: 1, user_id: 1, name: "Acme", website: "https://acme.io", location: "SF", notes: "priority", created_at: "", updated_at: "" };

beforeEach(() => {
  vi.resetAllMocks();
  fetchCompaniesMock.mockImplementation(() =>
    Promise.resolve({
      data: [acme]
    })
  );
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
  it("renders loading state", () => {
    fetchCompaniesMock.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(screen.getByText("Loading companies...")).toBeInTheDocument();
  });

  it("renders empty and query error states", async () => {
    fetchCompaniesMock.mockResolvedValueOnce({ data: [] });
    renderPage();
    expect(await screen.findByText("No companies yet. Add your first company above.")).toBeInTheDocument();

    cleanup();
    fetchCompaniesMock.mockRejectedValueOnce(new Error("boom"));
    renderPage();
    expect(await screen.findByText(/Failed to load companies: boom/)).toBeInTheDocument();
  });

  it("validates required create name", async () => {
    renderPage();
    await screen.findByText("Acme");

    fireEvent.click(screen.getByRole("button", { name: /add company/i }));

    expect(screen.getByText("Company name is required.")).toBeInTheDocument();
    expect(createCompanyMock).not.toHaveBeenCalled();
  });

  it("handles create/update/delete API failures", async () => {
    renderPage();
    await screen.findByText("Acme");

    createCompanyMock.mockRejectedValueOnce(new Error("create failed"));
    fireEvent.change(screen.getByLabelText("Create company name"), { target: { value: "Bad Co" } });
    fireEvent.click(screen.getByRole("button", { name: /add company/i }));
    expect(await screen.findByText("create failed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    updateCompanyMock.mockRejectedValueOnce(new Error("update failed"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("update failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    deleteCompanyMock.mockRejectedValueOnce(new Error("delete failed"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("delete failed")).toBeInTheDocument();
  });

  it("create, edit, delete call correct APIs and update UI", async () => {
    renderPage();
    await screen.findByText("Acme");

    fireEvent.change(screen.getByLabelText("Create company name"), { target: { value: "OpenAI" } });
    fireEvent.change(screen.getByLabelText("Create location"), { target: { value: "Remote" } });
    fireEvent.click(screen.getByRole("button", { name: /add company/i }));

    await waitFor(() =>
      expect(createCompanyMock).toHaveBeenCalledWith({
        name: "OpenAI",
        website: null,
        location: "Remote",
        notes: null
      })
    );
    expect(await screen.findByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Company added.")).toBeInTheDocument();

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
    expect(screen.getByText("Company deleted.")).toBeInTheDocument();
  });
});
