"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { GymData, Session, ThemePref, UserData } from "@/lib/types";
import { KEYS, STORAGE_PREFIX, isObject, readJSON, removeKey, writeJSON } from "@/lib/storage";
import {
  AuthError,
  clearSession,
  createAccount,
  deleteAccount,
  getAccounts,
  readSession,
  verifyCredentials,
  writeSession,
} from "@/lib/auth";
import { DATA_VERSION, DEFAULT_SETTINGS, defaultProfile, demoUserData, emptyUserData } from "@/lib/data/seed";
import { GYM_DATA_VERSION, seedGymData } from "@/lib/data/gym-seed";
import { DEMO_ACCOUNT } from "@/lib/brand";
import { todayISO } from "@/lib/dates";

/* ----------------------------- validation ---------------------------- */

const USER_ARRAYS = ["tasks", "habits", "routines", "schedule", "sessions", "meals", "weights", "measurements", "personalBests", "goals", "activity"] as const;

function isUserData(v: unknown): v is UserData {
  return (
    isObject(v) &&
    v.version === DATA_VERSION &&
    isObject(v.profile) &&
    isObject(v.settings) &&
    isObject(v.habitLog) &&
    isObject(v.water) &&
    USER_ARRAYS.every((k) => Array.isArray(v[k]))
  );
}

function isGymData(v: unknown): v is GymData {
  return (
    isObject(v) &&
    v.version === GYM_DATA_VERSION &&
    ["plans", "members", "payments", "attendance", "trainers", "classes", "bookings"].every((k) => Array.isArray(v[k]))
  );
}

/** Fill in any fields added after the data was first stored. */
function normalizeUserData(d: UserData): UserData {
  return {
    ...d,
    profile: { ...defaultProfile(d.profile.name ?? "", d.profile.email ?? ""), ...d.profile },
    settings: {
      ...DEFAULT_SETTINGS,
      ...d.settings,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(d.settings.notifications ?? {}) },
    },
  };
}

/* -------------------------------- theme ------------------------------- */

