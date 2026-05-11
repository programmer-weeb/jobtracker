import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-[17px] font-normal leading-none tracking-[-0.374px] transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand)] text-white",
        secondary: "border border-[var(--brand)] bg-transparent text-[var(--brand)]",
        ghost: "bg-transparent text-[var(--brand)]",
        outline: "border border-[var(--border)] bg-[var(--surface-pearl)] text-[var(--foreground)]",
        destructive: "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
      },
      size: {
        default: "px-[22px] py-[11px]",
        sm: "min-h-9 px-[15px] py-2 text-sm tracking-[-0.224px]",
        lg: "min-h-12 px-7 py-3.5 text-lg font-light tracking-normal"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);

Button.displayName = "Button";
