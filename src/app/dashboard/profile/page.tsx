"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, describedBy } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { updateProfile } from "@/lib/actions";
import { emailTaken, updateAccountName } from "@/lib/auth";
import { DIET_PREFERENCES, EQUIPMENT, EXPERIENCE, GOALS } from "@/lib/constants";
import { WEEKDAYS } from "@/lib/dates";
import { profileSchema, type ProfileValues } from "@/lib/schemas";
import { useAppStore, useUserData } from "@/lib/store/app-store";
import type { DietPreference, Equipment, Experience, FitnessGoal, WorkoutLocation } from "@/lib/types";
import { cn, fromDisplayWeight, initials, toDisplayWeight } from "@/lib/utils";

function ToggleChip({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "h-9 rounded-lg border px-3 text-sm font-medium transition-colors",
        on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

function PersonalDetails() {
  const { data, update, session } = useUserData();
  const { setSessionName } = useAppStore();
  const p = data.profile;
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: p.name, email: p.email || session.email, heightCm: p.heightCm ?? "", bio: p.bio ?? "", personalGoal: p.personalGoal ?? "" },
  });

  function onSubmit(v: ProfileValues) {
    if (emailTaken(v.email, session.userId)) {
      setError("email", { message: "Another demo account in this browser uses this email." });
      return;
    }
    const height = v.heightCm === "" || v.heightCm === undefined ? undefined : Number(v.heightCm);
    update((d) => updateProfile(d, { name: v.name.trim(), email: v.email.trim().toLowerCase(), heightCm: height, bio: v.bio?.trim() || undefined, personalGoal: v.personalGoal?.trim() || undefined }));
    updateAccountName(session.userId, v.name.trim(), v.email);
    setSessionName(v.name.trim(), v.email.trim().toLowerCase());
    reset(v);
    toast.success("Profile saved");
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>Shown only to you in this demo.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">{initials(p.name)}</span>
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-muted">{session.email}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="pf-name" error={errors.name?.message}>
              <Input {...describedBy("pf-name", errors.name?.message)} autoComplete="name" {...register("name")} />
            </Field>
            <Field label="Email" htmlFor="pf-email" error={errors.email?.message}>
              <Input {...describedBy("pf-email", errors.email?.message)} type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Field label="Height (cm)" htmlFor="pf-height" optional error={errors.heightCm?.message}>
              <Input {...describedBy("pf-height", errors.heightCm?.message)} type="number" inputMode="numeric" {...register("heightCm")} />
            </Field>
          </div>
          <Field label="Personal goal" htmlFor="pf-goal" optional error={errors.personalGoal?.message}>
            <Input {...describedBy("pf-goal", errors.personalGoal?.message)} {...register("personalGoal")} />
          </Field>
          <Field label="Short bio" htmlFor="pf-bio" optional error={errors.bio?.message}>
            <Textarea {...describedBy("pf-bio", errors.bio?.message)} rows={2} {...register("bio")} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty}>
              <Save /> Save details
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FitnessPreferences() {
  const { data, update } = useUserData();
  const p = data.profile;
  const units = data.settings.units;
  const [goal, setGoal] = useState<FitnessGoal>(p.goal);
  const [experience, setExperience] = useState<Experience>(p.experience);
  const [location, setLocation] = useState<WorkoutLocation>(p.location);
  const [equipment, setEquipment] = useState<Equipment[]>(p.equipment);
  const [days, setDays] = useState<number[]>(p.workoutDays);
  const [minutes, setMinutes] = useState(String(p.sessionMinutes));
  const [diet, setDiet] = useState<DietPreference>(p.diet);
  const [allergies, setAllergies] = useState(p.allergies.join(", "));
  const [target, setTarget] = useState(p.targetWeightKg ? String(toDisplayWeight(p.targetWeightKg, units)) : "");
  const [error, setError] = useState<string | null>(null);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function save() {
    const mins = Number(minutes);
    if (!Number.isFinite(mins) || mins < 10 || mins > 180) return setError("Session length should be 10–180 minutes.");
    let targetKg: number | undefined;
    if (target.trim()) {
      const n = Number(target);
      targetKg = fromDisplayWeight(n, units);
      if (!Number.isFinite(n) || targetKg < 30 || targetKg > 300) return setError("Enter a sensible target weight, or leave it blank.");
    }
    setError(null);
    update((d) =>
      updateProfile(d, {
        goal,
        experience,
        location,
        equipment: equipment.length ? equipment : ["none"],
        workoutDays: days,
        sessionMinutes: mins,
        diet,
        allergies: allergies.split(",").map((a) => a.trim()).filter(Boolean),
        targetWeightKg: targetKg,
      }),
    );
    toast.success("Preferences saved");
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Fitness preferences</CardTitle>
          <CardDescription>Used to personalise suggestions. Change them anytime.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/onboarding">
            <RefreshCw /> Re-run setup
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Main goal" htmlFor="fp-goal">
            <Select id="fp-goal" value={goal} onChange={(e) => setGoal(e.target.value as FitnessGoal)}>
              {(Object.keys(GOALS) as FitnessGoal[]).map((g) => (
                <option key={g} value={g}>
                  {GOALS[g].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Experience" htmlFor="fp-exp">
            <Select id="fp-exp" value={experience} onChange={(e) => setExperience(e.target.value as Experience)}>
              {(Object.keys(EXPERIENCE) as Experience[]).map((x) => (
                <option key={x} value={x}>
                  {EXPERIENCE[x].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Preferred location" htmlFor="fp-loc">
            <Select id="fp-loc" value={location} onChange={(e) => setLocation(e.target.value as WorkoutLocation)}>
              <option value="gym">Gym</option>
              <option value="home">Home</option>
            </Select>
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Workout availability</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <ToggleChip key={d.value} on={days.includes(d.value)} onClick={() => setDays((l) => toggle(l, d.value))} label={d.long}>
                {d.short}
              </ToggleChip>
            ))}
          </div>
          <Field label="Typical session length (minutes)" htmlFor="fp-min" className="mt-4 max-w-xs">
            <Input id="fp-min" type="number" min={10} max={180} step={5} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Equipment</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(EQUIPMENT) as Equipment[]).map((e) => (
              <ToggleChip key={e} on={equipment.includes(e)} onClick={() => setEquipment((l) => toggle(l, e))}>
                {EQUIPMENT[e]}
              </ToggleChip>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Dietary preference" htmlFor="fp-diet">
            <Select id="fp-diet" value={diet} onChange={(e) => setDiet(e.target.value as DietPreference)}>
              {(Object.keys(DIET_PREFERENCES) as DietPreference[]).map((k) => (
                <option key={k} value={k}>
                  {DIET_PREFERENCES[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Allergies" htmlFor="fp-allergies" hint="Comma separated" optional>
            <Input id="fp-allergies" aria-describedby="fp-allergies-hint" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          </Field>
          <Field label={`Target weight (${units})`} htmlFor="fp-target" optional>
            <Input id="fp-target" type="number" step="0.1" value={target} onChange={(e) => setTarget(e.target.value)} />
          </Field>
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button onClick={save}>
            <Save /> Save preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" description="Your details, fitness preferences and availability." />
      <div className="space-y-6">
        <PersonalDetails />
        <FitnessPreferences />
      </div>
    </div>
  );
}