export function resolveTheme(pref: ThemePref): "dark" | "light" {
  if (pref !== "system") return pref;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(pref: ThemePref) {
  document.documentElement.dataset.theme = resolveTheme(pref);
  writeJSON(KEYS.theme, pref);
}

/* -------------------------------- store ------------------------------- */

interface AppStore {
  /** False during SSR and the first client render — render skeletons until true. */
  hydrated: boolean;
  session: Session | null;
  data: UserData | null;
  gym: GymData | null;
  signIn(email: string, password: string, remember: boolean): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  exploreDemo(): Promise<void>;
  signOut(): void;
  updateData(recipe: (d: UserData) => UserData): void;
  updateGym(recipe: (g: GymData) => GymData): void;
  /** Reseed the current account (demo data for the demo account, empty for others). */
  resetData(): void;
  /** Remove the current account and all its data from this browser. */
  deleteCurrentAccount(): void;
  setSessionName(name: string, email: string): void;
}

const Ctx = createContext<AppStore | null>(null);

function loadOrSeedUser(session: Session, isDemo: boolean): UserData {
  const stored = readJSON(KEYS.user(session.userId), isUserData);
  if (stored) return normalizeUserData(stored);
  const fresh = isDemo
    ? demoUserData(todayISO(), session.name, session.email)
    : emptyUserData(session.name, session.email);
  writeJSON(KEYS.user(session.userId), fresh);
  return fresh;
}

function loadOrSeedGym(session: Session): GymData {
  const stored = readJSON(KEYS.gym(session.userId), isGymData);
  if (stored) return stored;
  const fresh = seedGymData(todayISO(), session.name, session.email);
  writeJSON(KEYS.gym(session.userId), fresh);
  return fresh;
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<UserData | null>(null);
  const [gym, setGym] = useState<GymData | null>(null);
  const skipPersist = useRef(true);

  const loadForSession = useCallback((s: Session | null) => {
    skipPersist.current = true;
    setSession(s);
    if (!s) {
      setData(null);
      setGym(null);
      return;
    }
    const isDemo = getAccounts().find((a) => a.id === s.userId)?.isDemo ?? false;
    setData(loadOrSeedUser(s, isDemo));
    setGym(loadOrSeedGym(s));
  }, []);

  // Initial hydration from storage (client only — avoids SSR mismatches).
  useEffect(() => {
    const s = readSession();
    const valid = s && getAccounts().some((a) => a.id === s.userId) ? s : null;
    if (s && !valid) clearSession();
    loadForSession(valid);
    setHydrated(true);
  }, [loadForSession]);

  // Persist changes.
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    if (session && data) writeJSON(KEYS.user(session.userId), data);
    if (session && gym) writeJSON(KEYS.gym(session.userId), gym);
  }, [session, data, gym]);

  // Theme follows the signed-in user's preference; public pages use the stored/default theme.
  useEffect(() => {
    if (!hydrated) return;
    const pref = data?.settings.theme ?? readJSON(KEYS.theme, (v): v is ThemePref => v === "dark" || v === "light" || v === "system") ?? "dark";
    applyTheme(pref);
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [hydrated, data?.settings.theme]);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith(STORAGE_PREFIX)) return;
      const s = readSession();
      if (e.key === STORAGE_PREFIX + KEYS.session || (s && e.key.endsWith(s.userId))) loadForSession(s);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadForSession]);

  const startSession = useCallback(
    (account: { id: string; name: string; email: string }, remember: boolean) => {
      const s: Session = { userId: account.id, name: account.name, email: account.email, remember, startedAt: new Date().toISOString() };
      writeSession(s);
      loadForSession(s);
    },
    [loadForSession],
  );

  const signIn = useCallback<AppStore["signIn"]>(
    async (email, password, remember) => {
      const account = await verifyCredentials(email, password);
      startSession(account, remember);
    },
    [startSession],
  );

  const signUp = useCallback<AppStore["signUp"]>(
    async (name, email, password) => {
      if (email.trim().toLowerCase() === DEMO_ACCOUNT.email) {
        throw new AuthError("That email is reserved for the demo account. Use “Explore Demo” instead.");
      }
      const account = await createAccount(name, email, password);
      startSession(account, true);
    },
    [startSession],
  );

  const exploreDemo = useCallback(async () => {
    let account = getAccounts().find((a) => a.email === DEMO_ACCOUNT.email);
    if (!account) account = await createAccount(DEMO_ACCOUNT.name, DEMO_ACCOUNT.email, DEMO_ACCOUNT.password, true);
    startSession(account, true);
  }, [startSession]);

  const signOut = useCallback(() => {
    clearSession();
    loadForSession(null);
  }, [loadForSession]);

  const updateData = useCallback((recipe: (d: UserData) => UserData) => {
    setData((prev) => (prev ? recipe(prev) : prev));
  }, []);

  const updateGym = useCallback((recipe: (g: GymData) => GymData) => {
    setGym((prev) => (prev ? recipe(prev) : prev));
  }, []);

  const resetData = useCallback(() => {
    if (!session) return;
    const keepTheme = data?.settings.theme;
    removeKey(KEYS.user(session.userId));
    removeKey(KEYS.gym(session.userId));
    loadForSession(session);
    if (keepTheme) {
      setData((d) => {
        if (!d) return d;
        const next = { ...d, settings: { ...d.settings, theme: keepTheme } };
        writeJSON(KEYS.user(session.userId), next);
        return next;
      });
    }
  }, [session, data?.settings.theme, loadForSession]);

  const deleteCurrentAccount = useCallback(() => {
    if (!session) return;
    removeKey(KEYS.user(session.userId));
    removeKey(KEYS.gym(session.userId));
    deleteAccount(session.userId);
    clearSession();
    loadForSession(null);
  }, [session, loadForSession]);

  const setSessionName = useCallback((name: string, email: string) => {
    setSession((s) => {
      if (!s) return s;
      const next = { ...s, name, email };
      writeSession(next);
      return next;
    });
  }, []);

  const value = useMemo<AppStore>(
    () => ({ hydrated, session, data, gym, signIn, signUp, exploreDemo, signOut, updateData, updateGym, resetData, deleteCurrentAccount, setSessionName }),
    [hydrated, session, data, gym, signIn, signUp, exploreDemo, signOut, updateData, updateGym, resetData, deleteCurrentAccount, setSessionName],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return ctx;
}

/** For pages under the protected dashboard layout, where data is guaranteed. */
export function useUserData() {
  const { data, updateData, session } = useAppStore();
  if (!data || !session) throw new Error("useUserData used outside an authenticated dashboard");
  return { data, update: updateData, session };
}

export function useGymData() {
  const { gym, updateGym, data } = useAppStore();
  if (!gym || !data) throw new Error("useGymData used outside an authenticated dashboard");
  return { gym, update: updateGym, role: data.settings.demoRole };
}
