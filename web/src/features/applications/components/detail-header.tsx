import type { Application } from "../model";

interface DetailHeaderProps {
  application: Application;
}

export function DetailHeader({ application }: DetailHeaderProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--muted-foreground)]">{application.company.name}</p>
      <h1 className="apple-display text-[34px] leading-tight md:text-[40px]">{application.title}</h1>
      <p className="text-[17px] text-[var(--muted-foreground)]">
        {application.status} / {application.source ?? "Unknown source"}
      </p>
    </div>
  );
}
