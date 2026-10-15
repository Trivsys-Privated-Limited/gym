"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import {
  Award,
  CalendarCheck,
  Dumbbell,
  Flag,
  Flame,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Ruler,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { ChartFrame, ChartLegend, ChartTooltip, axisProps, gridProps } from "@/components/charts/chart-kit";
import { StatTile } from "@/components/dashboard/widgets";
import { GoalDialog, MEASURE_FIELDS, MeasurementDialog, PersonalBestDialog, WeightDialog } from "@/components/progress/progress-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteGoal, deleteMeasurement, deletePersonalBest, deleteWeight } from "@/lib/actions";
import { achievements, activeStreak, goalProgress, sessionsBetween, sortedWeights, weeklyConsistency, weightChange } from "@/lib/calculations";
import { CHART } from "@/lib/constants";
import { formatDate, toISODate, todayISO } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { Goal, MeasurementEntry, PersonalBest, WeightEntry } from "@/lib/types";
import { cn, formatDuration, toDisplayWeight } from "@/lib/utils";

function RowMenu({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${label}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={onDelete}>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------- Overview ------------------------------ */

function MonthCalendar() {
  const { data } = useUserData();
  const now = new Date();
  const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  const offset = (getDay(days[0]!) + 6) % 7; // Monday-first
  const today = todayISO();
  const monthSessions = sessionsBetween(data.sessions, toISODate(days[0]!), toISODate(days.at(-1)!));
  const minutes = Math.round(monthSessions.reduce((a, s) => a + s.durationSec, 0) / 60);
  const activeDays = new Set(monthSessions.map((s) => s.date)).size;
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{format(now, "MMMM yyyy")}</CardTitle>
          <CardDescription>Monthly overview</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["Workouts", monthSessions.length],
            ["Active days", activeDays],
            ["Minutes", minutes],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-surface-2 p-2">
              <dt className="text-[11px] text-muted">{k}</dt>
              <dd className="font-display text-xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-subtle" aria-hidden>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <ol className="mt-1 grid grid-cols-7 gap-1" aria-label="Workout days this month">
          {Array.from({ length: offset }).map((_, i) => (
            <li key={`pad-${i}`} aria-hidden />
          ))}
          {days.map((d) => {
            const iso = toISODate(d);
            const count = data.sessions.filter((s) => s.date === iso).length;
            return (
              <li
                key={iso}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md text-xs tabular-nums",
                  count ? "bg-primary font-semibold text-primary-foreground" : "bg-surface-2 text-muted",
                  iso === today && "ring-2 ring-foreground/60",
                  iso > today && "opacity-50",
                )}
                aria-label={`${format(d, "MMMM d")}: ${count ? `${count} workout${count > 1 ? "s" : ""}` : "no workout"}`}
              >
                {format(d, "d")}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function WeightChart({ height = 240 }: { height?: number }) {
  const { data } = useUserData();
  const units = data.settings.units;
  const rows = sortedWeights(data.weights).map((w) => ({ label: formatDate(w.date, "MMM d"), weight: toDisplayWeight(w.weightKg, units) }));
  const target = data.profile.targetWeightKg ? toDisplayWeight(data.profile.targetWeightKg, units) : undefined;
  if (rows.length < 2) {
    return (
      <EmptyState
        compact
        icon={Scale}
        title={rows.length ? "Log one more entry to see a trend" : "No weight entries yet"}
        description="Weight logs are optional. Add entries over time to see the trend line."
      />
    );
  }
  const values = rows.map((r) => r.weight).concat(target ? [target] : []);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  return (
    <ChartFrame
      summary={`Weight over time in ${units}`}
      columns={[{ key: "label", label: "Date" }, { key: "weight", label: `Weight (${units})` }]}
      rows={rows}
      height={height}
      legend={target ? <ChartLegend items={[{ label: "Target", color: "var(--subtle)", dashed: true }]} /> : undefined}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} minTickGap={24} />
          <YAxis {...axisProps} domain={[min, max]} width={48} />
          <Tooltip cursor={{ stroke: "var(--border-strong)" }} content={<ChartTooltip unit={units} />} />
          {target && <ReferenceLine y={target} stroke="var(--subtle)" strokeDasharray="4 4" />}
          <Line type="monotone" dataKey="weight" name="Weight" stroke={CHART.s1} strokeWidth={2} dot={{ r: 3, fill: CHART.s1, strokeWidth: 0 }} activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function Overview() {
  const { data } = useUserData();
  const units = data.settings.units;
  const consistency = weeklyConsistency(data, 8);
  const change = weightChange(data);
  const streak = activeStreak(data);
  const now = new Date();
  const monthCount = sessionsBetween(data.sessions, toISODate(startOfMonth(now)), toISODate(endOfMonth(now))).length;
  const totalMinutes = Math.round(data.sessions.reduce((a, s) => a + s.durationSec, 0) / 60);
  const recent = [...data.sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 5);
  const hasConsistency = consistency.some((w) => w.planned || w.completed);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={Dumbbell} label="Workouts completed" value={data.sessions.length} sub={`${totalMinutes.toLocaleString()} minutes total`} />
        <StatTile icon={CalendarCheck} label="This month" value={monthCount} sub="sessions logged" />
        <StatTile icon={Flame} label="Active streak" value={`${streak} d`} sub="workout or habit each day" />
        <StatTile
          icon={change !== undefined && change < 0 ? TrendingDown : TrendingUp}
          label="Weight change"
          value={change === undefined ? "—" : `${change > 0 ? "+" : ""}${toDisplayWeight(change, units)} ${units}`}
          sub={change === undefined ? "Log at least two entries" : "since first entry"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Weekly consistency</CardTitle>
              <CardDescription>Completed vs. planned sessions, last 8 weeks</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {hasConsistency ? (
              <ChartFrame
                summary="Completed and planned workouts per week for the last 8 weeks"
                columns={[{ key: "week", label: "Week of" }, { key: "completed", label: "Completed" }, { key: "planned", label: "Planned" }]}
                rows={consistency}
                height={240}
                legend={<ChartLegend items={[{ label: "Completed", color: CHART.s1 }, { label: "Planned", color: CHART.s2 }]} />}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consistency} margin={{ top: 8, right: 0, left: -20, bottom: 0 }} barGap={2}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="week" {...axisProps} minTickGap={8} />
                    <YAxis {...axisProps} allowDecimals={false} width={44} />
                    <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip />} />
                    <Bar dataKey="completed" name="Completed" fill={CHART.s1} radius={[4, 4, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="planned" name="Planned" fill={CHART.s2} radius={[4, 4, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            ) : (
              <EmptyState
                compact
                icon={CalendarCheck}
                title="No workouts yet"
                description="Plan or complete a workout and your weekly consistency will appear here."
                action={
                  <Button asChild size="sm">
                    <Link href="/dashboard/workouts?plan=1">Plan a workout</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
        <MonthCalendar />
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Weight trend</CardTitle>
              <CardDescription>Optional — log in the Body tab</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <WeightChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent workouts</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/workouts?tab=history">All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length ? (
              <ul className="space-y-3">
                {recent.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.routineName}</p>
                      <p className="text-xs text-muted">{formatDate(s.date, "EEE, MMM d")}</p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{formatDuration(s.durationSec)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No workouts logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-subtle">Progress varies from person to person. These charts reflect your own records — they don’t predict or promise results.</p>
    </div>
  );
}

/* --------------------------------- Body -------------------------------- */

function BodyTab() {
  const { data, update } = useUserData();
  const units = data.settings.units;
  const confirm = useConfirm();
  const [weightDialog, setWeightDialog] = useState<{ open: boolean; entry?: WeightEntry | null }>({ open: false });
  const [measureDialog, setMeasureDialog] = useState<{ open: boolean; entry?: MeasurementEntry | null }>({ open: false });
  const weights = [...data.weights].sort((a, b) => b.date.localeCompare(a.date));
  const measurements = [...data.measurements].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Weight log</CardTitle>
            <CardDescription>Shown in {units}. Change units in Settings.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setWeightDialog({ open: true, entry: null })}>
            <Plus /> Log weight
          </Button>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <WeightChart height={260} />
          {weights.length ? (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <caption className="sr-only">Weight entries</caption>
                <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Date</th>
                    <th scope="col" className="px-3 py-2 font-medium">Weight</th>
                    <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {weights.map((w) => (
                    <tr key={w.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        {formatDate(w.date, "MMM d, yyyy")}
                        {w.note && <span className="block text-xs text-muted">{w.note}</span>}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {toDisplayWeight(w.weightKg, units)} {units}
                      </td>
                      <td className="px-1 py-1 text-right">
                        <RowMenu
                          label={`weight on ${formatDate(w.date)}`}
                          onEdit={() => setWeightDialog({ open: true, entry: w })}
                          onDelete={() =>
                            confirm.ask({
                              title: "Delete weight entry?",
                              description: `The entry for ${formatDate(w.date, "MMM d, yyyy")} will be removed.`,
                              confirmLabel: "Delete",
                              destructive: true,
                              onConfirm: () => {
                                update((d) => deleteWeight(d, w.id));
                                toast.success("Entry deleted");
                              },
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Body measurements</CardTitle>
            <CardDescription>Optional · centimetres</CardDescription>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setMeasureDialog({ open: true, entry: null })}>
            <Plus /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {measurements.length ? (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <caption className="sr-only">Body measurements</caption>
                <thead className="bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Date</th>
                    {MEASURE_FIELDS.map(([, label]) => (
                      <th key={label} scope="col" className="px-3 py-2 font-medium">
                        {label}
                      </th>
                    ))}
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m) => (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-3 py-2">{formatDate(m.date, "MMM d, yyyy")}</td>
                      {MEASURE_FIELDS.map(([k]) => (
                        <td key={k} className="px-3 py-2 tabular-nums">
                          {m[k] ?? "—"}
                        </td>
                      ))}
                      <td className="px-1 py-1 text-right">
                        <RowMenu
                          label={`measurements on ${formatDate(m.date)}`}
                          onEdit={() => setMeasureDialog({ open: true, entry: m })}
                          onDelete={() =>
                            confirm.ask({
                              title: "Delete measurements?",
                              description: `Measurements from ${formatDate(m.date, "MMM d, yyyy")} will be removed.`,
                              confirmLabel: "Delete",
                              destructive: true,
                              onConfirm: () => {
                                update((d) => deleteMeasurement(d, m.id));
                                toast.success("Measurements deleted");
                              },
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState compact icon={Ruler} title="No measurements yet" description="Measurements are completely optional." />
          )}
        </CardContent>
      </Card>

      <WeightDialog open={weightDialog.open} onOpenChange={(o) => setWeightDialog((s) => ({ ...s, open: o }))} entry={weightDialog.entry} />
      <MeasurementDialog open={measureDialog.open} onOpenChange={(o) => setMeasureDialog((s) => ({ ...s, open: o }))} entry={measureDialog.entry} />
      {confirm.element}
    </div>
  );
}

/* ------------------------------ PBs & goals ---------------------------- */

function BestsTab() {
  const { data, update } = useUserData();
  const confirm = useConfirm();
  const [dialog, setDialog] = useState<{ open: boolean; entry?: PersonalBest | null }>({ open: false });
  const pbs = [...data.personalBests].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setDialog({ open: true, entry: null })}>
          <Plus /> Add personal best
        </Button>
      </div>
      {pbs.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pbs.map((p) => (
            <li key={p.id} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <Trophy className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.exercise}</p>
                <p className="font-display text-2xl font-bold tabular-nums">
                  {p.value} <span className="text-sm font-semibold text-muted">{p.unit}</span>
                </p>
                <p className="text-xs text-muted">{formatDate(p.date, "MMM d, yyyy")}</p>
              </div>
              <RowMenu
                label={p.exercise}
                onEdit={() => setDialog({ open: true, entry: p })}
                onDelete={() =>
                  confirm.ask({
                    title: "Delete personal best?",
                    description: `“${p.exercise}” will be removed.`,
                    confirmLabel: "Delete",
                    destructive: true,
                    onConfirm: () => {
                      update((d) => deletePersonalBest(d, p.id));
                      toast.success("Personal best deleted");
                    },
                  })
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Trophy} title="No personal bests yet" description="Record a heaviest lift, most reps or longest hold to celebrate progress." />
      )}
      <PersonalBestDialog open={dialog.open} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))} entry={dialog.entry} />
      {confirm.element}
    </div>
  );
}

function GoalsTab() {
  const { data, update } = useUserData();
  const confirm = useConfirm();
  const [dialog, setDialog] = useState<{ open: boolean; entry?: Goal | null }>({ open: false });
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setDialog({ open: true, entry: null })}>
          <Plus /> New goal
        </Button>
      </div>
      {data.goals.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.goals.map((g) => {
            const p = goalProgress(g, data);
            return (
              <li key={g.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{g.title}</p>
                    <p className="text-xs text-muted">
                      {g.metric === "custom" ? "Updated manually" : "Tracked automatically"}
                      {g.deadline && ` · by ${formatDate(g.deadline, "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <RowMenu
                    label={g.title}
                    onEdit={() => setDialog({ open: true, entry: g })}
                    onDelete={() =>
                      confirm.ask({
                        title: "Delete goal?",
                        description: `“${g.title}” will be removed.`,
                        confirmLabel: "Delete",
                        destructive: true,
                        onConfirm: () => {
                          update((d) => deleteGoal(d, g.id));
                          toast.success("Goal deleted");
                        },
                      })
                    }
                  />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={p.percent} label={g.title} className="h-2.5" />
                  <span className="w-11 shrink-0 text-right text-sm font-semibold tabular-nums">{p.percent}%</span>
                </div>
                <p className="mt-2 text-sm text-muted">{p.detail}</p>
                {p.percent >= 100 && (
                  <Badge tone="success" className="mt-3">
                    <Award /> Goal reached
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Flag} title="No goals yet" description="Set a goal to track — workouts per week, water, weight or something of your own." />
      )}
      <GoalDialog open={dialog.open} onOpenChange={(o) => setDialog((s) => ({ ...s, open: o }))} entry={dialog.entry} />
      {confirm.element}
    </div>
  );
}

function AchievementsTab() {
  const { data } = useUserData();
  const list = achievements(data);
  const earned = list.filter((a) => a.earned).length;
  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        {earned} of {list.length} unlocked — achievements celebrate consistency, not perfection.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <li key={a.id} className={cn("rounded-2xl border p-4", a.earned ? "border-primary/40 bg-primary-soft" : "border-border bg-surface")}>
            <div className="flex items-start gap-3">
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", a.earned ? "bg-primary text-primary-foreground" : "bg-surface-2 text-subtle")}>
                {a.earned ? <Award className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-muted">{a.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Progress value={(a.progress / a.goal) * 100} label={a.title} className="h-1.5" />
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {a.progress}/{a.goal}
                  </span>
                </div>
              </div>
            </div>
            <span className="sr-only">{a.earned ? "Unlocked" : "Locked"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState("overview");
  useEffect(() => {
    const t = params.get("tab");
    if (t && ["overview", "body", "bests", "goals", "achievements"].includes(t)) setTab(t);
  }, [params]);
  const tabs = useMemo(
    () => [
      { value: "overview", label: "Overview" },
      { value: "body", label: "Body" },
      { value: "bests", label: "Personal bests" },
      { value: "goals", label: "Goals" },
      { value: "achievements", label: "Achievements" },
    ],
    [],
  );
  return (
    <div>
      <PageHeader title="Progress" description="Your consistency, body logs, personal bests and goals — all from your own records." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <Overview />
        </TabsContent>
        <TabsContent value="body">
          <BodyTab />
        </TabsContent>
        <TabsContent value="bests">
          <BestsTab />
        </TabsContent>
        <TabsContent value="goals">
          <GoalsTab />
        </TabsContent>
        <TabsContent value="achievements">
          <AchievementsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense>
      <ProgressInner />
    </Suspense>
  );
}
