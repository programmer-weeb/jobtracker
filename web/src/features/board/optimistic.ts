import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import { applicationStatuses, type ApplicationsResponse, type ApplicationStatus } from "../applications/model";
import { applyBoardMove, type BoardDragMove } from "./dnd";
import { toBoardColumns } from "./model";

export interface BoardMoveInput {
  id: number;
  status: ApplicationStatus;
  position: number;
}

export async function applyOptimisticMove(params: {
  queryClient: QueryClient;
  input: BoardMoveInput;
  fromStatus: ApplicationStatus;
}) {
  const key = queryKeys.applications({});
  await params.queryClient.cancelQueries({ queryKey: key });

  const previous = params.queryClient.getQueryData<ApplicationsResponse>(key);
  const boardBefore = toBoardColumns(previous);

  const move: BoardDragMove = {
    applicationId: params.input.id,
    fromStatus: params.fromStatus,
    toStatus: params.input.status,
    toIndex: params.input.position
  };

  const optimistic = applyBoardMove(boardBefore, move);

  params.queryClient.setQueryData<ApplicationsResponse>(key, {
    data: applicationStatuses.flatMap((status) => optimistic.columns[status])
  });

  return { previous };
}

export function rollbackOptimisticMove(queryClient: QueryClient, previous: ApplicationsResponse | undefined) {
  if (!previous) {
    return;
  }
  queryClient.setQueryData(queryKeys.applications({}), previous);
}
