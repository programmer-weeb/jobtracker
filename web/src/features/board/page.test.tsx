import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { BoardPage } from "./page";
import { applyOptimisticMove, rollbackOptimisticMove } from "./optimistic";
import { queryKeys } from "../../lib/query-keys";
import type { ApplicationsResponse, Application } from "../applications/model";

const mutateSpy = vi.fn();
const navigateMock = vi.fn();
const useSearchMock = vi.fn();
let dragEndHandler: ((event: DragEndLike) => void) | undefined;
let dragStartHandler: ((event: DragStartLike) => void) | undefined;

type CapturedMoveOptions = {
  onMutate?: (input: { id: number; status: Application["status"]; position: number; fromStatus: Application["status"] }) => Promise<{ previous?: ApplicationsResponse }>;
  onError?: (err: Error, input: unknown, context: { previous?: ApplicationsResponse } | undefined) => void;
  onSettled?: () => void;
};
let capturedMoveOptions: CapturedMoveOptions | undefined;

type DragStartLike = {
  active: { id: string | number };
};

type DragEndLike = {
  active: { data: { current: { type: string; applicationId: number; status: Application["status"] } } };
  over: { data: { current: { type: string; applicationId?: number; status: Application["status"] } } } | null;
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
    DndContext: ({ children, onDragEnd, onDragStart }: { children: React.ReactNode; onDragEnd?: (event: DragEndLike) => void; onDragStart?: (event: DragStartLike) => void }) => {
      dragEndHandler = onDragEnd;
      dragStartHandler = onDragStart;
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
let useApplicationsIsLoading = false;
let useApplicationsIsError = false;
let useApplicationsError: Error | null = null;

vi.mock("../applications/hooks", () => ({
  useApplications: () => ({
    isLoading: useApplicationsIsLoading,
    isError: useApplicationsIsError,
    error: useApplicationsError,
    data: useApplicationsData || {
      data: [
        { id: 1, title: "Backend Engineer", status: "applied", position: 0, company: { name: "Acme" } },
        { id: 2, title: "Frontend Engineer", status: "interview", position: 0, company: { name: "Beta" } }
      ],
      meta: { page: 1, per_page: 100, total: 2 }
    }
  }),
  useTags: () => ({ data: { data: [{ id: 1, name: "urgent", color: "#f00" }] } }),
  useMoveApplication: (options: unknown) => {
    capturedMoveOptions = options as CapturedMoveOptions;
    return { mutate: mutateSpy };
  }
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
  useApplicationsIsLoading = false;
  useApplicationsIsError = false;
  useApplicationsError = null;
  capturedMoveOptions = undefined;
});

afterEach(() => {
  cleanup();
});

describe("BoardPage", () => {
  const renderWithClient = (client?: QueryClient) => {
    const qc = client ?? new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });

    render(
      <QueryClientProvider client={qc}>
        <BoardPage />
      </QueryClientProvider>
    );
    return qc;
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

  it("opens application detail from a board card", () => {
    renderWithClient();

    fireEvent.click(screen.getByRole("link", { name: /backend engineer acme/i }));

    expect(navigateMock).toHaveBeenCalledWith({ to: "/applications/$id", params: { id: "1" } });
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

  it("renders loading state", () => {
    useApplicationsIsLoading = true;
    renderWithClient();
    expect(screen.getByText("Loading board...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    useApplicationsIsError = true;
    useApplicationsError = new Error("Network error");
    renderWithClient();
    expect(screen.getByText("Failed to load board: Network error")).toBeInTheDocument();
  });

  it("filter onChange calls navigate with page cleared", () => {
    renderWithClient();
    fireEvent.click(screen.getByRole("button", { name: "Filter by status" }));
    fireEvent.click(screen.getByText("applied"));
    expect(navigateMock).toHaveBeenCalledWith({
      to: "/board",
      search: expect.objectContaining({ status: ["applied"] })
    });
    const latestCall = navigateMock.mock.calls.at(-1)?.[0] as { search?: { page?: number } };
    expect(latestCall.search?.page).toBeUndefined();
  });

  it("search input change calls navigate after debounce", () => {
    vi.useFakeTimers();
    renderWithClient();
    fireEvent.change(screen.getByLabelText("Search applications"), { target: { value: "engineer" } });
    expect(navigateMock).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({ to: "/board" }));
    vi.useRealTimers();
  });

  it("empty search trims to undefined and navigates", () => {
    vi.useFakeTimers();
    renderWithClient();
    fireEvent.change(screen.getByLabelText("Search applications"), { target: { value: "   " } });
    vi.runAllTimers();
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({ to: "/board" }));
    vi.useRealTimers();
  });

  it("reset button calls navigate with empty filters", () => {
    renderWithClient();
    fireEvent.click(screen.getByText("Reset filters"));
    expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({ to: "/board" }));
  });

  it("DragOverlay renders active card after drag start", () => {
    renderWithClient();
    expect(screen.getAllByText("Backend Engineer")).toHaveLength(1);

    act(() => {
      dragStartHandler?.({ active: { id: "card:1" } });
    });

    expect(screen.getAllByText("Backend Engineer")).toHaveLength(2);
  });

  it("dragEnd with no over target is a no-op", () => {
    renderWithClient();
    act(() => {
      dragEndHandler?.({
        active: { data: { current: { type: "card", applicationId: 1, status: "applied" } } },
        over: null
      });
    });
    expect(mutateSpy).not.toHaveBeenCalled();
  });

  it("dragEnd no-op when card dropped on same position", () => {
    renderWithClient();
    act(() => {
      dragEndHandler?.({
        active: { data: { current: { type: "card", applicationId: 1, status: "applied" } } },
        over: { data: { current: { type: "card", applicationId: 1, status: "applied" } } }
      });
    });
    expect(mutateSpy).not.toHaveBeenCalled();
  });

  it("onMutate updates query cache optimistically", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const boardKey = queryKeys.applications({ per_page: 100 });
    const initial: ApplicationsResponse = {
      data: [
        { id: 1, title: "Backend Engineer", status: "applied", position: 0, company: { name: "Acme" } } as Application,
        { id: 2, title: "Frontend Engineer", status: "interview", position: 0, company: { name: "Beta" } } as Application
      ],
      meta: { page: 1, per_page: 100, total: 2 }
    };
    qc.setQueryData(boardKey, initial);
    renderWithClient(qc);

    await capturedMoveOptions?.onMutate?.({ id: 1, status: "interview", position: 1, fromStatus: "applied" });

    const cached = qc.getQueryData<ApplicationsResponse>(boardKey);
    expect(cached?.data.find((item) => item.id === 1)?.status).toBe("interview");
  });

  it("onError rolls back query cache", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const boardKey = queryKeys.applications({ per_page: 100 });
    const initial: ApplicationsResponse = {
      data: [
        { id: 1, title: "Backend Engineer", status: "applied", position: 0, company: { name: "Acme" } } as Application,
        { id: 2, title: "Frontend Engineer", status: "interview", position: 0, company: { name: "Beta" } } as Application
      ],
      meta: { page: 1, per_page: 100, total: 2 }
    };
    qc.setQueryData(boardKey, initial);
    renderWithClient(qc);

    const context = await capturedMoveOptions?.onMutate?.({ id: 1, status: "interview", position: 1, fromStatus: "applied" });
    capturedMoveOptions?.onError?.(new Error("boom"), { id: 1, status: "interview", position: 1, fromStatus: "applied" }, context);

    const rolledBack = qc.getQueryData<ApplicationsResponse>(boardKey);
    expect(rolledBack).toEqual(initial);
  });

  it("onSettled calls invalidateQueries with active query key", () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    renderWithClient(qc);
    const spy = vi.spyOn(qc, "invalidateQueries");
    capturedMoveOptions?.onSettled?.();
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.applications({ per_page: 100 }), exact: true });
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

  it("skips optimistic cache write when query cache is empty and rollback is no-op", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const boardKey = queryKeys.applications({ per_page: 100 });

    const context = await applyOptimisticMove({
      queryClient,
      input: { id: 1, status: "interview", position: 1 },
      fromStatus: "applied",
      queryKey: boardKey
    });

    expect(context.previous).toBeUndefined();
    expect(queryClient.getQueryData<ApplicationsResponse>(boardKey)).toBeUndefined();

    rollbackOptimisticMove(queryClient, context.previous, boardKey);

    expect(queryClient.getQueryData<ApplicationsResponse>(boardKey)).toBeUndefined();
  });
});
