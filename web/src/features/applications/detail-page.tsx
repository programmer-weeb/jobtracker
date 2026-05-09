import { useParams } from "@tanstack/react-router";
import { Card } from "../../components/ui/card";

export function ApplicationDetailPage() {
  const { id } = useParams({ from: "/authenticated/applications/$id" });

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold">Application #{id}</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">Detail drawer/page skeleton ready for Day 8.</p>
    </Card>
  );
}
