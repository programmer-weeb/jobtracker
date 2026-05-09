import { arrayMove } from "@dnd-kit/sortable";
import { applicationStatuses, type ApplicationStatus } from "../applications/model";
import type { BoardColumns } from "./model";

const CARD_PREFIX = "card:";
const COLUMN_PREFIX = "column:";

export interface DragMetaCard {
  type: "card";
  applicationId: number;
  status: ApplicationStatus;
}

export interface DragMetaColumn {
  type: "column";
  status: ApplicationStatus;
}

export interface BoardDragMove {
  applicationId: number;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  toIndex: number;
}

export function cardId(applicationId: number) {
  return `${CARD_PREFIX}${applicationId}`;
}

export function columnId(status: ApplicationStatus) {
  return `${COLUMN_PREFIX}${status}`;
}

export function parseCardId(value: string | number | undefined | null) {
  const text = String(value ?? "");
  if (!text.startsWith(CARD_PREFIX)) {
    return null;
  }
  const id = Number(text.slice(CARD_PREFIX.length));
  return Number.isFinite(id) ? id : null;
}

function clampIndex(index: number, min: number, max: number) {
  return Math.min(Math.max(index, min), max);
}

export function resolveDragMove(params: {
  activeCardId: number;
  activeStatus: ApplicationStatus;
  overType: "card" | "column";
  overStatus: ApplicationStatus;
  overCardId?: number;
  columns: BoardColumns;
}): BoardDragMove | null {
  const { activeCardId, activeStatus, overType, overStatus, overCardId, columns } = params;
  const sourceColumn = columns[activeStatus];
  const sourceIndex = sourceColumn.findIndex((item) => item.id === activeCardId);

  if (sourceIndex < 0) {
    return null;
  }

  if (overType === "column") {
    return {
      applicationId: activeCardId,
      fromStatus: activeStatus,
      toStatus: overStatus,
      toIndex: columns[overStatus].length
    };
  }

  const targetColumn = columns[overStatus];
  const overIndex = targetColumn.findIndex((item) => item.id === overCardId);
  if (overIndex < 0) {
    return null;
  }

  return {
    applicationId: activeCardId,
    fromStatus: activeStatus,
    toStatus: overStatus,
    toIndex: overIndex
  };
}

export function applyBoardMove(columns: BoardColumns, move: BoardDragMove) {
  const next = Object.fromEntries(
    applicationStatuses.map((status) => [status, [...columns[status]]])
  ) as BoardColumns;

  const source = next[move.fromStatus];
  const sourceIndex = source.findIndex((item) => item.id === move.applicationId);
  if (sourceIndex < 0) {
    return { columns, position: 0 };
  }

  if (move.fromStatus === move.toStatus) {
    const destinationIndex = clampIndex(move.toIndex, 0, source.length - 1);
    next[move.fromStatus] = arrayMove(source, sourceIndex, destinationIndex);
    return { columns: next, position: destinationIndex };
  }

  const [moved] = source.splice(sourceIndex, 1);
  moved.status = move.toStatus;

  const target = next[move.toStatus];
  const destinationIndex = clampIndex(move.toIndex, 0, target.length);
  target.splice(destinationIndex, 0, moved);

  return { columns: next, position: destinationIndex };
}
