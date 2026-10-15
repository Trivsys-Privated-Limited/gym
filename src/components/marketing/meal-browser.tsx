"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { DIET_TAGS, MEAL_TYPES } from "@/lib/constants";
import { MEAL_LIBRARY } from "@/lib/data/templates";
import type { DietTag } from "@/lib/types";

type Filter = "all" | DietTag;

export function MealBrowser() {
  const [filter, setFilter] = useState<Filter>("all");
  const meals = useMemo(() => MEAL_LIBRARY.filter((m) => filter === "all" || m.tags.includes(filter)), [filter]);
  const options: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    ...(["vegetarian", "vegan", "high-protein", "dairy-free", "gluten-free"] as DietTag[]).map((t) => ({ value: t, label: DIET_TAGS[t] })),
  ];

  return (
    <div className="mt-10">
      <Segmented label="Filter meals by diet" value={filter} onChange={setFilter} options={options} />
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        Showing {meals.length} sample meal{meals.length === 1 ? "" : "s"}
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {meals.map((m) => (
          <li key={m.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-subtle">{MEAL_TYPES[m.type].label}</p>
            <h3 className="mt-1 font-semibold">{m.name}</h3>
            <p className="text-xs text-muted">{m.serving}</p>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-xs">
              {[
                ["kcal", m.calories],
                ["Protein", `${m.protein}g`],
                ["Carbs", `${m.carbs}g`],
                ["Fat", `${m.fat}g`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-surface-2 px-2 py-1.5 text-center">
                  <dt className="text-subtle">{k}</dt>
                  <dd className="font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-1">
              {m.tags.map((t) => (
                <Badge key={t} tone="outline">
                  {DIET_TAGS[t]}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-subtle">All values are approximate.</p>
    </div>
  );
}
