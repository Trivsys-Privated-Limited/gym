"use client";

import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { updateSettings } from "@/lib/actions";
import { useUserData } from "@/lib/store/app-store";
import type { DemoRole } from "@/lib/types";
import { ROLE_LABELS } from "./role-switcher";

/** Hides staff-only demo screens from the simulated Member role. UI only — not access control. */
export function RoleGate({ allow, children }: { allow: DemoRole[]; children: React.ReactNode }) {
  const { data, update } = useUserData();
  const role = data.settings.demoRole;
  if (allow.includes(role)) return <>{children}</>;
  const target = allow.includes("admin") ? "admin" : allow[0]!;
  return (
    <EmptyState
      icon={ShieldOff}
      title={`Not available in the ${ROLE_LABELS[role]} view`}
      description={`This screen is for ${allow.map((r) => ROLE_LABELS[r]).join(" and ")} roles in the demo. Switch the simulated role to explore it.`}
      action={<Button onClick={() => update((d) => updateSettings(d, { demoRole: target }))}>View as {ROLE_LABELS[target]}</Button>}
    />
  );
}
