import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useApplications } from "./hooks";

export function ApplicationsPage() {
  const { isLoading } = useApplications();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Search title/company" />
          <Input placeholder="Status" />
          <Input placeholder="Tag" />
        </div>
      </Card>
      <Card className="p-4">
        {isLoading ? (
          <p className="text-sm">Loading applications...</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead><tr><th>Role</th><th>Company</th><th>Status</th><th>Applied</th></tr></thead>
              <tbody><tr><td colSpan={4} className="py-8 text-center text-[var(--muted-foreground)]">No applications found.</td></tr></tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
