import type { Note } from "../model";
import { Button } from "../../../components/ui/button";

interface NotesListProps {
  notes: Note[];
  onDelete: (id: number) => void;
  deletingId?: number;
}

export function NotesList({ notes, onDelete, deletingId }: NotesListProps) {
  if (!notes.length) {
    return <p className="text-sm text-[var(--muted-foreground)]">No notes yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-md border border-[var(--border)] p-3">
          <p className="text-sm">{note.body}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--muted-foreground)]">{new Date(note.created_at).toLocaleString()}</p>
            <Button
              type="button"
              variant="ghost"
              disabled={deletingId === note.id}
              onClick={() => onDelete(note.id)}
              className="text-[var(--danger)]"
            >
              {deletingId === note.id ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
