import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";
import type { Application, ApplicationStatus } from "../../applications/model";
import { cardId, columnId } from "../dnd";
import { ApplicationCard } from "./application-card";

export function BoardColumn({
  status,
  title,
  applications
}: {
  status: ApplicationStatus;
  title: string;
  applications: Application[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId(status),
    data: { type: "column", status }
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "flex max-h-[750px] min-h-72 flex-col gap-3 border border-[var(--border)] bg-[var(--canvas-parchment)] p-4",
        isOver && "ring-2 ring-[var(--ring)]"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="apple-display text-[21px] leading-none">{title}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]">{applications.length}</span>
      </div>

      <SortableContext items={applications.map((app) => cardId(app.id))} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin">
          {applications.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-white/70 px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No applications
            </div>
          ) : (
            applications.map((application) => (
              <ApplicationCard key={application.id} application={application} status={status} />
            ))
          )}
        </div>
      </SortableContext>
    </Card>
  );
}
