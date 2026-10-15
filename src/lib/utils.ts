import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function pct(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return clamp(Math.round((value / total) * 100), 0, 100);
}

export function round(n: number, digits = 1) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return sec ? `${m}m ${sec}s` : `${m}m`;
  return `${sec}s`;
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export const KG_PER_LB = 0.45359237;
export function toDisplayWeight(kg: number, units: "kg" | "lb") {
  return units === "kg" ? round(kg, 1) : round(kg / KG_PER_LB, 1);
}
export function fromDisplayWeight(value: number, units: "kg" | "lb") {
  return units === "kg" ? value : round(value * KG_PER_LB, 2);
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
