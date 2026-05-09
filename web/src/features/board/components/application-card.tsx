import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";
import type { Application, ApplicationStatus } from "../../applications/model";
import { cardId } from "../dnd";

export function ApplicationCard({
  application,
  status,
  isOverlay = false
}: {
  application: Application;
  status: ApplicationStatus;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: cardId(application.id),
    data: { type: "card", applicationId: application.id, status }
  });

  return (
    <Card
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : { transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "cursor-grab border border-[var(--border)] bg-white p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40",
        isOverlay && "rotate-1 shadow-lg"
      )}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
    >
      <p className="text-sm font-semibold leading-tight">{application.title}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{application.company?.name ?? "Unknown company"}</p>
    </Card>
  );
}
