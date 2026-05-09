import * as React from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-[var(--border)] bg-white/95 shadow-sm", className)} {...props} />;
}
