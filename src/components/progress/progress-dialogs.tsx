"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { saveGoal, saveMeasurement, savePersonalBest, saveWeight } from "@/lib/actions";
import { todayISO } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { Goal, GoalMetric, MeasurementEntry, PBUnit, PersonalBest, WeightEntry } from "@/lib/types";
import { fromDisplayWeight, toDisplayWeight } from "@/lib/utils";

interface Base<T> {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entry?: T | null;
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-sm text-danger">
      {error}
    </p>
  ) : null;
}

/* -------------------------------- Weight ------------------------------- */

export function WeightDialog({ open, onOpenChange, entry }: Base<WeightEntry>) {
  const { data, update } = useUserData();
  const units = data.settings.units;
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(entry?.date ?? todayISO());
    setValue(entry ? String(toDisplayWeight(entry.weightKg, units)) : "");
    setNote(entry?.note ?? "");
    setError(null);
  }, [open, entry, units]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(value);
    const kg = fromDisplayWeight(n, units);
    if (!value || !Number.isFinite(n) || kg < 30 || kg > 300) return setError(`Enter a weight between ${units === "kg" ? "30–300 kg" : "66–660 lb"}.`);
    if (!date || date > todayISO()) return setError("Pick a date that isn’t in the future.");
    if (!entry && data.weights.some((w) => w.date === date)) return setError("You already logged a weight for this date — edit that entry instead.");
    update((d) => saveWeight(d, { id: entry?.id, date, weightKg: Math.round(kg * 10) / 10, note: note.trim() || undefined }));
    toast.success(entry ? "Weight entry updated" : "Weight logged");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={entry ? "Edit weight entry" : "Log weight"} size="sm">
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="w-date">
              <Input id="w-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={`Weight (${units})`} htmlFor="w-val">
              <Input id="w-val" type="number" step="0.1" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
            </Field>
          </div>
          <Field label="Note" htmlFor="w-note" optional>
            <Input id="w-note" maxLength={80} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <ErrorText error={error} />
          <p className="text-xs text-subtle">Weight naturally varies day to day — trends over weeks are more useful than single readings.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Measurements ---------------------------- */

const MEASURE_FIELDS = [
  ["waistCm", "Waist"],
  ["chestCm", "Chest"],
  ["hipsCm", "Hips"],
  ["armCm", "Arm"],
  ["thighCm", "Thigh"],
] as const;

export function MeasurementDialog({ open, onOpenChange, entry }: Base<MeasurementEntry>) {
  const { update } = useUserData();
  const [date, setDate] = useState(todayISO());
  const [vals, setVals] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(entry?.date ?? todayISO());
    setVals(Object.fromEntries(MEASURE_FIELDS.map(([k]) => [k, entry?.[k] != null ? String(entry[k]) : ""])));
    setError(null);
  }, [open, entry]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed: Partial<Record<(typeof MEASURE_FIELDS)[number][0], number>> = {};
    for (const [k, label] of MEASURE_FIELDS) {
      if (!vals[k]) continue;
      const n = Number(vals[k]);
      if (!Number.isFinite(n) || n < 10 || n > 250) return setError(`${label} should be between 10 and 250 cm.`);
      parsed[k] = n;
    }
    if (!Object.keys(parsed).length) return setError("Enter at least one measurement.");
    update((d) => saveMeasurement(d, { id: entry?.id, date, ...parsed }));
    toast.success(entry ? "Measurements updated" : "Measurements saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={entry ? "Edit measurements" : "Add measurements"} description="All fields optional — log whatever is useful to you." size="sm">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Date" htmlFor="m-date">
            <Input id="m-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {MEASURE_FIELDS.map(([k, label]) => (
              <Field key={k} label={`${label} (cm)`} htmlFor={`m-${k}`}>
                <Input id={`m-${k}`} type="number" step="0.5" inputMode="decimal" value={vals[k] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} />
              </Field>
            ))}
          </div>
          <ErrorText error={error} />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { MEASURE_FIELDS };

/* ---------------------------- Personal bests --------------------------- */

const PB_UNITS: PBUnit[] = ["kg", "reps", "sec", "min", "km"];

