"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Search, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { BodyMap } from "@/components/exercise/body-map";
import { RoutineEditor } from "@/components/workouts/routine-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { saveRoutine } from "@/lib/actions";
import { DIFFICULTY, EQUIPMENT, EXERCISE_CATEGORIES, MUSCLES } from "@/lib/constants";
import { EXERCISES } from "@/lib/data/exercises";
import { useUserData } from "@/lib/store/app-store";
import type { Difficulty, Equipment, Exercise, ExerciseCategory, MuscleGroup } from "@/lib/types";

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const { data, update } = useUserData();
  const [target, setTarget] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const ex = exercise;

  function addToRoutine() {
    const routine = data.routines.find((r) => r.id === target);
    if (!routine || !ex) return;
    if (routine.exercises.some((e) => e.exerciseId === ex.id)) {
      toast.error("Already in that routine");
      return;
    }
    update((d) => saveRoutine(d, { ...routine, exercises: [...routine.exercises, { exerciseId: ex.id, sets: ex.sets, reps: ex.reps, restSeconds: ex.restSeconds }] }));
    toast.success(`Added to ${routine.name}`);
  }

  return (
    <>
      <Dialog open={!!ex} onOpenChange={(o) => !o && onClose()}>
        {ex && (
          <DialogContent title={ex.name} description={ex.summary} size="lg">
            <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
              <div className="rounded-2xl bg-surface-2 p-3">
                <BodyMap muscles={ex.muscles} />
              </div>
              <div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={DIFFICULTY[ex.difficulty].tone}>{DIFFICULTY[ex.difficulty].label}</Badge>
                  <Badge>{EXERCISE_CATEGORIES[ex.category]}</Badge>
                  <Badge>{EQUIPMENT[ex.equipment]}</Badge>
                  {ex.locations.map((l) => (
                    <Badge key={l} tone="outline" className="capitalize">
                      {l}
                    </Badge>
                  ))}
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["Sets", ex.sets],
                    ["Reps", ex.reps],
                    ["Rest", `${ex.restSeconds}s`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-surface-2 p-2.5">
                      <dt className="text-xs text-muted">{k}</dt>
                      <dd className="text-sm font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm text-muted">
                  <span className="font-medium text-foreground">Targets:</span> {ex.muscles.map((m) => MUSCLES[m]).join(", ")}
                </p>
              </div>
            </div>

            <section className="mt-6">
              <h3 className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4 text-accent-text" aria-hidden /> Instructions
              </h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted">
                {ex.instructions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-border p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <XCircle className="size-4 text-warning" aria-hidden /> Common mistakes
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {ex.mistakes.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-2xl border border-border p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="size-4 text-info" aria-hidden /> Safety notes
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {ex.safety.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </section>
            </div>
            <p className="mt-4 flex gap-2 text-xs text-subtle">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> General guidance only. Stop if you feel pain and consult a qualified professional.
            </p>

            <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
              <Select aria-label="Choose a routine" value={target} onChange={(e) => setTarget(e.target.value)} wrapperClassName="flex-1 min-w-0">
                <option value="">Add to a routine…</option>
                {data.routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" disabled={!target} onClick={addToRoutine}>
                <Plus /> Add
              </Button>
              <Button variant="outline" onClick={() => setEditorOpen(true)}>
                New routine with this
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <RoutineEditor open={editorOpen} onOpenChange={setEditorOpen} seedExerciseIds={ex ? [ex.id] : []} />
    </>
  );
}

export default function ExercisesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ExerciseCategory>("all");
  const [muscle, setMuscle] = useState<"all" | MuscleGroup>("all");
  const [equipment, setEquipment] = useState<"all" | Equipment>("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [location, setLocation] = useState<"all" | "home" | "gym">("all");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const usedEquipment = useMemo(() => [...new Set(EXERCISES.map((e) => e.equipment))], []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter(
      (e) =>
        (!q || e.name.toLowerCase().includes(q) || e.muscles.some((m) => m.includes(q))) &&
        (category === "all" || e.category === category) &&
        (muscle === "all" || e.muscles.includes(muscle)) &&
        (equipment === "all" || e.equipment === equipment) &&
        (difficulty === "all" || e.difficulty === difficulty) &&
        (location === "all" || e.locations.includes(location)),
    );
  }, [query, category, muscle, equipment, difficulty, location]);
  const filtered = query || category !== "all" || muscle !== "all" || equipment !== "all" || difficulty !== "all" || location !== "all";

  function reset() {
    setQuery("");
    setCategory("all");
    setMuscle("all");
    setEquipment("all");
    setDifficulty("all");
    setLocation("all");
  }

  return (
    <div>
      <PageHeader title="Exercise library" description="Clear instructions, common mistakes and safety notes for every movement." />

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input aria-label="Search exercises" placeholder="Search by name or muscle…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 pl-9" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            <option value="all">All categories</option>
            {(Object.keys(EXERCISE_CATEGORIES) as ExerciseCategory[]).map((c) => (
              <option key={c} value={c}>
                {EXERCISE_CATEGORIES[c]}
              </option>
            ))}
          </Select>
          <Select aria-label="Muscle group" value={muscle} onChange={(e) => setMuscle(e.target.value as typeof muscle)}>
            <option value="all">All muscles</option>
            {(Object.keys(MUSCLES) as MuscleGroup[]).map((m) => (
              <option key={m} value={m}>
                {MUSCLES[m]}
              </option>
            ))}
          </Select>
          <Select aria-label="Equipment" value={equipment} onChange={(e) => setEquipment(e.target.value as typeof equipment)}>
            <option value="all">All equipment</option>
            {usedEquipment.map((q) => (
              <option key={q} value={q}>
                {EQUIPMENT[q]}
              </option>
            ))}
          </Select>
          <Select aria-label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
            <option value="all">All levels</option>
            {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY[d].label}
              </option>
            ))}
          </Select>
          <Select aria-label="Location" value={location} onChange={(e) => setLocation(e.target.value as typeof location)}>
            <option value="all">Home or gym</option>
            <option value="home">Home</option>
            <option value="gym">Gym</option>
          </Select>
        </div>
        <div className="flex items-center justify-between text-sm text-muted">
          <p aria-live="polite">
            {results.length} exercise{results.length === 1 ? "" : "s"}
          </p>
          {filtered && (
            <Button variant="link" size="sm" onClick={reset}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {results.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => setSelected(ex)}
                className="flex h-full w-full flex-col rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong"
              >
                <div className="w-full rounded-xl bg-surface-2 p-3">
                  <BodyMap muscles={ex.muscles} className="mx-auto max-w-48" />
                </div>
                <div className="mt-3 flex w-full items-start justify-between gap-2">
                  <h2 className="font-semibold">{ex.name}</h2>
                  <Badge tone={DIFFICULTY[ex.difficulty].tone}>{DIFFICULTY[ex.difficulty].label}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{ex.summary}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3 text-xs text-muted">
                  <span>{EXERCISE_CATEGORIES[ex.category]}</span>·<span>{EQUIPMENT[ex.equipment]}</span>·
                  <span>
                    {ex.sets}×{ex.reps}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Search}
          title="No exercises match"
          description="Try fewer filters or a different search term."
          action={
            <Button variant="outline" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      )}
      <ExerciseDetail exercise={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
