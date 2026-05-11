import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationDetailPage } from "./detail-page";
import type { Application } from "./model";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    useParams: () => ({ id: "42" })
  };
});

const fetchApplicationMock = vi.fn();
const fetchTagsMock = vi.fn();
const createTagMock = vi.fn();
const deleteTagMock = vi.fn();
const updateApplicationMock = vi.fn();
const createNoteMock = vi.fn();
const deleteNoteMock = vi.fn();

vi.mock("./api", () => ({
  fetchApplications: vi.fn(),
  createApplication: vi.fn(),
  moveApplication: vi.fn(),
  fetchApplication: (...args: unknown[]) => fetchApplicationMock(...args),
  fetchTags: (...args: unknown[]) => fetchTagsMock(...args),
  createTag: (...args: unknown[]) => createTagMock(...args),
  deleteTag: (...args: unknown[]) => deleteTagMock(...args),
  updateApplication: (...args: unknown[]) => updateApplicationMock(...args),
  createNote: (...args: unknown[]) => createNoteMock(...args),
  deleteNote: (...args: unknown[]) => deleteNoteMock(...args)
}));

const baseApplication: Application = {
  id: 42,
  user_id: 1,
  company_id: 2,
  title: "Backend Engineer",
  status: "applied",
  source: "LinkedIn",
  salary_min: 100000,
  salary_max: 150000,
  currency: "USD",
  remote: true,
  location: "Remote",
  url: "https://example.com/jobs/42",
  applied_at: "2026-05-01",
  position: 0,
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-02T10:00:00Z",
  company: { id: 2, name: "Acme", website: null, location: null },
  tags: [{ id: 1, name: "urgent", color: "#ff0000" }],
  notes: [{ id: 10, application_id: 42, body: "Initial note", created_at: "2026-05-03T10:00:00Z", updated_at: "2026-05-03T10:00:00Z" }],
  events: [
    {
      id: 100,
      kind: "status_changed",
      payload: { from: "wishlist", to: "applied" },
      created_at: "2026-05-02T11:00:00Z",
      updated_at: "2026-05-02T11:00:00Z"
    }
  ]
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ApplicationDetailPage />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchApplicationMock.mockResolvedValue({ data: baseApplication });
  fetchTagsMock.mockResolvedValue({ data: [{ id: 1, name: "urgent", color: "#ff0000" }, { id: 2, name: "onsite", color: "#00ff00" }] });
  createTagMock.mockResolvedValue({ data: { id: 3, name: "frontend", color: "#0066cc" } });
  deleteTagMock.mockResolvedValue({});
  updateApplicationMock.mockResolvedValue({ data: baseApplication });
  createNoteMock.mockImplementation((id, body) => {
    const newNote = { id: 11, application_id: id, body, created_at: "2026-05-04T10:00:00Z", updated_at: "2026-05-04T10:00:00Z" };
    fetchApplicationMock.mockResolvedValue({ data: { ...baseApplication, notes: [newNote, ...(baseApplication.notes || [])] } });
    return Promise.resolve({ data: newNote });
  });
  deleteNoteMock.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ApplicationDetailPage", () => {
  it("fetches and renders detail by route id", async () => {
    renderPage();

    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    expect(fetchApplicationMock).toHaveBeenCalledWith(42);
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
    expect(screen.getByText("Initial note")).toBeInTheDocument();
    expect(screen.getByText("Status changed: wishlist -> applied")).toBeInTheDocument();
  });

  it("save mutation sends expected payload", async () => {
    renderPage();

    await screen.findByText("Backend Engineer");
    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Senior Backend Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateApplicationMock).toHaveBeenCalled();
    });

    expect(updateApplicationMock.mock.calls[0][0]).toMatchObject({
      id: 42,
      application: expect.objectContaining({ title: "Senior Backend Engineer" })
    });
  });

  it("adds and deletes notes through api and updates ui", async () => {
    renderPage();

    await screen.findAllByText("Initial note");
    fireEvent.change(screen.getByPlaceholderText("Add note"), { target: { value: "Followed up" } });
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));

    await waitFor(() => expect(createNoteMock).toHaveBeenCalledWith(42, "Followed up"));
    expect(await screen.findByText("Followed up")).toBeInTheDocument();

    const deleteButtons = screen.getAllByRole("button", { name: /^delete$/i });
    fireEvent.click(deleteButtons[0]);

    // Click confirm button in dialog
    const confirmButton = await screen.findByTestId("confirm-dialog-confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => expect(deleteNoteMock).toHaveBeenCalledWith(11));
    await waitFor(() => expect(screen.queryByText("Followed up")).not.toBeInTheDocument());
  });

  it("tag selection updates application payload with tag_ids", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    fireEvent.click(screen.getByRole("button", { name: "onsite" }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateApplicationMock).toHaveBeenCalled());
    expect(updateApplicationMock.mock.calls[0][0].application.tag_ids).toEqual([1, 2]);
  });

  it("creates and deletes tags while editing", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Backend Engineer" });
    fireEvent.change(screen.getByLabelText("New tag name"), { target: { value: "frontend" } });
    fireEvent.click(screen.getByRole("button", { name: /add tag/i }));

    await waitFor(() => expect(createTagMock).toHaveBeenCalledWith({ name: "frontend", color: "#0066cc" }));

    fireEvent.click(screen.getByLabelText("Delete tag urgent"));
    await waitFor(() => expect(deleteTagMock).toHaveBeenCalledWith(1));

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(updateApplicationMock).toHaveBeenCalled());
    expect(updateApplicationMock.mock.calls[0][0].application.tag_ids).toEqual([3]);
  });

  it("renders empty timeline state when no events and no applied_at", async () => {
    fetchApplicationMock.mockResolvedValueOnce({ data: { ...baseApplication, applied_at: null, events: [] } });
    renderPage();
    expect(await screen.findByText("No activity yet.")).toBeInTheDocument();
  });
});
