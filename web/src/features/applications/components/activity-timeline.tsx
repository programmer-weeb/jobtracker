import type { Application, ApplicationEvent } from "../model";

type TimelineItem = {
  id: string;
  label: string;
  at: string;
};

function eventLabel(event: ApplicationEvent): string {
  if (event.kind === "status_changed") {
    const from = typeof event.payload.from === "string" ? event.payload.from : "unknown";
    const to = typeof event.payload.to === "string" ? event.payload.to : "unknown";
    return `Status changed: ${from} -> ${to}`;
  }
  if (event.kind === "note_added") {
    return "Note added";
  }
  return "Reminder sent";
}

function buildTimeline(application: Application): TimelineItem[] {
  const eventItems = (application.events ?? []).map((event) => ({
    id: `event-${event.id}`,
    label: eventLabel(event),
    at: event.created_at
  }));
  const base: TimelineItem[] = [];
  if (application.applied_at) {
    base.push({ id: `applied-${application.id}`, label: "Applied", at: application.applied_at });
  }

  return [...eventItems, ...base].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

interface ActivityTimelineProps {
  application: Application;
}

export function ActivityTimeline({ application }: ActivityTimelineProps) {
  const items = buildTimeline(application);

  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted-foreground)]">No activity yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-md border border-[var(--border)] p-2 text-sm">
          <p>{item.label}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{new Date(item.at).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
