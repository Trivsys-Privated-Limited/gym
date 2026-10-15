"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <PageSkeleton />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
