"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, ChartLegend, ChartTooltip, axisProps, gridProps } from "@/components/charts/chart-kit";
import { CHART } from "@/lib/constants";

// Illustrative figures only — not real users or results.
const WEEKLY = [
  { label: "Mon", minutes: 45 },
  { label: "Tue", minutes: 0 },
  { label: "Wed", minutes: 52 },
  { label: "Thu", minutes: 20 },
  { label: "Fri", minutes: 40 },
  { label: "Sat", minutes: 25 },
  { label: "Sun", minutes: 0 },
];

const CONSISTENCY = [
  { week: "Wk 1", planned: 3, completed: 2 },
  { week: "Wk 2", planned: 3, completed: 3 },
  { week: "Wk 3", planned: 4, completed: 3 },
  { week: "Wk 4", planned: 4, completed: 4 },
  { week: "Wk 5", planned: 4, completed: 3 },
  { week: "Wk 6", planned: 4, completed: 4 },
];

export function ProgressPreview() {
  const total = WEEKLY.reduce((a, d) => a + d.minutes, 0);
  const rate = Math.round(
    (CONSISTENCY.reduce((a, w) => a + w.completed, 0) / CONSISTENCY.reduce((a, w) => a + w.planned, 0)) * 100,
  );
  return (
    <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_1.3fr_0.7fr]">
      <div className="rounded-3xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">Weekly activity</p>
        <p className="mt-1 font-display text-4xl font-bold tabular-nums">
          {total} <span className="text-lg text-muted">min</span>
        </p>
        <div className="mt-2">
          <ChartFrame
            summary="Illustrative active minutes per day for one week"
            columns={[{ key: "label", label: "Day" }, { key: "minutes", label: "Minutes" }]}
            rows={WEEKLY}
            height={180}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={44} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip unit="min" />} />
                <Bar dataKey="minutes" name="Active minutes" fill={CHART.s1} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-5">
        <p className="text-sm text-muted">Workout consistency</p>
        <p className="mt-1 font-display text-4xl font-bold tabular-nums">
          {rate}% <span className="text-lg text-muted">of planned sessions</span>
        </p>
        <div className="mt-2">
          <ChartFrame
            summary="Illustrative planned versus completed workouts over six weeks"
            columns={[{ key: "week", label: "Week" }, { key: "planned", label: "Planned" }, { key: "completed", label: "Completed" }]}
            rows={CONSISTENCY}
            height={180}
            legend={<ChartLegend items={[{ label: "Completed", color: CHART.s1 }, { label: "Planned", color: CHART.s2, dashed: true }]} />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CONSISTENCY} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="week" {...axisProps} />
                <YAxis {...axisProps} allowDecimals={false} width={44} />
                <Tooltip cursor={{ stroke: "var(--border-strong)" }} content={<ChartTooltip unit="sessions" />} />
                <Area type="monotone" dataKey="planned" name="Planned" stroke={CHART.s2} strokeWidth={2} strokeDasharray="5 4" fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke={CHART.s1} strokeWidth={2} fill={CHART.s1} fillOpacity={0.15} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartFrame>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-surface p-5">
        <div>
          <p className="text-sm text-muted">Active streak</p>
          <p className="mt-1 font-display text-6xl font-bold tabular-nums">12</p>
          <p className="text-sm text-muted">days in a row</p>
        </div>
        <ul className="space-y-2 text-sm">
          {["First Session", "Week of Momentum", "Well Hydrated"].map((a) => (
            <li key={a} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
