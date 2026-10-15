"use client";

import { toast } from "sonner";
import { Segmented } from "@/components/ui/segmented";
import { updateSettings } from "@/lib/actions";
import { useUserData } from "@/lib/store/app-store";
import type { DemoRole } from "@/lib/types";

export const ROLE_LABELS: Record<DemoRole, string> = { member: "Member", trainer: "Trainer", admin: "Admin" };

/** Simulated role switcher — changes what the demo UI shows, never real permissions. */
export function RoleSwitcher() {
  const { data, update } = useUserData();
  return (
    <Segmented<DemoRole>
      label="Simulated demo role"
      value={data.settings.demoRole}
      onChange={(demoRole) => {
        update((d) => updateSettings(d, { demoRole }));
        toast(`Viewing as ${ROLE_LABELS[demoRole]}`, { description: "Simulated role — not real authorization." });
      }}
      options={(Object.keys(ROLE_LABELS) as DemoRole[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
    />
  );
}
