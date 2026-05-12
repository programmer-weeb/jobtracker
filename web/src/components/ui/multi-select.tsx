import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface MultiSelectOption {
  label: string;
  value: string | number;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  ariaLabel,
  placeholder = "Select...",
  className
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const focusBoundaryItem = React.useCallback((direction: "first" | "last") => {
    if (itemRefs.current.length === 0) return;
    const index = direction === "first" ? 0 : itemRefs.current.length - 1;
    itemRefs.current[index]?.focus();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string | number) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const removeSelected = (e: React.MouseEvent, value: string | number) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        ref={triggerRef}
        className={cn(
          "flex min-h-11 w-full cursor-pointer items-center justify-between rounded-full border border-black/10 bg-white px-4 py-2 text-sm transition-colors hover:border-black/20",
          isOpen && "border-black/20 ring-2 ring-black/5"
        )}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeMenu();
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? "first" : "last";
            if (isOpen) {
              focusBoundaryItem(direction);
              return;
            }
            setIsOpen(true);
            requestAnimationFrame(() => focusBoundaryItem(direction));
          }
        }}
      >
        <div className="flex flex-wrap gap-1 overflow-hidden">
          {selected.length === 0 ? (
            <span className="text-black/40">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {options
                .filter((opt) => selected.includes(opt.value))
                .slice(0, 2)
                .map((opt) => (
                  <span
                    key={opt.value}
                    className="flex items-center gap-1 rounded-full bg-[var(--brand-50)] px-2 py-0.5 text-xs font-medium text-[var(--brand)]"
                  >
                    {opt.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-[var(--brand-700)]"
                      onClick={(e) => removeSelected(e, opt.value)}
                    />
                  </span>
                ))}
              {selected.length > 2 && (
                <span className="flex items-center rounded-full bg-[var(--brand-50)] px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                  +{selected.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-black/10 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 scrollbar-thin"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeMenu();
              return;
            }
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
              return;
            }

            const activeIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
            if (activeIndex === -1 || itemRefs.current.length === 0) return;

            event.preventDefault();
            const nextIndex =
              event.key === "ArrowDown"
                ? (activeIndex + 1) % itemRefs.current.length
                : (activeIndex - 1 + itemRefs.current.length) % itemRefs.current.length;
            itemRefs.current[nextIndex]?.focus();
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No options available</div>
          ) : (
            options.map((option, index) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={isSelected}
                  key={option.value}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-black/5",
                    isSelected && "bg-[var(--brand-50)] font-medium text-[var(--brand)]"
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
