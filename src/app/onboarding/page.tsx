"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Home } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { completeOnboarding } from "@/lib/actions";
import { DIET_PREFERENCES, EQUIPMENT, EXPERIENCE, GOALS } from "@/lib/constants";
import { WEEKDAYS } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { DietPreference, Equipment, Experience, FitnessGoal, Profile, WorkoutLocation } from "@/lib/types";
import { cn, fromDisplayWeight } from "@/lib/utils";

const ALLERGIES = ["Nuts", "Peanuts", "Dairy", "Gluten", "Eggs", "Soy", "Shellfish", "Fish"];
const DURATIONS = [20, 30, 45, 60, 75, 90];

function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  role = "radio",
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  role?: "radio" | "checkbox";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
        selected ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-border-strong",
      )}
    >
      {icon && <span className={cn("mt-0.5", selected ? "text-accent-text" : "text-muted")}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
        )}
        aria-hidden
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

function Chip({ selected, onToggle, children, label }: { selected: boolean; onToggle: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "inline-flex h-10 min-w-12 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-surface text-foreground hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const { data, update } = useUserData();
  const units = data.settings.units;
  const p = data.profile;

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<FitnessGoal>(p.goal);
  const [experience, setExperience] = useState<Experience>(p.experience);
  const [location, setLocation] = useState<WorkoutLocation>(p.location);
  const [equipment, setEquipment] = useState<Equipment[]>(p.equipment);
  const [days, setDays] = useState<number[]>(p.workoutDays);
  const [minutes, setMinutes] = useState(p.sessionMinutes);
  const [diet, setDiet] = useState<DietPreference>(p.diet);
  const [allergies, setAllergies] = useState<string[]>(p.allergies);
  const [otherAllergy, setOtherAllergy] = useState("");
  const [startWeight, setStartWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [personalGoal, setPersonalGoal] = useState(p.personalGoal ?? "");
  const [weightError, setWeightError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const steps = [
    { title: "What’s your main goal?", optional: false },
    { title: "How experienced are you?", optional: false },
    { title: "Where will you train?", optional: true },
    { title: "When can you work out?", optional: true },
    { title: "Any food preferences?", optional: true },
    { title: "Personal targets", optional: true },
  ];
  const last = step === steps.length - 1;

  function parseWeight(v: string) {
    if (!v.trim()) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return NaN;
    return fromDisplayWeight(n, units);
  }

  function finish(skipTargets = false) {
    let start: number | undefined;
    let target: number | undefined;
    if (!skipTargets) {
      start = parseWeight(startWeight);
      target = parseWeight(targetWeight);
      const bad = [start, target].some((w) => w !== undefined && (Number.isNaN(w) || w < 30 || w > 300));
      if (bad) {
        setWeightError(`Enter weights between ${units === "kg" ? "30 and 300 kg" : "66 and 660 lb"}, or leave them blank.`);
        return;
      }
    }
    setSaving(true);
    const extra = otherAllergy.trim() ? [otherAllergy.trim()] : [];
    const answers: Partial<Profile> = {
      goal,
      experience,
      location,
      equipment: equipment.length ? equipment : ["none"],
      workoutDays: days,
      sessionMinutes: minutes,
      diet,
      allergies: [...new Set([...allergies, ...extra])],
      startingWeightKg: start,
      targetWeightKg: target,
      personalGoal: skipTargets ? undefined : personalGoal.trim() || undefined,
    };
    update((d) => completeOnboarding(d, answers));
    toast.success("You’re all set!", { description: "We’ve added a starter plan to your calendar. Edit it anytime." });
    router.replace("/dashboard");
  }

  function next() {
    if (last) finish();
    else setStep((s) => s + 1);
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Logo href="/dashboard" />
        <Button variant="ghost" size="sm" onClick={() => finish(true)} disabled={saving}>
          Skip setup
        </Button>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Step {step + 1} of {steps.length}
          </span>
          {steps[step]!.optional && <span>Optional</span>}
        </div>
        <Progress value={((step + 1) / steps.length) * 100} label="Onboarding progress" className="mt-2" />

        <section aria-labelledby="ob-title" className="mt-10 animate-fade-in" key={step}>
          <h1 id="ob-title" className="font-display text-4xl font-bold uppercase sm:text-5xl">
            {steps[step]!.title}
          </h1>

          {step === 0 && (
            <div role="radiogroup" aria-labelledby="ob-title" className="mt-8 grid gap-3 sm:grid-cols-2">
              {(Object.keys(GOALS) as FitnessGoal[]).map((g) => (
                <OptionCard key={g} selected={goal === g} onSelect={() => setGoal(g)} title={GOALS[g].label} description={GOALS[g].description} />
              ))}
            </div>
          )}

          {step === 1 && (
            <div role="radiogroup" aria-labelledby="ob-title" className="mt-8 grid gap-3">
              {(Object.keys(EXPERIENCE) as Experience[]).map((x) => (
                <OptionCard key={x} selected={experience === x} onSelect={() => setExperience(x)} title={EXPERIENCE[x].label} description={EXPERIENCE[x].description} />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 space-y-8">
              <div role="radiogroup" aria-label="Preferred location" className="grid gap-3 sm:grid-cols-2">
                <OptionCard selected={location === "gym"} onSelect={() => setLocation("gym")} title="At the gym" description="Access to machines, racks and free weights." icon={<Building2 className="size-5" />} />
                <OptionCard selected={location === "home"} onSelect={() => setLocation("home")} title="At home" description="Bodyweight or a little equipment." icon={<Home className="size-5" />} />
              </div>
              <fieldset>
                <legend className="text-sm font-medium">Equipment you can use</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(EQUIPMENT) as Equipment[]).map((e) => (
                    <Chip key={e} selected={equipment.includes(e)} onToggle={() => setEquipment((l) => toggle(l, e))}>
                      {EQUIPMENT[e]}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {step === 3 && (
            <div className="mt-8 space-y-8">
              <fieldset>
                <legend className="text-sm font-medium">Workout days</legend>
                <p className="mt-1 text-sm text-muted">Rest days matter too — pick what’s realistic for you.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => (
                    <Chip key={d.value} selected={days.includes(d.value)} onToggle={() => setDays((l) => toggle(l, d.value))} label={d.long}>
                      {d.short}
                    </Chip>
                  ))}
                </div>
                <p className="mt-2 text-xs text-subtle" aria-live="polite">
                  {days.length} day{days.length === 1 ? "" : "s"} per week selected
                </p>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium">Approximate session length</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DURATIONS.map((m) => (
                    <Chip key={m} selected={minutes === m} onToggle={() => setMinutes(m)}>
                      {m} min
                    </Chip>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {step === 4 && (
            <div className="mt-8 space-y-8">
              <Field label="Dietary preference" htmlFor="ob-diet" className="max-w-sm">
                <Select id="ob-diet" value={diet} onChange={(e) => setDiet(e.target.value as DietPreference)}>
                  {(Object.keys(DIET_PREFERENCES) as DietPreference[]).map((k) => (
                    <option key={k} value={k}>
                      {DIET_PREFERENCES[k]}
                    </option>
                  ))}
                </Select>
              </Field>
              <fieldset>
                <legend className="text-sm font-medium">Food allergies or intolerances</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ALLERGIES.map((a) => (
                    <Chip key={a} selected={allergies.includes(a)} onToggle={() => setAllergies((l) => toggle(l, a))}>
                      {a}
                    </Chip>
                  ))}
                </div>
                <Field label="Other" htmlFor="ob-other-allergy" optional className="mt-4 max-w-sm">
                  <Input id="ob-other-allergy" value={otherAllergy} onChange={(e) => setOtherAllergy(e.target.value)} placeholder="e.g. sesame" maxLength={40} />
                </Field>
              </fieldset>
              <p className="text-xs text-subtle">
                We use this to filter sample meals only. Always check ingredients yourself — this is not medical or allergy advice.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="mt-8 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Starting weight (${units})`} htmlFor="ob-start" optional>
                  <Input id="ob-start" inputMode="decimal" type="number" step="0.1" value={startWeight} onChange={(e) => setStartWeight(e.target.value)} />
                </Field>
                <Field label={`Target weight (${units})`} htmlFor="ob-target" optional>
                  <Input id="ob-target" inputMode="decimal" type="number" step="0.1" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
                </Field>
              </div>
              <Field label="A personal goal in your own words" htmlFor="ob-goal" optional hint="e.g. “Walk 30 minutes every day” or “Do 10 push-ups in a row”">
                <Textarea id="ob-goal" aria-describedby="ob-goal-hint" maxLength={140} value={personalGoal} onChange={(e) => setPersonalGoal(e.target.value)} />
              </Field>
              {weightError && (
                <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                  {weightError}
                </p>
              )}
              <p className="text-xs text-subtle">Targets are for your own tracking. FITFLOW doesn’t assess health or prescribe diets.</p>
            </div>
          )}
        </section>

        <div className="mt-12 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || saving}>
            <ArrowLeft /> Back
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {steps[step]!.optional && (
              <Button variant="outline" onClick={() => (last ? finish(true) : setStep((s) => s + 1))} disabled={saving}>
                Skip this step
              </Button>
            )}
            <Button onClick={next} loading={saving}>
              {last ? "Finish & build my plan" : "Continue"} {!last && <ArrowRight />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingWizard />
    </RequireAuth>
  );
}
