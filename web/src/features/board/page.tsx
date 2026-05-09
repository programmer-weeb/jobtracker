import { Card } from "../../components/ui/card";
import { useApplications } from "../applications/hooks";

const columns = ["wishlist", "applied", "interview", "offer", "rejected", "archived"] as const;

export function BoardPage() {
  const { isLoading } = useApplications();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((column) => (
        <Card key={column} className="p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{column}</h3>
          {isLoading ? <p className="text-sm">Loading cards...</p> : <p className="text-sm text-[var(--muted-foreground)]">No applications yet.</p>}
        </Card>
      ))}
    </div>
  );
}
