"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Dumbbell,
  History,
  Home,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  SkipForward,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { ScheduleDialog } from "@/components/workouts/schedule-dialog";
import { RoutineEditor } from "@/components/workouts/routine-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteRoutine, deleteSession, removeScheduled, saveRoutine, updateScheduled } from "@/lib/actions";
import { sessionSetTotals, sessionsBetween } from "@/lib/calculations";
import { FOCUS } from "@/lib/constants";
import { EXERCISE_MAP } from "@/lib/data/exercises";
import { formatDate, shiftISO, todayISO, weekDates } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { Routine, ScheduledWorkout } from "@/lib/types";
import { cn, formatDuration, pct } from "@/lib/utils";

const STATUS_TONE = { planned: "info", completed: "success", skipped: "neutral" } as const;

function ScheduledItem({
  item,
  onEdit,
  compact,
}: {
  item: ScheduledWorkout;
  onEdit: (s: ScheduledWorkout) => void;
  compact?: boolean;
}) {
  const { data, update } = useUserData();
  const routine = data.routines.find((r) => r.id === item.routineId);
  const session = item.sessionId ? data.sessions.find((s) => s.id === item.sessionId) : undefined;
  const today = todayISO();
  const canStart = item.status === "planned" && !!routine;
  return (
    <div
      className={cn(
        "group rounded-xl border p-3 text-left",
        item.status === "completed" ? "border-primary/30 bg-primary-soft" : item.status === "skipped" ? "border-border bg-surface-2/40 opacity-70" : "border-border bg-surface-2/60",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className={cn("text-sm font-medium", compact ? "line-clamp-2" : "truncate")} title={routine?.name}>
            {routine?.name ?? "Deleted routine"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {item.time ?? "Any time"}
            {session ? ` · ${Math.round(session.durationSec / 60)}m` : routine ? ` · ~${routine.estimatedMinutes}m` : ""}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="-mr-1 -mt-1 shrink-0" aria-label={`Actions for ${routine?.name ?? "workout"}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {canStart && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/workouts/active?routine=${item.routineId}&scheduled=${item.id}`}>
                  <Play /> Start now
                </Link>
              </DropdownMenuItem>
            )}
            {item.status !== "completed" && (
              <DropdownMenuItem onSelect={() => onEdit(item)}>
                <Pencil /> Reschedule
              </DropdownMenuItem>
            )}
            {item.status === "planned" && (
              <DropdownMenuItem
                onSelect={() => {
                  update((d) => updateScheduled(d, item.id, { status: "skipped" }));
                  toast("Marked as skipped", { description: "Rest is part of the plan too." });
                }}
              >
                <SkipForward /> Mark skipped
              </DropdownMenuItem>
            )}
            {item.status === "skipped" && (
              <DropdownMenuItem onSelect={() => update((d) => updateScheduled(d, item.id, { status: "planned" }))}>
                <Undo2 /> Restore to planned
              </DropdownMenuItem>
            )}
            {item.status !== "completed" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  destructive
                  onSelect={() => {
                    update((d) => removeScheduled(d, item.id));
                    toast.success("Removed from calendar");
                  }}
                >
                  <Trash2 /> Remove
                </DropdownMenuItem>
              </>
            )}
            {item.status === "completed" && <DropdownMenuItem disabled>Completed — see History</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Badge tone={STATUS_TONE[item.status]} className="capitalize">
          {item.status === "planned" && item.date < today ? "missed" : item.status}
        </Badge>
        {canStart && item.date === today && !compact && (
          <Button asChild size="sm">
            <Link href={`/dashboard/workouts/active?routine=${item.routineId}&scheduled=${item.id}`}>
              <Play /> Start
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Planner({ onSchedule, onEdit }: { onSchedule: (date: string) => void; onEdit: (s: ScheduledWorkout) => void }) {
  const { data } = useUserData();
  const today = todayISO();
  const [mode, setMode] = useState<"week" | "day">("week");
  const [anchor, setAnchor] = useState(today);
  const days = weekDates(anchor);
  const from = days[0]!;
  const to = days[6]!;
  const weekItems = data.schedule.filter((s) => s.date >= from && s.date <= to);
  const done = sessionsBetween(data.sessions, from, to);
  const planned = weekItems.length;
  const completed = weekItems.filter((s) => s.status === "completed").length;
  const unscheduled = done.filter((s) => !s.scheduledId);
  const minutes = Math.round(done.reduce((a, s) => a + s.durationSec, 0) / 60);
  const dayItems = (d: string) => data.schedule.filter((s) => s.date === d).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const step = mode === "week" ? 7 : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label={mode === "week" ? "Previous week" : "Previous day"} onClick={() => setAnchor((a) => shiftISO(a, -step))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label={mode === "week" ? "Next week" : "Next day"} onClick={() => setAnchor((a) => shiftISO(a, step))}>
            <ChevronRight />
          </Button>
          <h2 className="ml-1 text-lg font-semibold" aria-live="polite">
            {mode === "week" ? `${formatDate(from, "MMM d")} – ${formatDate(to, "MMM d, yyyy")}` : formatDate(anchor, "EEEE, MMMM d")}
          </h2>
          {anchor !== today && (
            <Button variant="ghost" size="sm" onClick={() => setAnchor(today)}>
              Today
            </Button>
          )}
        </div>
        <Segmented
          label="Calendar view"
          value={mode}
          onChange={setMode}
          options={[
            { value: "week", label: "Week" },
            { value: "day", label: "Day" },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted">Planned vs completed</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">
              {completed}/{planned}
            </p>
            <Progress value={pct(completed, planned)} className="mt-2 h-1.5" label="Planned sessions completed" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted">Sessions logged</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{done.length}</p>
            <p className="text-xs text-muted">{unscheduled.length ? `${unscheduled.length} unplanned` : "All from your plan"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted">Time trained</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{minutes} min</p>
            <p className="text-xs text-muted">This week</p>
          </CardContent>
        </Card>
      </div>

      {mode === "week" ? (
        <ol className="grid gap-2 md:grid-cols-7">
          {days.map((d) => {
            const items = dayItems(d);
            const isToday = d === today;
            return (
              <li key={d} className={cn("flex min-h-36 flex-col rounded-2xl border bg-surface p-2.5", isToday ? "border-primary/60" : "border-border")}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <button type="button" onClick={() => { setAnchor(d); setMode("day"); }} className="rounded-md text-left hover:text-accent-text" aria-label={`Open ${formatDate(d, "EEEE, MMMM d")}`}>
                    <span className="text-xs uppercase text-subtle">{formatDate(d, "EEE")}</span>{" "}
                    <span className={cn("font-display text-lg font-bold", isToday && "text-accent-text")}>{formatDate(d, "d")}</span>
                  </button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Schedule on ${formatDate(d, "EEEE, MMMM d")}`} onClick={() => onSchedule(d)}>
                    <Plus />
                  </Button>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {items.map((it) => (
                    <ScheduledItem key={it.id} item={it} onEdit={onEdit} compact />
                  ))}
                  {done
                    .filter((s) => s.date === d && !s.scheduledId)
                    .map((s) => (
                      <div key={s.id} className="rounded-xl border border-primary/30 bg-primary-soft p-3">
                        <p className="line-clamp-2 text-sm font-medium">{s.routineName}</p>
                        <p className="mt-0.5 text-xs text-muted">{formatDuration(s.durationSec)} · unplanned</p>
                      </div>
                    ))}
                  {items.length === 0 && !done.some((s) => s.date === d && !s.scheduledId) && (
                    <p className="px-1 text-xs text-subtle">Rest day</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <Card>
          <CardContent>
            {dayItems(anchor).length || done.some((s) => s.date === anchor && !s.scheduledId) ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {dayItems(anchor).map((it) => (
                  <ScheduledItem key={it.id} item={it} onEdit={onEdit} />
                ))}
                {done
                  .filter((s) => s.date === anchor && !s.scheduledId)
                  .map((s) => (
                    <div key={s.id} className="rounded-xl border border-primary/30 bg-primary-soft p-3">
                      <p className="text-sm font-medium">{s.routineName}</p>
                      <p className="text-xs text-muted">{formatDuration(s.durationSec)} · unplanned session</p>
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyState compact icon={CalendarDays} title="Nothing scheduled" description="Enjoy a rest day, or plan a session." />
            )}
            <Button variant="secondary" className="mt-4" onClick={() => onSchedule(anchor)}>
              <CalendarPlus /> Schedule on this day
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RoutineCard({ routine, onEdit, onSchedule }: { routine: Routine; onEdit: () => void; onSchedule: () => void }) {
  const { update } = useUserData();
  const confirm = useConfirm();
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge tone="primary">{FOCUS[routine.focus].label}</Badge>
            <Badge>
              {routine.location === "gym" ? <Building2 /> : <Home />} {routine.location === "gym" ? "Gym" : "Home"}
            </Badge>
          </div>
          <CardTitle as="h3">{routine.name}</CardTitle>
          {routine.description && <CardDescription className="line-clamp-2">{routine.description}</CardDescription>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${routine.name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                update((d) => saveRoutine(d, { ...routine, id: undefined, name: `${routine.name} (copy)` }));
                toast.success("Routine duplicated");
              }}
            >
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onSchedule}>
              <CalendarPlus /> Schedule
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() =>
                confirm.ask({
                  title: "Delete routine?",
                  description: `“${routine.name}” and any future planned sessions using it will be removed. Your workout history is kept.`,
                  confirmLabel: "Delete",
                  destructive: true,
                  onConfirm: () => {
                    update((d) => deleteRoutine(d, routine.id));
                    toast.success("Routine deleted");
                  },
                })
              }
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ol className="space-y-1 text-sm">
          {routine.exercises.slice(0, 5).map((e, i) => (
            <li key={`${e.exerciseId}-${i}`} className="flex justify-between gap-3">
              <span className="truncate text-muted">{EXERCISE_MAP[e.exerciseId]?.name}</span>
              <span className="shrink-0 tabular-nums text-subtle">
                {e.sets}×{e.reps}
              </span>
            </li>
          ))}
          {routine.exercises.length > 5 && <li className="text-xs text-subtle">+{routine.exercises.length - 5} more</li>}
        </ol>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="flex items-center gap-1 text-sm text-muted">
            <Clock className="size-4" aria-hidden /> ~{routine.estimatedMinutes} min
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onSchedule}>
              <CalendarPlus /> Plan
            </Button>
            <Button asChild size="sm">
              <Link href={`/dashboard/workouts/active?routine=${routine.id}`}>
                <Play /> Start
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
      {confirm.element}
    </Card>
  );
}

function HistoryList() {
  const { data, update } = useUserData();
  const confirm = useConfirm();
  const sessions = useMemo(() => [...data.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)), [data.sessions]);
  if (!sessions.length) {
    return (
      <EmptyState
        icon={History}
        title="No workouts logged yet"
        description="Finish your first session and it will show up here."
        action={
          <Button asChild>
            <Link href="/dashboard/workouts/active">
              <Play /> Start a workout
            </Link>
          </Button>
        }
      />
    );
  }
  return (
    <Card>
      <ul className="divide-y divide-border">
        {sessions.map((s) => {
          const t = sessionSetTotals(s);
          return (
            <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-accent-text">
                  <CheckCircle2 className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.routineName}</p>
                  <p className="text-xs text-muted">
                    {formatDate(s.date, "EEE, MMM d, yyyy")} · {FOCUS[s.focus].label}
                  </p>
                </div>
              </div>
              <dl className="flex gap-6 text-sm sm:text-right">
                <div>
                  <dt className="text-xs text-subtle">Duration</dt>
                  <dd className="font-medium tabular-nums">{formatDuration(s.durationSec)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">Sets</dt>
                  <dd className="font-medium tabular-nums">
                    {t.done}/{t.planned}
                  </dd>
                </div>
              </dl>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${s.routineName} on ${formatDate(s.date)}`}
                onClick={() =>
                  confirm.ask({
                    title: "Delete this workout?",
                    description: "It will be removed from your history and progress charts. A linked planned session goes back to “planned”.",
                    confirmLabel: "Delete",
                    destructive: true,
                    onConfirm: () => {
                      update((d) => deleteSession(d, s.id));
                      toast.success("Workout deleted");
                    },
                  })
                }
              >
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ul>
      {confirm.element}
    </Card>
  );
}

function WorkoutsInner() {
  const { data } = useUserData();
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState("planner");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string | undefined>();
  const [scheduleRoutine, setScheduleRoutine] = useState<string | undefined>();
  const [editingSchedule, setEditingSchedule] = useState<ScheduledWorkout | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    if (params.get("plan") === "1") {
      setScheduleOpen(true);
      router.replace("/dashboard/workouts");
    }
    const t = params.get("tab");
    if (t === "routines" || t === "history" || t === "planner") setTab(t);
  }, [params, router]);

  function openSchedule(date?: string, routineId?: string) {
    setEditingSchedule(null);
    setScheduleDate(date);
    setScheduleRoutine(routineId);
    setScheduleOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Workouts"
        description="Plan your week, manage routines and review your training history."
        actions={
          <>
            <Button variant="outline" onClick={() => openSchedule()}>
              <CalendarPlus /> Schedule
            </Button>
            <Button asChild>
              <Link href="/dashboard/workouts/active">
                <Play /> Start workout
              </Link>
            </Button>
          </>
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="planner">
            <CalendarDays /> Planner
          </TabsTrigger>
          <TabsTrigger value="routines">
            <Dumbbell /> Routines ({data.routines.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History /> History ({data.sessions.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="planner">
          <Planner
            onSchedule={(d) => openSchedule(d)}
            onEdit={(s) => {
              setEditingSchedule(s);
              setScheduleOpen(true);
            }}
          />
        </TabsContent>
        <TabsContent value="routines">
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => {
                setEditingRoutine(null);
                setEditorOpen(true);
              }}
            >
              <Plus /> New routine
            </Button>
          </div>
          {data.routines.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.routines.map((r) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  onEdit={() => {
                    setEditingRoutine(r);
                    setEditorOpen(true);
                  }}
                  onSchedule={() => openSchedule(undefined, r.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Dumbbell} title="No routines yet" description="Create a routine from the exercise library." />
          )}
        </TabsContent>
        <TabsContent value="history">
          <HistoryList />
        </TabsContent>
      </Tabs>

      <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} date={scheduleDate} routineId={scheduleRoutine} editing={editingSchedule} />
      <RoutineEditor open={editorOpen} onOpenChange={setEditorOpen} routine={editingRoutine} />
    </div>
  );
}

export default function WorkoutsPage() {
  return (
    <Suspense>
      <WorkoutsInner />
    </Suspense>
  );
}
