import type { Application } from "../model";

interface DetailHeaderProps {
  application: Application;
}

export function DetailHeader({ application }: DetailHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">{application.title}</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        {application.company.name} • {application.status} • {application.source ?? "Unknown source"}
      </p>
    </div>
  );
}
