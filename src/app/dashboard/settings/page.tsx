"use client";

import { useRouter } from "next/navigation";
import { Download, LogOut, Monitor, Moon, RotateCcw, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleSwitcher } from "@/components/gym/role-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { SimulatedBadge } from "@/components/ui/simulated";
import { Switch } from "@/components/ui/switch";
import { updateSettings } from "@/lib/actions";
import { useAppStore, useUserData } from "@/lib/store/app-store";
import type { NotificationPrefs, ThemePref, Units } from "@/lib/types";
import { cn } from "@/lib/utils";

const NOTIFS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "workoutReminders", label: "Workout reminders", description: "A nudge before planned sessions." },
  { key: "mealReminders", label: "Meal reminders", description: "Reminders to log meals." },
  { key: "hydrationReminders", label: "Hydration reminders", description: "Gentle reminders to drink water." },
  { key: "weeklySummary", label: "Weekly summary", description: "A recap of your week every Sunday." },
];

function SettingRow({ title, description, children, className }: { title: React.ReactNode; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { data, update, session } = useUserData();
  const { gym, resetData, signOut, deleteCurrentAccount } = useAppStore();
  const router = useRouter();
  const confirm = useConfirm();
  const s = data.settings;

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: "FITFLOW demo export. Contains only data stored in this browser. Password hashes are not included.",
      account: { name: session.name, email: session.email },
      data,
      gym,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitflow-demo-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  return (
    <div>
      <PageHeader title="Settings" description="Units, appearance, notifications and your demo data." />
      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border py-0">
            <SettingRow title="Weight units" description="Used for weight logs and targets.">
              <Segmented<Units>
                label="Weight units"
                value={s.units}
                onChange={(units) => {
                  update((d) => updateSettings(d, { units }));
                  toast.success(`Units set to ${units}`);
                }}
                options={[
                  { value: "kg", label: "Kilograms" },
                  { value: "lb", label: "Pounds" },
                ]}
              />
            </SettingRow>
            <SettingRow title="Theme" description="Dark is the default FITFLOW look.">
              <div role="radiogroup" aria-label="Theme" className="inline-flex gap-1 rounded-xl border border-border bg-surface p-1">
                {(
                  [
                    ["dark", "Dark", Moon],
                    ["light", "Light", Sun],
                    ["system", "System", Monitor],
                  ] as [ThemePref, string, typeof Moon][]
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={s.theme === value}
                    onClick={() => update((d) => updateSettings(d, { theme: value }))}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                      s.theme === value ? "bg-surface-3 text-foreground" : "text-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden /> {label}
                  </button>
                ))}
              </div>
            </SettingRow>
            <SettingRow title="Gym demo role" description="Simulated role switcher for the Gym area — not real authorization.">
              <RoleSwitcher />
            </SettingRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Notifications <SimulatedBadge />
              </CardTitle>
              <CardDescription>These toggles save your preference only. No real notifications, emails or messages are sent in this demo.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border py-0">
            {NOTIFS.map((n) => (
              <SettingRow key={n.key} title={<label htmlFor={`notif-${n.key}`}>{n.label}</label>} description={n.description}>
                <Switch
                  id={`notif-${n.key}`}
                  checked={s.notifications[n.key]}
                  onCheckedChange={(v) => {
                    update((d) => updateSettings(d, { notifications: { ...d.settings.notifications, [n.key]: v } }));
                    toast(`${n.label} ${v ? "on" : "off"}`, { description: "Preference saved (simulated)." });
                  }}
                />
              </SettingRow>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Your demo data</CardTitle>
              <CardDescription>Everything is stored in this browser’s localStorage for {session.email}.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border py-0">
            <SettingRow title="Export data" description="Download your workouts, meals, progress and gym demo data as JSON.">
              <Button variant="outline" onClick={exportData}>
                <Download /> Export JSON
              </Button>
            </SettingRow>
            <SettingRow title="Reset demo data" description="Restore this account to its starting state. Your login stays the same.">
              <Button
                variant="outline"
                onClick={() =>
                  confirm.ask({
                    title: "Reset all demo data?",
                    description: "Tasks, workouts, meals, progress logs and gym records for this account will be replaced with the starting data. This can’t be undone.",
                    confirmLabel: "Reset data",
                    destructive: true,
                    onConfirm: () => {
                      resetData();
                      toast.success("Demo data reset");
                      router.push("/dashboard");
                    },
                  })
                }
              >
                <RotateCcw /> Reset
              </Button>
            </SettingRow>
            <SettingRow title="Log out" description="End your demo session on this device.">
              <Button
                variant="secondary"
                onClick={() => {
                  signOut();
                  toast.success("Signed out");
                  router.replace("/sign-in");
                }}
              >
                <LogOut /> Log out
              </Button>
            </SettingRow>
            <SettingRow title="Delete demo account" description="Removes this account and all its data from this browser.">
              <Button
                variant="danger-ghost"
                onClick={() =>
                  confirm.ask({
                    title: "Delete this demo account?",
                    description: "The account and all of its data will be permanently removed from this browser.",
                    confirmLabel: "Delete account",
                    destructive: true,
                    onConfirm: () => {
                      deleteCurrentAccount();
                      toast.success("Demo account deleted");
                      router.replace("/");
                    },
                  })
                }
              >
                <Trash2 /> Delete account
              </Button>
            </SettingRow>
          </CardContent>
        </Card>
      </div>
      {confirm.element}
    </div>
  );
}
