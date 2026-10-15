"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";

/**
 * Frontend-only route protection for the demo. It hides pages from signed-out
 * visitors in the UI; it is NOT a security boundary.
 */
export function RequireAuth({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { hydrated, session, data } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const hadSession = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (session) {
      hadSession.current = true;
      return;
    }
    if (!hadSession.current) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    // Signed out while here (e.g. log out / delete account): give the caller a moment to
    // navigate somewhere specific; otherwise (e.g. logout in another tab) go to sign-in.
    const t = setTimeout(() => router.replace("/sign-in"), 400);
    return () => clearTimeout(t);
  }, [hydrated, session, router, pathname]);

  if (!hydrated || !session || !data) {
    return (
      fallback ?? (
        <div className="flex min-h-dvh items-center justify-center" role="status">
          <Loader2 className="size-6 animate-spin text-muted" aria-hidden />
          <span className="sr-only">Loading…</span>
        </div>
      )
    );
  }
  return <>{children}</>;
}
