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
    if (filters.page !== undefined && filters.page !== 1) normalized.page = filters.page;
    if (filters.per_page !== undefined && filters.per_page !== 25) normalized.per_page = filters.per_page;
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
  vi.resetAllMocks();
  useSearchMock.mockReturnValue({});
  fetchApplicationsMock.mockResolvedValue({
    data: [{ id: 7, title: "Backend Engineer", status: "applied", remote: true, applied_at: "2026-05-01", company: { id: 2, name: "Acme", website: null, location: null } }],
    meta: { page: 1, per_page: 25, total: 1 }
  });
  fetchTagsMock.mockResolvedValue({ data: [{ id: 5, name: "urgent", color: "#ff0000" }] });
  fetchCompaniesMock.mockResolvedValue({ data: [{ id: 2, user_id: 1, name: "Acme", website: null, location: null, notes: null, created_at: "", updated_at: "" }] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ApplicationsPage filters", () => {
  it("renders list and sends active filters to applications api", async () => {
    useSearchMock.mockReturnValue({ q: "rails", status: "applied", tag: 5, remote: true, company: 2 });

    renderPage();

    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    await waitFor(() => expect(fetchApplicationsMock).toHaveBeenCalledWith({ q: "rails", status: "applied", tag: 5, remote: true, company: 2 }));
  });

  it("debounces q updates and keeps exact filter params in url", async () => {
    renderPage();
    await screen.findByText("Backend Engineer");

    fireEvent.change(screen.getByLabelText("Search applications"), { target: { value: "golang" } });
    expect(navigateMock).not.toHaveBeenCalledWith(expect.objectContaining({ search: expect.objectContaining({ q: "golang" }) }));

    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "/applications",
      search: expect.objectContaining({ q: "golang" })
    }));

    fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "interview" } });
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "/applications",
      search: expect.objectContaining({ status: "interview" })
    }));
    fireEvent.change(screen.getByLabelText("Filter by tag"), { target: { value: "5" } });
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "/applications",
      search: expect.objectContaining({ tag: 5 })
    }));
    fireEvent.change(screen.getByLabelText("Filter by company"), { target: { value: "2" } });
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "/applications",
      search: expect.objectContaining({ company: 2 })
    }));
    fireEvent.change(screen.getByLabelText("Filter by remote"), { target: { value: "false" } });
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "/applications",
      search: expect.objectContaining({ remote: false })
    }));
  });

  it("reset filters clears url search object", async () => {
    useSearchMock.mockReturnValue({ q: "rails", status: "offer", tag: 5, remote: false, company: 2 });
    renderPage();
    await screen.findByText("Backend Engineer");

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/applications",
      search: { status: undefined, q: undefined, tag: undefined, remote: undefined, company: undefined }
    });
  });

  it("resets page to 1 when filters change", async () => {
    useSearchMock.mockReturnValue({ status: "applied", page: 3 });
    renderPage();
    await screen.findByText("Backend Engineer");

    fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "interview" } });
    
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({
      to: "/applications",
      search: expect.not.objectContaining({ page: expect.anything() })
    }));
  });
});

describe("ApplicationsPage pagination", () => {
  it("displays pagination info and disables prev on first page", async () => {
    renderPage();
    await screen.findByText("Backend Engineer");

    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("navigates to next page and disables next when at last page", async () => {
    fetchApplicationsMock.mockResolvedValueOnce({
      data: [
        { id: 1, title: "App 1", status: "applied", remote: true, applied_at: "2026-05-01", company: { id: 2, name: "Acme", website: null, location: null } },
        { id: 2, title: "App 2", status: "applied", remote: true, applied_at: "2026-05-02", company: { id: 2, name: "Acme", website: null, location: null } }
      ],
      meta: { page: 1, per_page: 2, total: 4 }
    });

    renderPage();
    await screen.findByText("App 1");

    expect(screen.getByText("Showing 1–2 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/applications",
      search: expect.objectContaining({ page: 2 })
    });
  });

  it("navigates to previous page and disables prev on first page", async () => {
    useSearchMock.mockReturnValue({ page: 2 });
    fetchApplicationsMock.mockResolvedValueOnce({
      data: [{ id: 3, title: "App 3", status: "applied", remote: true, applied_at: "2026-05-03", company: { id: 2, name: "Acme", website: null, location: null } }],
      meta: { page: 2, per_page: 2, total: 4 }
    });

    renderPage();
    await screen.findByText("App 3");

    expect(screen.getByText("Showing 3–4 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/applications",
      search: expect.objectContaining({ page: 1 })
    });
  });
});
