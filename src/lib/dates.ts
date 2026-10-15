import { addDays, format, parseISO, startOfWeek } from "date-fns";

/** Local calendar date as yyyy-MM-dd (never UTC-shifted). */
export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function fromISODate(s: string): Date {
  return parseISO(s);
}

export function shiftISO(s: string, days: number): string {
  return toISODate(addDays(parseISO(s), days));
}

/** Monday-based week containing the given date. */
export function weekDates(anchor: string): string[] {
  const start = startOfWeek(parseISO(anchor), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)));
}

export function formatDate(s: string, pattern = "EEE, MMM d") {
  return format(parseISO(s), pattern);
}

export function weekdayOf(s: string): number {
  return parseISO(s).getDay();
}

export const WEEKDAYS = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 0, short: "Sun", long: "Sunday" },
] as const;

export function weekdayShort(day: number) {
  return WEEKDAYS.find((w) => w.value === day)?.short ?? "";
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
