"use client";

import { useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { CHART } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Shared recessive axis styling. */
export const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.axis, fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = { stroke: CHART.grid, vertical: false } as const;

interface TooltipPayload {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/** Tooltip content: text wears text tokens; a swatch carries series identity. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  unit?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs shadow-xl">
      {label !== undefined && <p className="mb-1 font-medium text-foreground">{label}</p>}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey)} className="flex items-center gap-2 text-muted">
            <span className="size-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />
            <span>{p.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-foreground">
              {typeof p.value === "number" && formatter ? formatter(p.value) : p.value}
              {unit ? ` ${unit}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            className={cn("inline-block h-2.5 w-2.5 rounded-sm", i.dashed && "h-0.5 w-4 rounded-none")}
            style={i.dashed ? { borderTop: `2px dashed ${i.color}` } : { background: i.color }}
            aria-hidden
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

interface ChartFrameProps {
  /** Accessible summary of what the chart shows. */
  summary: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
  legend?: React.ReactNode;
  height?: number;
  children: React.ReactNode;
}

/** Wraps a chart with a legend and a "view as table" alternative. */
export function ChartFrame({ summary, columns, rows, legend, height = 240, children }: ChartFrameProps) {
  const [table, setTable] = useState(false);
  return (
    <figure className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">{legend}</div>
        <button
          type="button"
          onClick={() => setTable((t) => !t)}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-pressed={table}
        >
          {table ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
          {table ? "Chart" : "Table"}
        </button>
      </div>
      {table ? (
        <div className="max-h-72 overflow-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{summary}</caption>
            <thead className="sticky top-0 bg-surface-2 text-xs text-muted">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" className="px-3 py-2 font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 tabular-nums">
                      {r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label={summary} style={{ height }} className="w-full min-w-0">
          {children}
        </div>
      )}
    </figure>
  );
}
