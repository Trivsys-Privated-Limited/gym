import { ShieldAlert } from "lucide-react";

export function DemoAuthNote() {
  return (
    <p className="mt-6 flex gap-2 rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-muted">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <span>
        <strong className="text-foreground">Demo sign-in only.</strong> Accounts are stored in this browser’s local storage and are not securely authenticated. Please
        don’t use a real password.
      </span>
    </p>
  );
}
