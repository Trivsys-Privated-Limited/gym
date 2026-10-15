/**
 * Thin, SSR-safe wrapper around Web Storage.
 * Every key is namespaced so the demo never collides with other apps on localhost.
 * Swap this module (or the store that uses it) for API calls when a backend exists.
 */
export const STORAGE_PREFIX = "fitflow:";

export const KEYS = {
  accounts: "accounts",
  session: "session",
  theme: "theme",
  contact: "contact-messages",
  user: (id: string) => `user:${id}`,
  gym: (id: string) => `gym:${id}`,
} as const;

type Area = "local" | "session";

function area(kind: Area): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null; // Storage disabled (privacy mode, iframe sandbox…)
  }
}

export function readJSON<T>(key: string, isValid: (v: unknown) => v is T, kind: Area = "local"): T | null {
  const store = area(kind);
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_PREFIX + key);
    if (raw == null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null; // Corrupt JSON — caller falls back to defaults.
  }
}

export function writeJSON(key: string, value: unknown, kind: Area = "local"): boolean {
  const store = area(kind);
  if (!store) return false;
  try {
    store.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false; // Quota exceeded or storage unavailable.
  }
}

export function removeKey(key: string, kind: Area = "local") {
  area(kind)?.removeItem(STORAGE_PREFIX + key);
}

/** Remove every FITFLOW key from both storage areas. */
export function clearAllAppData() {
  for (const kind of ["local", "session"] as const) {
    const store = area(kind);
    if (!store) continue;
    Object.keys(store)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => store.removeItem(k));
  }
}

export const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
