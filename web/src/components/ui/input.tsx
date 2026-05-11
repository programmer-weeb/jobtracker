import * as React from "react";
import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-full border border-black/10 bg-white px-5 py-3 text-[17px] leading-none tracking-[-0.374px] outline-none placeholder:text-[var(--muted-foreground)]",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