export function PersonalBestDialog({ open, onOpenChange, entry }: Base<PersonalBest>) {
  const { update } = useUserData();
  const [exercise, setExercise] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<PBUnit>("kg");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setExercise(entry?.exercise ?? "");
    setValue(entry ? String(entry.value) : "");
    setUnit(entry?.unit ?? "kg");
    setDate(entry?.date ?? todayISO());
    setError(null);
  }, [open, entry]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (exercise.trim().length < 2) return setError("Name the exercise or activity.");
    if (!value || !Number.isFinite(n) || n <= 0 || n > 10000) return setError("Enter a positive value.");
    update((d) => savePersonalBest(d, { id: entry?.id, exercise: exercise.trim(), value: n, unit, date }));
    toast.success(entry ? "Personal best updated" : "Personal best saved");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={entry ? "Edit personal best" : "Add personal best"} size="sm">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Exercise" htmlFor="pb-ex">
            <Input id="pb-ex" maxLength={60} value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="e.g. Goblet Squat" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Value" htmlFor="pb-val">
              <Input id="pb-val" type="number" step="0.5" value={value} onChange={(e) => setValue(e.target.value)} />
            </Field>
            <Field label="Unit" htmlFor="pb-unit">
              <Select id="pb-unit" value={unit} onChange={(e) => setUnit(e.target.value as PBUnit)}>
                {PB_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Date" htmlFor="pb-date">
            <Input id="pb-date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <ErrorText error={error} />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- Goals ------------------------------- */

const METRICS: { value: GoalMetric; label: string; unit: string; hint: string }[] = [
  { value: "weekly-workouts", label: "Workouts per week", unit: "sessions", hint: "Tracked automatically from completed workouts." },
  { value: "daily-water", label: "Daily water", unit: "ml", hint: "Tracked automatically from today’s water log." },
  { value: "target-weight", label: "Target weight", unit: "kg", hint: "Tracked from your weight log (enter the target in kg)." },
  { value: "custom", label: "Custom goal", unit: "", hint: "Update your current value manually as you progress." },
];

export function GoalDialog({ open, onOpenChange, entry }: Base<Goal>) {
  const { update } = useUserData();
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState<GoalMetric>("custom");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("0");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(entry?.title ?? "");
    setMetric(entry?.metric ?? "custom");
    setTarget(entry ? String(entry.target) : "");
    setCurrent(entry ? String(entry.current) : "0");
    setUnit(entry?.unit ?? "");
    setDeadline(entry?.deadline ?? "");
    setError(null);
  }, [open, entry]);

  const meta = METRICS.find((m) => m.value === metric)!;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = Number(target);
    const c = Number(current);
    if (title.trim().length < 3) return setError("Give your goal a short title.");
    if (!Number.isFinite(t) || t <= 0) return setError("Target must be a positive number.");
    if (metric === "weekly-workouts" && t > 14) return setError("Keep weekly workouts at 14 or fewer — rest days matter.");
    if (metric === "custom" && (!Number.isFinite(c) || c < 0)) return setError("Current value can’t be negative.");
    update((d) =>
      saveGoal(d, {
        id: entry?.id,
        title: title.trim(),
        metric,
        target: t,
        current: metric === "custom" ? c : 0,
        unit: metric === "custom" ? unit.trim() || "units" : meta.unit,
        deadline: deadline || undefined,
      }),
    );
    toast.success(entry ? "Goal updated" : "Goal added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={entry ? "Edit goal" : "New goal"} description="Choose something realistic and specific." size="sm">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Goal" htmlFor="g-title">
            <Input id="g-title" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Run 5 km without stopping" />
          </Field>
          <Field label="How to track it" htmlFor="g-metric" hint={meta.hint}>
            <Select id="g-metric" aria-describedby="g-metric-hint" value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)}>
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Target${meta.unit ? ` (${meta.unit})` : ""}`} htmlFor="g-target">
              <Input id="g-target" type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} />
            </Field>
            {metric === "custom" ? (
              <Field label="Unit" htmlFor="g-unit">
                <Input id="g-unit" maxLength={12} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="km, reps…" />
              </Field>
            ) : (
              <Field label="Deadline" htmlFor="g-deadline" optional>
                <Input id="g-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </Field>
            )}
          </div>
          {metric === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Current value" htmlFor="g-current">
                <Input id="g-current" type="number" step="any" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </Field>
              <Field label="Deadline" htmlFor="g-deadline2" optional>
                <Input id="g-deadline2" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </Field>
            </div>
          )}
          <ErrorText error={error} />
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
