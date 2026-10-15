"use client";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}

/** A compact radio group of buttons for switching filters or views. */
export function Segmented<T extends string>({ value, onChange, options, label, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
              active ? "bg-surface-3 text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-primary text-primary-foreground" : "bg-surface-2")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
