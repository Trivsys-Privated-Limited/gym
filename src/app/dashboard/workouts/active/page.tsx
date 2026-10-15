"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Info,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { BodyMap } from "@/components/exercise/body-map";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { recordSession } from "@/lib/actions";
import { EQUIPMENT, FOCUS } from "@/lib/constants";
import { EXERCISE_MAP } from "@/lib/data/exercises";
import { todayISO } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { Routine } from "@/lib/types";
import { cn, formatClock, formatDuration, pct } from "@/lib/utils";

/* ------------------------------ Routine picker ------------------------------ */

function RoutinePicker() {
  const { data } = useUserData();
  const today = todayISO();
  const todays = data.schedule.filter((s) => s.date === today && s.status === "planned");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/workouts">
          <ArrowLeft /> Back to workouts
        </Link>
      </Button>
      <h1 className="mt-4 font-display text-4xl font-bold uppercase">Start a workout</h1>
      <p className="mt-1 text-muted">Pick a routine. You can pause or cancel anytime — nothing is saved until you finish.</p>

      {todays.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-accent-text">Planned for today</h2>
          <ul className="mt-3 space-y-2">
            {todays.map((s) => {
              const r = data.routines.find((x) => x.id === s.routineId);
              if (!r) return null;
              return (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/workouts/active?routine=${r.id}&scheduled=${s.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-primary/50 bg-primary-soft p-4 transition-colors hover:border-primary"
                  >
                    <Play className="size-5 text-accent-text" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-sm text-muted">
                        {r.exercises.length} exercises · ~{r.estimatedMinutes} min {s.time ? `· ${s.time}` : ""}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">All routines</h2>
        {data.routines.length ? (
          <ul className="mt-3 space-y-2">
            {data.routines.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/workouts/active?routine=${r.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-muted">
                      {FOCUS[r.focus].label} · {r.location === "gym" ? "Gym" : "Home"} · {r.exercises.length} exercises · ~{r.estimatedMinutes} min
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No routines yet.{" "}
            <Link href="/dashboard/workouts?tab=routines" className="text-accent-text underline">
              Create one
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}

/* ------------------------------- Active session ----------------------------- */

type Phase = "active" | "summary" | "saved";

function ActiveSession({ routine, scheduledId }: { routine: Routine; scheduledId?: string }) {
  const { update } = useUserData();
  const router = useRouter();
  const confirm = useConfirm();
  const exercises = routine.exercises;

  const [phase, setPhase] = useState<Phase>("active");
  const [index, setIndex] = useState(0);
  const [setsDone, setSetsDone] = useState<number[]>(() => exercises.map(() => 0));
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rest, setRest] = useState<{ remaining: number; total: number } | null>(null);
  const startedAt = useRef(new Date().toISOString());
  const saving = useRef(false);

  const current = exercises[index]!;
  const ex = EXERCISE_MAP[current.exerciseId];
  const totalSets = exercises.reduce((a, e) => a + e.sets, 0);
  const completedSets = setsDone.reduce((a, n) => a + n, 0);
  const exerciseDone = setsDone[index]! >= current.sets;

  // One clock drives both elapsed time and the rest countdown.
  useEffect(() => {
    if (phase !== "active" || paused) return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      setRest((r) => (!r ? r : r.remaining <= 1 ? null : { ...r, remaining: r.remaining - 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, paused]);

  // Announce when a rest period runs out naturally (not when skipped).
  const lastRest = useRef(rest);
  useEffect(() => {
    if (lastRest.current && lastRest.current.remaining <= 1 && rest === null) {
      navigator.vibrate?.(200);
      toast("Rest complete", { description: "Time for your next set." });
    }
    lastRest.current = rest;
  }, [rest]);

  // Warn before leaving mid-workout.
  useEffect(() => {
    if (phase !== "active") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  const completeSet = useCallback(() => {
    if (setsDone[index]! >= current.sets) return;
    const next = setsDone.map((n, i) => (i === index ? n + 1 : n));
    setSetsDone(next);
    const finishedAll = next.every((n, i) => n >= exercises[i]!.sets);
    if (finishedAll) {
      setRest(null);
      toast.success("All sets complete!", { description: "Finish the workout when you’re ready." });
      return;
    }
    if (current.restSeconds > 0) setRest({ remaining: current.restSeconds, total: current.restSeconds });
    if (next[index]! >= current.sets && index < exercises.length - 1) {
      toast("Exercise complete", { description: `Up next: ${EXERCISE_MAP[exercises[index + 1]!.exerciseId]?.name}` });
    }
  }, [setsDone, index, current, exercises]);

  function undoSet() {
    setSetsDone((s) => s.map((n, i) => (i === index ? Math.max(0, n - 1) : n)));
    setRest(null);
  }

  function goTo(i: number) {
    setIndex(Math.max(0, Math.min(exercises.length - 1, i)));
  }

  function finish() {
    setPaused(true);
    setRest(null);
    setPhase("summary");
  }

  function save() {
    if (saving.current) return; // guard against double submission
    saving.current = true;
    update((d) =>
      recordSession(d, {
        routineId: routine.id,
        routineName: routine.name,
        focus: routine.focus,
        date: todayISO(),
        startedAt: startedAt.current,
        endedAt: new Date().toISOString(),
        durationSec: Math.max(elapsed, 1),
        scheduledId,
        exercises: exercises.map((e, i) => ({ exerciseId: e.exerciseId, setsPlanned: e.sets, setsCompleted: setsDone[i]! })),
      }),
    );
    setPhase("saved");
    toast.success("Workout saved", { description: `${routine.name} · ${formatDuration(elapsed)}` });
  }

  function cancel() {
    // Pause while deciding; the user can resume if they keep going.
    setPaused(true);
    confirm.ask({
      title: "Cancel this workout?",
      description: "Your progress in this session will be discarded and nothing will be recorded.",
      confirmLabel: "Discard workout",
      destructive: true,
      onConfirm: () => {
        setPhase("saved"); // disables the unload guard before navigating
        router.push("/dashboard/workouts");
        toast("Workout cancelled", { description: "Nothing was recorded." });
      },
    });
  }

  // Keyboard shortcuts: Space = complete set, P = pause, ←/→ = navigate.
  useEffect(() => {
    if (phase !== "active") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || document.querySelector("[role=alertdialog]")) return;
      if (e.key === " ") {
        e.preventDefault();
        completeSet();
      } else if (e.key.toLowerCase() === "p") setPaused((p) => !p);
      else if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase !== "active") {
    const percent = pct(completedSets, totalSets);
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <Trophy className="mx-auto size-12 text-accent-text" aria-hidden />
          <h1 className="mt-4 font-display text-4xl font-bold uppercase">{phase === "saved" ? "Workout saved" : "Workout summary"}</h1>
          <p className="mt-1 text-muted">{routine.name}</p>
        </div>
        <dl className="mt-8 grid grid-cols-3 gap-3">
          {[
            ["Duration", formatDuration(elapsed)],
            ["Sets done", `${completedSets}/${totalSets}`],
            ["Completion", `${percent}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-border bg-surface p-4 text-center">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
          {exercises.map((e, i) => (
            <li key={`${e.exerciseId}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                {setsDone[i]! >= e.sets ? <Check className="size-4 shrink-0 text-accent-text" aria-hidden /> : <span className="size-4 shrink-0 rounded-full border-2 border-border-strong" aria-hidden />}
                <span className="truncate">{EXERCISE_MAP[e.exerciseId]?.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {setsDone[i]}/{e.sets} sets
              </span>
            </li>
          ))}
        </ul>

        {phase === "summary" ? (
          <div className="mt-8 space-y-3">
            {completedSets === 0 && (
              <p role="alert" className="rounded-lg bg-warning-soft px-3 py-2 text-sm">
                You haven’t completed any sets yet. Go back to continue, or discard this session.
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setPhase("active");
                  setPaused(false);
                }}
              >
                <ArrowLeft /> Back to workout
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="danger-ghost" onClick={cancel}>
                  Discard
                </Button>
                <Button onClick={save} disabled={completedSets === 0}>
                  <Check /> Save workout
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/progress">View progress</Link>
            </Button>
          </div>
        )}
        {confirm.element}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo href="/dashboard" className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          <div className="flex items-center gap-2 font-display text-2xl font-bold tabular-nums" aria-label={`Elapsed time ${formatClock(elapsed)}`}>
            <Clock className="size-5 text-muted" aria-hidden />
            {formatClock(elapsed)}
            {paused && <Badge tone="warning">Paused</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={cancel}>
            <X /> Cancel
          </Button>
        </div>
        <Progress value={pct(completedSets, totalSets)} label="Workout progress" className="h-1 rounded-none" />
      </header>

      <main id="main" className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="ex-name" className="min-w-0">
          <p className="text-sm text-muted">
            Exercise {index + 1} of {exercises.length} · {routine.name}
          </p>
          <h1 id="ex-name" className="mt-1 font-display text-4xl font-bold uppercase sm:text-5xl">
            {ex?.name ?? "Exercise"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="primary">
              {current.sets} sets × {current.reps}
            </Badge>
            <Badge>Rest {current.restSeconds}s</Badge>
            {ex && <Badge>{EQUIPMENT[ex.equipment]}</Badge>}
          </div>

          {/* Set tracker */}
          <div className="mt-6 rounded-3xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Sets</h2>
              <span className="text-sm text-muted tabular-nums" aria-live="polite">
                {setsDone[index]} of {current.sets} complete
              </span>
            </div>
            <ol className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: current.sets }).map((_, s) => {
                const done = s < setsDone[index]!;
                return (
                  <li
                    key={s}
                    className={cn(
                      "flex size-12 items-center justify-center rounded-xl border-2 font-display text-lg font-bold",
                      done ? "border-primary bg-primary text-primary-foreground" : s === setsDone[index] ? "border-primary/60 text-foreground" : "border-border text-subtle",
                    )}
                  >
                    {done ? <Check className="size-5" aria-label={`Set ${s + 1} done`} /> : s + 1}
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={completeSet} disabled={exerciseDone || paused}>
                <Check /> {exerciseDone ? "Exercise complete" : `Complete set ${setsDone[index]! + 1}`}
              </Button>
              <Button size="lg" variant="outline" onClick={undoSet} disabled={setsDone[index] === 0}>
                <RotateCcw /> Undo
              </Button>
            </div>
            <p className="mt-3 hidden text-xs text-subtle sm:block">Shortcuts: Space = complete set · P = pause · ←/→ = switch exercise</p>
          </div>

          {/* Rest timer */}
          <div className={cn("mt-4 rounded-3xl border p-5 transition-colors", rest ? "border-info/50 bg-info-soft" : "border-border bg-surface")} aria-live="polite">
            {rest ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <ProgressRing value={(rest.remaining / rest.total) * 100} size={96} stroke={8} label="Rest remaining" color="var(--info)">
                  <span className="font-display text-2xl font-bold tabular-nums">{formatClock(rest.remaining)}</span>
                </ProgressRing>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold">Rest {paused && "(paused)"}</p>
                  <p className="text-sm text-muted">Breathe, sip water, get ready for the next set.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRest((r) => (r ? { remaining: r.remaining + 15, total: r.total + 15 } : r))}>
                    <Plus /> 15s
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setRest(null)}>
                    <SkipForward /> Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Timer className="size-4" aria-hidden /> Rest timer starts automatically after each set.
                </p>
                {current.restSeconds > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setRest({ remaining: current.restSeconds, total: current.restSeconds })}>
                    Start rest
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => goTo(index - 1)} disabled={index === 0}>
                <ChevronLeft /> Prev
              </Button>
              <Button variant="outline" onClick={() => goTo(index + 1)} disabled={index === exercises.length - 1}>
                Next <ChevronRight />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPaused((p) => !p)}>
                {paused ? <Play /> : <Pause />} {paused ? "Resume" : "Pause"}
              </Button>
              <Button onClick={finish}>
                <Flag /> Finish
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          {ex && (
            <div className="rounded-3xl border border-border bg-surface p-5">
              <div className="rounded-2xl bg-surface-2 p-3">
                <BodyMap muscles={ex.muscles} className="mx-auto max-w-60" />
              </div>
              <details className="group mt-4" open>
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  <Info className="size-4 text-accent-text" aria-hidden /> How to do it
                </summary>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted">
                  {ex.instructions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </details>
              <p className="mt-3 text-xs text-subtle">Safety: {ex.safety[0]}</p>
            </div>
          )}
          <nav aria-label="Exercises in this workout" className="rounded-3xl border border-border bg-surface p-3">
            <ol className="space-y-1">
              {exercises.map((e, i) => (
                <li key={`${e.exerciseId}-${i}`}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={i === index ? "step" : undefined}
                    className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors", i === index ? "bg-surface-3" : "hover:bg-surface-2")}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        setsDone[i]! >= e.sets ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted",
                      )}
                    >
                      {setsDone[i]! >= e.sets ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{EXERCISE_MAP[e.exerciseId]?.name}</span>
                    <span className="text-xs tabular-nums text-subtle">
                      {setsDone[i]}/{e.sets}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </main>
      {confirm.element}
    </div>
  );
}

function ActiveInner() {
  const params = useSearchParams();
  const { data } = useUserData();
  const routineId = params.get("routine");
  const scheduledParam = params.get("scheduled") ?? undefined;
  const routine = useMemo(() => data.routines.find((r) => r.id === routineId), [data.routines, routineId]);
  // Only link to a schedule entry that is actually planned for this routine.
  const scheduledId = useMemo(
    () => (data.schedule.some((s) => s.id === scheduledParam && s.routineId === routineId && s.status === "planned") ? scheduledParam : undefined),
    // Evaluate once on mount so completing the session doesn't flip this mid-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!routineId) return <RoutinePicker />;
  if (!routine || routine.exercises.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Routine not found</h1>
        <p className="mt-2 text-muted">It may have been deleted or has no exercises.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/workouts/active">Choose another routine</Link>
        </Button>
      </div>
    );
  }
  return <ActiveSession key={routine.id} routine={routine} scheduledId={scheduledId} />;
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense>
      <ActiveInner />
    </Suspense>
  );
}
