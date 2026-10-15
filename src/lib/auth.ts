/**
 * DEMO-ONLY authentication.
 *
 * Accounts live in this browser's localStorage. Passwords are salted and hashed
 * with SHA-256 so they are never stored in plaintext, but this is NOT secure
 * authentication: anyone with access to the browser can read or modify the data.
 * Replace this module with a real auth provider in the backend phase.
 */
import type { Account, Session } from "./types";
import { KEYS, isObject, readJSON, removeKey, writeJSON } from "./storage";
import { uid } from "./utils";

const isAccountList = (v: unknown): v is Account[] =>
  Array.isArray(v) && v.every((a) => isObject(a) && typeof a.id === "string" && typeof a.email === "string" && typeof a.passwordHash === "string");

const isSession = (v: unknown): v is Session =>
  isObject(v) && typeof v.userId === "string" && typeof v.email === "string" && typeof v.name === "string";

function bytesToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return bytesToHex(await crypto.subtle.digest("SHA-256", data));
  }
  // Fallback for non-secure contexts (e.g. LAN IP over http). Still not plaintext.
  let h = 0x811c9dc5;
  for (const b of data) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return `fnv-${h.toString(16)}`;
}

export function getAccounts(): Account[] {
  return readJSON(KEYS.accounts, isAccountList) ?? [];
}

function saveAccounts(accounts: Account[]) {
  writeJSON(KEYS.accounts, accounts);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export class AuthError extends Error {}

export async function createAccount(name: string, email: string, password: string, isDemo = false): Promise<Account> {
  const accounts = getAccounts();
  const normalized = normalizeEmail(email);
  if (accounts.some((a) => a.email === normalized)) {
    throw new AuthError("An account with this email already exists in this browser.");
  }
  const salt = uid("salt");
  const account: Account = {
    id: uid("user"),
    name: name.trim(),
    email: normalized,
    salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
    isDemo,
  };
  saveAccounts([...accounts, account]);
  return account;
}

export async function verifyCredentials(email: string, password: string): Promise<Account> {
  const account = getAccounts().find((a) => a.email === normalizeEmail(email));
  if (!account) throw new AuthError("No demo account found with that email in this browser.");
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.passwordHash) throw new AuthError("Incorrect password. Please try again.");
  return account;
}

export function updateAccountName(userId: string, name: string, email?: string) {
  const accounts = getAccounts().map((a) =>
    a.id === userId ? { ...a, name, email: email ? normalizeEmail(email) : a.email } : a,
  );
  saveAccounts(accounts);
}

export function deleteAccount(userId: string) {
  saveAccounts(getAccounts().filter((a) => a.id !== userId));
}

export function emailTaken(email: string, exceptUserId?: string) {
  const n = normalizeEmail(email);
  return getAccounts().some((a) => a.email === n && a.id !== exceptUserId);
}

/* Session: localStorage when "remember me", otherwise sessionStorage (ends with the tab). */
export function readSession(): Session | null {
  return readJSON(KEYS.session, isSession, "local") ?? readJSON(KEYS.session, isSession, "session");
}

export function writeSession(session: Session) {
  clearSession();
  writeJSON(KEYS.session, session, session.remember ? "local" : "session");
}

export function clearSession() {
  removeKey(KEYS.session, "local");
  removeKey(KEYS.session, "session");
}
