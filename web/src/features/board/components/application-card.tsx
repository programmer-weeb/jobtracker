import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
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
        "cursor-grab border border-[var(--border)] bg-white p-4 active:cursor-grabbing",
        isDragging && "opacity-40",
        isOverlay && "rotate-1"
      )}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      role={isOverlay ? undefined : "link"}
      tabIndex={isOverlay ? undefined : 0}
      onClick={() => {
        if (!isOverlay && !isDragging) {
          void navigate({ to: "/applications/$id", params: { id: application.id.toString() } });
        }
      }}
      onKeyUp={(event) => {
        if (isOverlay) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void navigate({ to: "/applications/$id", params: { id: application.id.toString() } });
        }
      }}
    >
      <p className="text-[17px] font-semibold leading-tight tracking-[-0.374px]">{application.title}</p>
      <p className="mt-1 text-sm tracking-[-0.224px] text-[var(--muted-foreground)]">{application.company?.name ?? "Unknown company"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {application.remote ? <span className="rounded-full bg-[var(--surface-pearl)] px-3 py-1 text-xs text-[var(--muted-foreground)]">Remote</span> : null}
        {(application.tags ?? []).slice(0, 2).map((tag) => (
          <span key={tag.id} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">{tag.name}</span>
        ))}
      </div>
    </Card>
  );
}
