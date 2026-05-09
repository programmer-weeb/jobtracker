import { useMemo, useState } from "react";
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
import { useApplications, useMoveApplication } from "../applications/hooks";
import { applicationStatuses, type ApplicationStatus, type ApplicationsResponse } from "../applications/model";
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
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useApplications();
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  const columns = useMemo(() => toBoardColumns(data), [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const moveMutation = useMoveApplication({
    onMutate: (input: { id: number; status: ApplicationStatus; position: number; fromStatus: ApplicationStatus }) =>
      applyOptimisticMove({
        queryClient,
        input,
        fromStatus: input.fromStatus
      }),
    onError: (_err, _input, context: { previous?: ApplicationsResponse } | undefined) => {
      rollbackOptimisticMove(queryClient, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications({}) });
    }
  });

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
  );
}
