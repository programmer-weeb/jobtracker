import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BoardPage } from "./page";
import { applyOptimisticMove, rollbackOptimisticMove } from "./optimistic";
import { queryKeys } from "../../lib/query-keys";
import type { ApplicationsResponse, Application } from "../applications/model";

const mutateSpy = vi.fn();
let dragEndHandler: ((event: DragEndLike) => void) | undefined;

type DragEndLike = {
  active: { data: { current: { type: string; applicationId: number; status: Application["status"] } } };
  over: { data: { current: { type: string; status: Application["status"] } } } | null;
};

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

vi.mock("../applications/hooks", () => ({
  useApplications: () => ({
    isLoading: false,
    isError: false,
    data: {
      data: [
        { id: 1, title: "Backend Engineer", status: "applied", position: 0, company: { name: "Acme" } },
        { id: 2, title: "Frontend Engineer", status: "interview", position: 0, company: { name: "Beta" } }
      ]
    }
  }),
  useMoveApplication: () => ({ mutate: mutateSpy })
}));

beforeEach(() => {
  mutateSpy.mockClear();
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
});

describe("optimistic behavior", () => {
  it("updates cache then rolls back on failure", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const initial: ApplicationsResponse = {
      data: [
        { id: 1, title: "A", status: "applied", position: 0, company: { name: "Acme" } } as Application,
        { id: 2, title: "B", status: "interview", position: 0, company: { name: "Beta" } } as Application
      ]
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
});
