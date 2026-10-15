"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Apple,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flag,
  Minus,
  Plus,
  Scale,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, ChartTooltip, axisProps, gridProps } from "@/components/charts/chart-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { addWater, setTaskCompleted } from "@/lib/actions";
import { goalProgress, weeklyActivity } from "@/lib/calculations";
import { CHART, PRIORITIES, TASK_CATEGORIES } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { ActivityType, Task } from "@/lib/types";
import { cn, pct } from "@/lib/utils";
import { toast } from "sonner";

/* ------------------------------- StatTile ------------------------------ */

export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  progress?: number;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <Icon className="size-4 text-subtle" aria-hidden />
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      {progress !== undefined && <Progress value={progress} className="mt-3 h-1.5" label={label} />}
    </>
  );
  const cls = "block rounded-2xl border border-border bg-surface p-4 transition-colors sm:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-border-strong")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------ Water tracker -------------------------- */

export function WaterTracker({ date = todayISO(), compact }: { date?: string; compact?: boolean }) {
  const { data, update } = useUserData();
  const goal = data.settings.waterGoalMl;
  const ml = data.water[date] ?? 0;
  const percent = pct(ml, goal);
  const glasses = Math.ceil(goal / 250);
  const filled = Math.floor(ml / 250);

  function add(amount: number) {
    const before = ml;
    update((d) => addWater(d, date, amount));
    if (amount > 0 && before < goal && before + amount >= goal) toast.success("Water goal reached", { description: "Nice work staying hydrated today." });
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <ProgressRing value={percent} size={compact ? 84 : 104} stroke={9} label="Water intake" color="var(--info)">
          <Droplets className="size-4 text-info" aria-hidden />
          <span className="text-sm font-bold tabular-nums">{percent}%</span>
        </ProgressRing>
        <div className="min-w-0">
          <p className="font-display text-3xl font-bold tabular-nums">
            {(ml / 1000).toFixed(2)} <span className="text-base text-muted">/ {(goal / 1000).toFixed(1)} L</span>
          </p>
          <p className="text-xs text-muted" aria-live="polite">
            {ml >= goal ? "Goal reached — nice work" : `${goal - ml} ml to go`}
          </p>
        </div>
      </div>
      {!compact && (
        <div className="mt-4 flex flex-wrap gap-1" aria-hidden>
          {Array.from({ length: glasses }).map((_, i) => (
            <span key={i} className={cn("h-6 w-3.5 rounded-sm", i < filled ? "bg-info" : "bg-surface-3")} />
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => add(250)}>
          <Plus /> 250 ml
        </Button>
        <Button size="sm" variant="secondary" onClick={() => add(500)}>
          <Plus /> 500 ml
        </Button>
        <Button size="sm" variant="ghost" onClick={() => add(-250)} disabled={ml === 0} aria-label="Remove 250 ml">
          <Minus /> 250
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- Tasks ------------------------------- */

export function TaskCheckRow({ task, actions, showDate }: { task: Task; actions?: React.ReactNode; showDate?: boolean }) {
  const { update } = useUserData();
  const cat = TASK_CATEGORIES[task.category];
  const CatIcon = cat.icon;
  const overdue = !task.completed && task.dueDate < todayISO();
  return (
    <div className={cn("group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2/60", task.completed && "opacity-60")}>
      <Checkbox
        size="lg"
        className="mt-0.5"
        checked={task.completed}
        onCheckedChange={(v) => {
          update((d) => setTaskCompleted(d, task.id, v === true));
          if (v === true) toast.success("Task completed", { description: task.title });
        }}
        aria-label={`Mark “${task.title}” as ${task.completed ? "not done" : "done"}`}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", task.completed && "line-through")}>{task.title}</p>
        {task.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={cat.tone}>
            <CatIcon /> {cat.label}
          </Badge>
          {task.priority !== "low" && <Badge tone={PRIORITIES[task.priority].tone}>{PRIORITIES[task.priority].label}</Badge>}
          {(showDate || overdue) && (
            <span className={cn("text-xs", overdue ? "text-danger" : "text-subtle")}>
              {overdue ? "Overdue · " : ""}
              {formatDate(task.dueDate, "EEE, MMM d")}
            </span>
          )}
          {task.dueTime && <span className="text-xs text-subtle">{task.dueTime}</span>}
        </div>
      </div>
      {actions}
    </div>
  );
}

/* ------------------------------ Week chart ----------------------------- */

export function WeeklyActivityChart({ anchor = todayISO(), height = 200 }: { anchor?: string; height?: number }) {
  const { data } = useUserData();
  const rows = weeklyActivity(data.sessions, anchor);
  return (
    <ChartFrame
      summary="Workout minutes per day this week"
      columns={[{ key: "label", label: "Day" }, { key: "minutes", label: "Minutes" }, { key: "sessions", label: "Sessions" }]}
      rows={rows}
      height={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} width={44} />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip unit="min" />} />
          <Bar dataKey="minutes" name="Workout minutes" fill={CHART.s1} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/* --------------------------------- Goals ------------------------------- */

export function GoalList({ limit }: { limit?: number }) {
  const { data } = useUserData();
  const goals = limit ? data.goals.slice(0, limit) : data.goals;
  if (!goals.length) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong p-4 text-sm text-muted">
        <p>No goals yet. Set one to see your progress here.</p>
        <Button asChild size="sm" variant="secondary">
          <Link href="/dashboard/progress?tab=goals">
            <Flag /> Add a goal
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {goals.map((g) => {
        const p = goalProgress(g, data);
        return (
          <li key={g.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-medium">{g.title}</p>
              <span className="shrink-0 text-xs font-semibold tabular-nums">{p.percent}%</span>
            </div>
            <Progress value={p.percent} className="mt-1.5" label={g.title} />
            <p className="mt-1 text-xs text-muted">{p.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------- Activity ------------------------------ */

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  workout: Dumbbell,
  task: CheckCircle2,
  meal: Apple,
  water: Droplets,
  weight: Scale,
  goal: Flag,
  system: Settings2,
};

export function ActivityFeed({ limit = 6 }: { limit?: number }) {
  const { data } = useUserData();
  const items = data.activity.slice(0, limit);
  if (!items.length) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-dashed border-border-strong p-4 text-sm text-muted">
        <Activity className="size-4" aria-hidden /> Your recent activity will appear here.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => {
        const Icon = ACTIVITY_ICONS[a.type];
        return (
          <li key={a.id} className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">
              <Icon className="size-4 text-muted" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm">{a.message}</p>
              <p className="text-xs text-subtle">{formatDistanceToNow(new Date(a.at), { addSuffix: true })}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
