"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { saveRoutine } from "@/lib/actions";
import { EXERCISE_CATEGORIES, FOCUS } from "@/lib/constants";
import { EXERCISES, EXERCISE_MAP } from "@/lib/data/exercises";
import { useUserData } from "@/lib/store/app-store";
import type { Routine, RoutineExercise, RoutineFocus, WorkoutLocation } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  routine?: Routine | null;
  /** Pre-fill a new routine with these exercise ids (e.g. from the library). */
  seedExerciseIds?: string[];
}

export function RoutineEditor({ open, onOpenChange, routine, seedExerciseIds }: Props) {
  const { update } = useUserData();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<WorkoutLocation>("gym");
  const [focus, setFocus] = useState<RoutineFocus>("strength");
  const [minutes, setMinutes] = useState("45");
  const [items, setItems] = useState<RoutineExercise[]>([]);
  const [toAdd, setToAdd] = useState(EXERCISES[0]!.id);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(routine?.name ?? "");
    setDescription(routine?.description ?? "");
    setLocation(routine?.location ?? "gym");
    setFocus(routine?.focus ?? "strength");
    setMinutes(String(routine?.estimatedMinutes ?? 45));
    setItems(
      routine?.exercises.map((e) => ({ ...e })) ??
        (seedExerciseIds ?? []).map((id) => {
          const ex = EXERCISE_MAP[id]!;
          return { exerciseId: id, sets: ex.sets, reps: ex.reps, restSeconds: ex.restSeconds };
        }),
    );
    setErrors({});
  }, [open, routine, seedExerciseIds]);

  function patch(i: number, p: Partial<RoutineExercise>) {
    setItems((list) => list.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  }
  function move(i: number, dir: -1 | 1) {
    setItems((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }
  function addExercise() {
    const ex = EXERCISE_MAP[toAdd];
    if (!ex) return;
    setItems((l) => [...l, { exerciseId: ex.id, sets: ex.sets, reps: ex.reps, restSeconds: ex.restSeconds }]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const mins = Number(minutes);
    if (name.trim().length < 2) errs.name = "Give the routine a name.";
    if (!Number.isFinite(mins) || mins < 5 || mins > 240) errs.minutes = "Enter 5–240 minutes.";
    if (items.length === 0) errs.items = "Add at least one exercise.";
    if (items.some((i) => i.sets < 1 || i.sets > 10 || !i.reps.trim() || i.restSeconds < 0 || i.restSeconds > 600))
      errs.items = "Each exercise needs 1–10 sets, reps, and 0–600 s rest.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    update((d) =>
      saveRoutine(d, {
        id: routine?.id,
        name: name.trim(),
        description: description.trim(),
        location,
        focus,
        estimatedMinutes: mins,
        exercises: items.map((i) => ({ ...i, reps: i.reps.trim() })),
      }),
    );
    toast.success(routine ? "Routine updated" : "Routine created", { description: name.trim() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={routine ? "Edit routine" : "New routine"} size="lg">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Name" htmlFor="rt-name" error={errors.name}>
            <Input id="rt-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-invalid={!!errors.name || undefined} />
          </Field>
          <Field label="Description" htmlFor="rt-desc" optional>
            <Textarea id="rt-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Location" htmlFor="rt-loc">
              <Select id="rt-loc" value={location} onChange={(e) => setLocation(e.target.value as WorkoutLocation)}>
                <option value="gym">Gym</option>
                <option value="home">Home</option>
              </Select>
            </Field>
            <Field label="Focus" htmlFor="rt-focus">
              <Select id="rt-focus" value={focus} onChange={(e) => setFocus(e.target.value as RoutineFocus)}>
                {(Object.keys(FOCUS) as RoutineFocus[]).map((f) => (
                  <option key={f} value={f}>
                    {FOCUS[f].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duration (min)" htmlFor="rt-min" error={errors.minutes}>
              <Input id="rt-min" type="number" min={5} max={240} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </Field>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Exercises</legend>
            {errors.items && (
              <p role="alert" className="mt-1 text-xs text-danger">
                {errors.items}
              </p>
            )}
            <ol className="mt-2 space-y-2">
              {items.map((it, i) => {
                const ex = EXERCISE_MAP[it.exerciseId];
                return (
                  <li key={`${it.exerciseId}-${i}`} className="rounded-xl border border-border bg-surface-2/50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs text-subtle tabular-nums">{i + 1}.</span>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{ex?.name ?? "Unknown exercise"}</p>
                      <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${ex?.name} up`}>
                        <ArrowUp />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${ex?.name} down`}>
                        <ArrowDown />
                      </Button>
                      <Button variant="danger-ghost" size="icon-sm" onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))} aria-label={`Remove ${ex?.name}`}>
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 pl-7">
                      <label className="text-xs text-muted">
                        Sets
                        <Input type="number" min={1} max={10} value={it.sets} onChange={(e) => patch(i, { sets: Number(e.target.value) })} className="mt-1 h-9" />
                      </label>
                      <label className="text-xs text-muted">
                        Reps / time
                        <Input value={it.reps} onChange={(e) => patch(i, { reps: e.target.value })} maxLength={24} className="mt-1 h-9" />
                      </label>
                      <label className="text-xs text-muted">
                        Rest (s)
                        <Input type="number" min={0} max={600} step={15} value={it.restSeconds} onChange={(e) => patch(i, { restSeconds: Number(e.target.value) })} className="mt-1 h-9" />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-3 flex gap-2">
              <Select aria-label="Exercise to add" value={toAdd} onChange={(e) => setToAdd(e.target.value)} wrapperClassName="flex-1 min-w-0">
                {(Object.keys(EXERCISE_CATEGORIES) as (keyof typeof EXERCISE_CATEGORIES)[]).map((cat) => (
                  <optgroup key={cat} label={EXERCISE_CATEGORIES[cat]}>
                    {EXERCISES.filter((x) => x.category === cat).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <Button variant="secondary" onClick={addExercise}>
                <Plus /> Add
              </Button>
            </div>
          </fieldset>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{routine ? "Save routine" : "Create routine"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
