"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  ListChecks,
  Play,
  Plus,
  Salad,
  Sparkles,
} from "lucide-react";
import { ActivityFeed, GoalList, StatTile, TaskCheckRow, WaterTracker, WeeklyActivityChart } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { activeStreak, mealTotals, mealsOn, sessionsBetween, sortTasks, taskStats, tasksDueOn } from "@/lib/calculations";
import { FOCUS, MACRO_COLORS, MEAL_TYPES } from "@/lib/constants";
import { formatDate, greeting, todayISO, weekDates } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import { pct } from "@/lib/utils";

export default function DashboardPage() {
  const { data } = useUserData();
  const today = todayISO();
  const firstName = data.profile.name.split(" ")[0] || "there";

  const view = useMemo(() => {
    const todaysTasks = sortTasks(tasksDueOn(data.tasks, today));
    const stats = taskStats(todaysTasks);
    const week = weekDates(today);
    const weekSessions = sessionsBetween(data.sessions, week[0]!, week[6]!);
    const plannedThisWeek = data.schedule.filter((s) => s.date >= week[0]! && s.date <= week[6]!).length;
    const todaysMeals = mealsOn(data, today);
    const eaten = mealTotals(todaysMeals, true);
    const planned = mealTotals(todaysMeals);
    const todaysWorkout = data.schedule.find((s) => s.date === today && s.status === "planned");
    const doneToday = data.sessions.filter((s) => s.date === today);
    const upcoming = data.schedule
      .filter((s) => s.status === "planned" && s.date > today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
    return { todaysTasks, stats, weekSessions, plannedThisWeek, todaysMeals, eaten, planned, todaysWorkout, doneToday, upcoming };
  }, [data, today]);

  const routineFor = (id: string) => data.routines.find((r) => r.id === id);
  const todayRoutine = view.todaysWorkout ? routineFor(view.todaysWorkout.routineId) : undefined;
  const streak = activeStreak(data, today);
  const s = data.settings;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{formatDate(today, "EEEE, MMMM d")}</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase sm:text-4xl">
            {greeting()}, {firstName}
          </h1>
        </div>
        {streak > 0 && (
          <Badge tone="primary" className="self-start px-3 py-1 text-sm sm:self-auto">
            <Flame className="!size-4" /> {streak}-day active streak
          </Badge>
        )}
      </div>

      {!data.profile.onboarded && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-primary-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
            <div>
              <p className="font-semibold">Finish setting up your plan</p>
              <p className="text-sm text-muted">Answer a few questions and we’ll add a starter schedule to your calendar.</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/onboarding">Continue setup</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          icon={ListChecks}
          label="Today’s tasks"
          value={`${view.stats.done}/${view.stats.total}`}
          sub={view.stats.total ? `${view.stats.percent}% complete` : "Nothing scheduled"}
          progress={view.stats.percent}
          href="/dashboard/tasks"
        />
        <StatTile
          icon={Dumbbell}
          label="Workouts this week"
          value={`${view.weekSessions.length}/${Math.max(view.plannedThisWeek, data.profile.workoutDays.length)}`}
          sub={`${Math.round(view.weekSessions.reduce((a, x) => a + x.durationSec, 0) / 60)} active minutes`}
          progress={pct(view.weekSessions.length, Math.max(view.plannedThisWeek, data.profile.workoutDays.length))}
          href="/dashboard/workouts"
        />
        <StatTile
          icon={Salad}
          label="Calories eaten"
          value={view.eaten.calories.toLocaleString()}
          sub={`of ~${s.calorieTarget.toLocaleString()} kcal target`}
          progress={pct(view.eaten.calories, s.calorieTarget)}
          href="/dashboard/nutrition"
        />
        <StatTile
          icon={CheckCircle2}
          label="Protein"
          value={`${view.eaten.protein} g`}
          sub={`of ${s.proteinTarget} g target`}
          progress={pct(view.eaten.protein, s.proteinTarget)}
          href="/dashboard/nutrition"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        {/* Today's workout */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Today’s workout</CardTitle>
              <CardDescription>{formatDate(today, "EEEE")}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/workouts">
                Planner <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todayRoutine && view.todaysWorkout ? (
              <div className="flex flex-col gap-4 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Dumbbell className="size-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold">{todayRoutine.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                    <span>{FOCUS[todayRoutine.focus].label}</span>
                    <span>{todayRoutine.exercises.length} exercises</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden /> ~{todayRoutine.estimatedMinutes} min
                    </span>
                    {view.todaysWorkout.time && <span>at {view.todaysWorkout.time}</span>}
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href={`/dashboard/workouts/active?routine=${todayRoutine.id}&scheduled=${view.todaysWorkout.id}`}>
                    <Play /> Start workout
                  </Link>
                </Button>
              </div>
            ) : view.doneToday.length ? (
              <div className="flex items-center gap-4 rounded-2xl bg-primary-soft p-4">
                <CheckCircle2 className="size-8 shrink-0 text-accent-text" aria-hidden />
                <div>
                  <p className="font-semibold">Workout complete — great job!</p>
                  <p className="text-sm text-muted">
                    {view.doneToday.map((x) => x.routineName).join(", ")} · {Math.round(view.doneToday.reduce((a, x) => a + x.durationSec, 0) / 60)} min
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                compact
                icon={CalendarDays}
                title="No workout planned for today"
                description="Rest days help recovery. Or pick a routine and get moving."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button asChild size="sm">
                      <Link href="/dashboard/workouts/active">
                        <Play /> Quick start
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard/workouts?plan=1">
                        <Plus /> Plan a workout
                      </Link>
                    </Button>
                  </div>
                }
              />
            )}

            <div className="mt-6">
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">Weekly activity</h3>
                <span className="text-xs text-muted">Minutes trained</span>
              </div>
              <WeeklyActivityChart height={180} />
            </div>
          </CardContent>
        </Card>

        {/* Daily to-do */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Daily to-do</CardTitle>
              <CardDescription>
                {view.stats.total ? `${view.stats.done} of ${view.stats.total} done` : "Plan your day"}
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="icon-sm" aria-label="Add a task">
              <Link href="/dashboard/tasks?new=1">
                <Plus />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            {view.todaysTasks.length ? (
              <div className="-mx-2">
                {view.todaysTasks.slice(0, 6).map((t) => (
                  <TaskCheckRow key={t.id} task={t} />
                ))}
                {view.todaysTasks.length > 6 && (
                  <Link href="/dashboard/tasks" className="mt-2 block px-2 text-sm text-accent-text hover:underline">
                    View all {view.todaysTasks.length} tasks
                  </Link>
                )}
              </div>
            ) : (
              <EmptyState
                compact
                icon={ListChecks}
                title="No tasks for today"
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard/tasks?new=1">
                      <Plus /> Add a task
                    </Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Nutrition today</CardTitle>
              <CardDescription>Approximate values</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/nutrition">
                Meals <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {view.todaysMeals.length ? (
              <>
                <p className="font-display text-3xl font-bold tabular-nums">
                  {view.eaten.calories.toLocaleString()} <span className="text-base text-muted">/ {view.planned.calories.toLocaleString()} kcal planned</span>
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-2">
                  {(["protein", "carbs", "fat"] as const).map((k) => (
                    <div key={k} className="rounded-xl bg-surface-2 p-2.5">
                      <dt className="flex items-center gap-1.5 text-xs capitalize text-muted">
                        <span className="size-2 rounded-sm" style={{ background: MACRO_COLORS[k] }} aria-hidden />
                        {k}
                      </dt>
                      <dd className="mt-0.5 font-semibold tabular-nums">{view.eaten[k]} g</dd>
                    </div>
                  ))}
                </dl>
                <ul className="mt-4 space-y-2 text-sm">
                  {view.todaysMeals.slice(0, 4).map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <CheckCircle2 className={m.completed ? "size-4 shrink-0 text-accent-text" : "size-4 shrink-0 text-surface-3"} aria-hidden />
                        <span className="truncate">
                          <span className="text-muted">{MEAL_TYPES[m.type].label}:</span> {m.name}
                        </span>
                        <span className="sr-only">{m.completed ? "(eaten)" : "(planned)"}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">{m.calories}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <EmptyState
                compact
                icon={Salad}
                title="No meals planned today"
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard/nutrition?new=1">
                      <Plus /> Log a meal
                    </Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Water */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Water intake</CardTitle>
              <CardDescription>Goal {(s.waterGoalMl / 1000).toFixed(1)} L</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <WaterTracker />
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming sessions</CardTitle>
              <CardDescription>Your next planned workouts</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {view.upcoming.length ? (
              <ul className="space-y-2">
                {view.upcoming.map((u) => {
                  const r = routineFor(u.routineId);
                  return (
                    <li key={u.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                      <div className="w-11 shrink-0 text-center">
                        <p className="text-[11px] uppercase text-subtle">{formatDate(u.date, "EEE")}</p>
                        <p className="font-display text-xl font-bold leading-none">{formatDate(u.date, "d")}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r?.name ?? "Deleted routine"}</p>
                        <p className="text-xs text-muted">
                          {u.time ?? "Any time"} · ~{r?.estimatedMinutes ?? "–"} min
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={CalendarDays}
                title="Nothing planned yet"
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard/workouts?plan=1">Plan a workout</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Current goals</CardTitle>
              <CardDescription>Calculated from your logs</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/progress?tab=goals">
                Manage <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <GoalList limit={4} />
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed limit={6} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
