import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, act, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { BoardPage } from "./page";
import { applyOptimisticMove, rollbackOptimisticMove } from "./optimistic";
import { queryKeys } from "../../lib/query-keys";
import type { ApplicationsResponse, Application } from "../applications/model";

const mutateSpy = vi.fn();
const navigateMock = vi.fn();
const useSearchMock = vi.fn();
let dragEndHandler: ((event: DragEndLike) => void) | undefined;

type DragEndLike = {
  active: { data: { current: { type: string; applicationId: number; status: Application["status"] } } };
  over: { data: { current: { type: string; status: Application["status"] } } } | null;
};

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: (...args: unknown[]) => useSearchMock(...args)
  };
});

vi.mock("@dnd-kit/core", async () => {
  const React = await import("react");
  return {
    DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd?: (event: DragEndLike) => void }) => {
      dragEndHandler = onDragEnd;
      return React.createElement("div", null, children);
    },
    DragOverlay: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    PointerSensor: class {},
    KeyboardSensor: class {},
    closestCorners: vi.fn(),
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn(() => []),
    useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false }))
  };
});

vi.mock("@dnd-kit/sortable", async () => {
  const React = await import("react");
  return {
    SortableContext: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
    verticalListSortingStrategy: vi.fn(),
    sortableKeyboardCoordinates: vi.fn(),
    useSortable: vi.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false
    })),
    arrayMove: (arr: unknown[], from: number, to: number) => {
      const copy = [...arr];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    }
  };
});

let useApplicationsData: ApplicationsResponse & { meta?: { page: number; per_page: number; total: number } } | undefined;

vi.mock("../applications/hooks", () => ({
  useApplications: () => ({
    isLoading: false,
    isError: false,
    data: useApplicationsData || {
      data: [
        { id: 1, title: "Backend Engineer", status: "applied", position: 0, company: { name: "Acme" } },
        { id: 2, title: "Frontend Engineer", status: "interview", position: 0, company: { name: "Beta" } }
      ],
      meta: { page: 1, per_page: 100, total: 2 }
    }
  }),
  useTags: () => ({ data: { data: [{ id: 1, name: "urgent", color: "#f00" }] } }),
  useMoveApplication: () => ({ mutate: mutateSpy })
}));

vi.mock("../companies/hooks", () => ({
  useCompanies: () => ({
    data: { data: [{ id: 3, user_id: 1, name: "Acme", website: null, location: null, notes: null, created_at: "", updated_at: "" }] }
  })
}));

beforeEach(() => {
  vi.clearAllMocks();
  mutateSpy.mockClear();
  navigateMock.mockClear();
  useSearchMock.mockReturnValue({});
  useApplicationsData = undefined;
});

afterEach(() => {
  cleanup();
});

describe("BoardPage", () => {
  const renderWithClient = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });

    return render(
      <QueryClientProvider client={client}>
        <BoardPage />
      </QueryClientProvider>
    );
  };

  it("renders grouped columns smoke test", () => {
    renderWithClient();
    expect(screen.getByLabelText("Search applications")).toBeInTheDocument();
    expect(screen.getByText("Wishlist")).toBeInTheDocument();
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
  });

  it("drag interaction computes move mutation payload", () => {
    renderWithClient();

    act(() => {
      dragEndHandler?.({
        active: { data: { current: { type: "card", applicationId: 1, status: "applied" } } },
        over: { data: { current: { type: "column", status: "interview" } } }
      });
    });

    expect(mutateSpy).toHaveBeenCalled();
    const [input] = mutateSpy.mock.calls[0] as [
      { id: number; status: Application["status"]; position: number; fromStatus: Application["status"] }
    ];
    expect(input).toEqual({ id: 1, status: "interview", position: 1, fromStatus: "applied" });
  });

  it("shows banner when total applications exceed 100", () => {
    useApplicationsData = {
      data: [{ id: 1, title: "Backend Engineer", status: "applied", position: 0, company: { name: "Acme" } } as Application],
      meta: { page: 1, per_page: 100, total: 150 }
    };
    renderWithClient();
    expect(screen.getByText("Board shows newest 100 applications. Use the table for the full list.")).toBeInTheDocument();
  });

  it("does not show banner when total applications <= 100", () => {
    useApplicationsData = {
      data: [{ id: 1, title: "Backend Engineer", status: "applied", position: 0, company: { name: "Acme" } } as Application],
      meta: { page: 1, per_page: 100, total: 50 }
    };
    renderWithClient();
    expect(screen.queryByText("Board shows newest 100 applications. Use the table for the full list.")).not.toBeInTheDocument();
  });
});

describe("optimistic behavior", () => {
  it("updates cache then rolls back on failure", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const initial: ApplicationsResponse = {
      data: [
        { id: 1, title: "A", status: "applied", position: 0, company: { name: "Acme" } } as Application,
        { id: 2, title: "B", status: "interview", position: 0, company: { name: "Beta" } } as Application
      ],
      meta: { page: 1, per_page: 100, total: 2 }
    };

    queryClient.setQueryData(queryKeys.applications({}), initial);

    const context = await applyOptimisticMove({
      queryClient,
      input: { id: 1, status: "interview", position: 1 },
      fromStatus: "applied"
    });

    const optimistic = queryClient.getQueryData<ApplicationsResponse>(queryKeys.applications({}));
    expect(optimistic?.data.find((item) => item.id === 1)?.status).toBe("interview");

    rollbackOptimisticMove(queryClient, context.previous);

    const rolledBack = queryClient.getQueryData<ApplicationsResponse>(queryKeys.applications({}));
    expect(rolledBack).toEqual(initial);
  });

  it("optimistic move dispatches against per_page: 100 query key", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const boardKey = queryKeys.applications({ per_page: 100 });

    const initial: ApplicationsResponse = {
      data: [
        { id: 1, title: "A", status: "applied", position: 0, company: { name: "Acme" } } as Application,
        { id: 2, title: "B", status: "interview", position: 0, company: { name: "Beta" } } as Application
      ],
      meta: { page: 1, per_page: 100, total: 2 }
    };

    queryClient.setQueryData(boardKey, initial);

    const context = await applyOptimisticMove({
      queryClient,
      input: { id: 1, status: "interview", position: 1 },
      fromStatus: "applied",
      queryKey: boardKey
    });

    const optimistic = queryClient.getQueryData<ApplicationsResponse>(boardKey);
    expect(optimistic?.data.find((item) => item.id === 1)?.status).toBe("interview");

    rollbackOptimisticMove(queryClient, context.previous, boardKey);

    const rolledBack = queryClient.getQueryData<ApplicationsResponse>(boardKey);
    expect(rolledBack).toEqual(initial);
  });
});
