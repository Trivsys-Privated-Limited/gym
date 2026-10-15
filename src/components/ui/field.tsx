import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: React.ReactNode;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error, wired up for screen readers via ids. */
export function Field({ label, htmlFor, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-subtle">(optional)</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props to spread onto a control so it is described by its Field's error/hint. */
export function describedBy(id: string, error?: string, hasHint?: boolean) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const;
}
