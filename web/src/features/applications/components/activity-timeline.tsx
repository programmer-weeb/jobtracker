import type { Application, Note } from "../model";

type TimelineItem = {
  id: string;
  label: string;
  at: string;
};

function buildTimeline(application: Application, notes: Note[]): TimelineItem[] {
  const base: TimelineItem[] = [
    {
      id: `status-${application.id}`,
      label: `Status: ${application.status}`,
      at: application.updated_at
    }
  ];

  if (application.applied_at) {
    base.push({ id: `applied-${application.id}`, label: "Applied", at: application.applied_at });
  }

  const noteItems = notes.map((note) => ({ id: `note-${note.id}`, label: `Note: ${note.body}`, at: note.created_at }));

  return [...base, ...noteItems].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

interface ActivityTimelineProps {
  application: Application;
  notes: Note[];
}

export function ActivityTimeline({ application, notes }: ActivityTimelineProps) {
  const items = buildTimeline(application, notes);

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
