import { applicationStatuses, type Application, type ApplicationStatus, type ApplicationsResponse } from "../applications/model";

export type BoardColumns = Record<ApplicationStatus, Application[]>;

export function createEmptyBoardColumns(): BoardColumns {
  return applicationStatuses.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {} as BoardColumns);
}

export function toBoardColumns(response: ApplicationsResponse | undefined): BoardColumns {
  const columns = createEmptyBoardColumns();
  if (!response) {
    return columns;
  }

  for (const application of response.data) {
    columns[application.status].push(application);
  }

  for (const status of applicationStatuses) {
    columns[status].sort((a, b) => a.position - b.position || a.id - b.id);
  }

  return columns;
}
