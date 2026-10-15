import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/** Marks functionality that is simulated in this frontend-only demo. */
export function SimulatedBadge({ className, label = "Simulated" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warning",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function DemoNotice({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="note" className={cn("flex gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-foreground", className)}>
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
