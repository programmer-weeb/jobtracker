import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import { boardRoute } from "../../routes/board";
import { useCompanies } from "../companies/hooks";
import { Card } from "../../components/ui/card";
import { useApplications, useMoveApplication, useTags, type ApplicationsFilters } from "../applications/hooks";
import { applicationStatuses, type ApplicationStatus, type ApplicationsResponse } from "../applications/model";
import { normalizeApplicationFilters } from "../applications/api";
import { ApplicationsFiltersBar } from "../applications/components/filters-bar";
import { toSearchFilters } from "../applications/filters";
import { parseCardId, resolveDragMove } from "./dnd";
import { applyOptimisticMove, rollbackOptimisticMove } from "./optimistic";
import { toBoardColumns } from "./model";
import { BoardColumn } from "./components/board-column";
import { ApplicationCard } from "./components/application-card";

const boardTitles: Record<ApplicationStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  archived: "Archived"
};

export function BoardPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: boardRoute.id });
  const searchDebounceRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const filters = useMemo(() => ({ ...search }) as ApplicationsFilters, [search]);
  const boardFilters = useMemo(() => ({ ...filters, per_page: 100 }), [filters]);
  const activeQueryKey = useMemo(() => queryKeys.applications(normalizeApplicationFilters(boardFilters)), [boardFilters]);
  const { data, isLoading, isError, error } = useApplications(boardFilters);
  const { data: tagsResponse } = useTags();
  const { data: companiesResponse } = useCompanies();
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  const columns = useMemo(() => toBoardColumns(data), [data]);
  const tags = tagsResponse?.data ?? [];
  const companies = useMemo(
    () =>
      (companiesResponse?.data ?? []).map((company) => ({
        id: company.id,
        name: company.name,
        website: company.website,
        location: company.location
      })),
    [companiesResponse]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moveMutation = useMoveApplication({
    onMutate: (input: { id: number; status: ApplicationStatus; position: number; fromStatus: ApplicationStatus }) =>
      applyOptimisticMove({
        queryClient,
        input,
        fromStatus: input.fromStatus,
        queryKey: activeQueryKey
      }),
    onError: (_err, _input, context: { previous?: ApplicationsResponse } | undefined) => {
      rollbackOptimisticMove(queryClient, context?.previous, activeQueryKey);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: activeQueryKey, exact: true });
    }
  });

  useEffect(
    () => () => {
      if (searchDebounceRef.current !== null) {
        window.clearTimeout(searchDebounceRef.current);
      }
    },
    []
  );

  if (isLoading) {
    return <p className="text-sm">Loading board...</p>;
  }

  if (isError) {
    return <p className="text-sm text-[var(--danger)]">Failed to load board: {(error as Error).message}</p>;
  }

  const allCards = applicationStatuses.flatMap((status) => columns[status]);
  const activeCard = allCards.find((item) => item.id === activeCardId) ?? null;

  const onDragStart = (event: DragStartEvent) => {
    const id = parseCardId(event.active.id);
    setActiveCardId(id);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    const activeMeta = event.active.data.current as { type?: string; applicationId?: number; status?: ApplicationStatus } | undefined;
    const overMeta = event.over?.data.current as { type?: string; applicationId?: number; status?: ApplicationStatus } | undefined;

    if (!event.over || activeMeta?.type !== "card" || !activeMeta.status || !overMeta?.type || !overMeta.status) {
      return;
    }

    const move = resolveDragMove({
      activeCardId: activeMeta.applicationId ?? 0,
      activeStatus: activeMeta.status,
      overType: overMeta.type === "column" ? "column" : "card",
      overStatus: overMeta.status,
      overCardId: overMeta.applicationId,
      columns
    });

    if (!move) {
      return;
    }

    const currentList = columns[move.fromStatus];
    const currentIndex = currentList.findIndex((item) => item.id === move.applicationId);
    if (move.fromStatus === move.toStatus && currentIndex === move.toIndex) {
      return;
    }

    moveMutation.mutate(
      { id: move.applicationId, status: move.toStatus, position: move.toIndex, fromStatus: move.fromStatus }
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <ApplicationsFiltersBar
          filters={filters}
          tags={tags}
          companies={companies}
          onChange={(next) => {
            void navigate({ to: "/board", search: toSearchFilters(next) });
          }}
          onSearchChange={(value) => {
            if (searchDebounceRef.current !== null) {
              window.clearTimeout(searchDebounceRef.current);
            }

            searchDebounceRef.current = window.setTimeout(() => {
              void navigate({
                to: "/board",
                search: toSearchFilters({ ...filters, q: value.trim() || undefined })
              });
            }, 300);
          }}
          onReset={() => {
            void navigate({ to: "/board", search: toSearchFilters({}) });
          }}
        />
      </Card>
      {data?.meta && data.meta.total > 100 && (
        <Card className="p-4 bg-[var(--muted)]">
          <p className="text-sm text-[var(--muted-foreground)]">
            Board shows newest 100 applications. Use the table for the full list.
          </p>
        </Card>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {applicationStatuses.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              title={boardTitles[status]}
              applications={columns[status]}
            />
          ))}
        </div>
        <DragOverlay>{activeCard ? <ApplicationCard application={activeCard} status={activeCard.status} isOverlay /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
