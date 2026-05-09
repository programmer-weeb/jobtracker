import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationsPage } from "./list-page";

const fetchApplicationsMock = vi.fn();
const fetchTagsMock = vi.fn();
const fetchCompaniesMock = vi.fn();
const navigateMock = vi.fn();
const useSearchMock = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: (...args: unknown[]) => useSearchMock(...args)
  };
});

vi.mock("./api", () => ({
  fetchApplications: (...args: unknown[]) => fetchApplicationsMock(...args),
  fetchTags: (...args: unknown[]) => fetchTagsMock(...args),
  fetchApplication: vi.fn(),
  updateApplication: vi.fn(),
  moveApplication: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  normalizeApplicationFilters: (filters: Record<string, unknown>) => {
    const normalized: Record<string, unknown> = {};
    if (filters.status) normalized.status = filters.status;
    if (filters.q) normalized.q = filters.q;
    if (filters.tag !== undefined) normalized.tag = filters.tag;
    if (filters.remote !== undefined) normalized.remote = filters.remote;
    if (filters.company !== undefined) normalized.company = filters.company;
    return normalized;
  }
}));

vi.mock("../companies/api", () => ({
  fetchCompanies: (...args: unknown[]) => fetchCompaniesMock(...args),
  createCompany: vi.fn(),
  updateCompany: vi.fn(),
  deleteCompany: vi.fn()
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ApplicationsPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useSearchMock.mockReturnValue({});
  fetchApplicationsMock.mockResolvedValue({
    data: [{ id: 7, title: "Backend Engineer", status: "applied", remote: true, applied_at: "2026-05-01", company: { id: 2, name: "Acme", website: null, location: null } }]
  });
  fetchTagsMock.mockResolvedValue({ data: [{ id: 5, name: "urgent", color: "#ff0000" }] });
  fetchCompaniesMock.mockResolvedValue({ data: [{ id: 2, user_id: 1, name: "Acme", website: null, location: null, notes: null, created_at: "", updated_at: "" }] });
});

afterEach(() => {
  cleanup();
});

describe("ApplicationsPage filters", () => {
  it("renders list and sends active filters to applications api", async () => {
    useSearchMock.mockReturnValue({ q: "rails", status: "applied", tag: 5, remote: true, company: 2 });

    renderPage();

    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    await waitFor(() => expect(fetchApplicationsMock).toHaveBeenCalledWith({ q: "rails", status: "applied", tag: 5, remote: true, company: 2 }));
  });

  it("updates url search params from filter interactions", async () => {
    renderPage();
    await screen.findByText("Backend Engineer");

    fireEvent.change(screen.getByLabelText("Search applications"), { target: { value: "golang" } });
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "/applications",
      search: expect.objectContaining({ q: "golang" })
    }));

    fireEvent.change(screen.getByLabelText("Filter by remote"), { target: { value: "false" } });
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({
      search: expect.objectContaining({ remote: false })
    }));
  });
});
