"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Info, MoreHorizontal, Pencil, Plus, Salad, Target, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { ChartFrame, ChartLegend, ChartTooltip, axisProps, gridProps } from "@/components/charts/chart-kit";
import { WaterTracker } from "@/components/dashboard/widgets";
import { MealDialog } from "@/components/nutrition/meal-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressRing } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/segmented";
import { copyMealsToDay, deleteMeal, setMealCompleted, updateSettings } from "@/lib/actions";
import { mealTotals, mealsOn, weeklyNutrition } from "@/lib/calculations";
import { CHART, DIET_PREFERENCES, MACRO_COLORS, MEAL_TYPES } from "@/lib/constants";
import { formatDate, shiftISO, todayISO, weekDates } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { Meal, MealType } from "@/lib/types";
import { cn, pct } from "@/lib/utils";

function TargetsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, update } = useUserData();
  const s = data.settings;
  const [vals, setVals] = useState({ calorieTarget: "", proteinTarget: "", carbsTarget: "", fatTarget: "", waterGoalMl: "" });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open)
      setVals({
        calorieTarget: String(s.calorieTarget),
        proteinTarget: String(s.proteinTarget),
        carbsTarget: String(s.carbsTarget),
        fatTarget: String(s.fatTarget),
        waterGoalMl: String(s.waterGoalMl),
      });
    setError(null);
  }, [open, s]);

  const limits = { calorieTarget: [1200, 5000], proteinTarget: [20, 300], carbsTarget: [50, 600], fatTarget: [20, 250], waterGoalMl: [1000, 6000] } as const;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, Number(v)])) as Record<keyof typeof limits, number>;
    for (const [k, [min, max]] of Object.entries(limits) as [keyof typeof limits, readonly [number, number]][]) {
      if (!Number.isFinite(parsed[k]) || parsed[k] < min || parsed[k] > max) {
        setError(`Please keep values in a sensible range (e.g. calories ${limits.calorieTarget[0]}–${limits.calorieTarget[1]}).`);
        return;
      }
    }
    update((d) => updateSettings(d, parsed));
    toast.success("Daily targets updated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Daily targets" description="Set targets that suit you. These are personal reference points, not medical recommendations." size="sm">
        <form onSubmit={save} className="space-y-3" noValidate>
          {(
            [
              ["calorieTarget", "Calories (kcal)"],
              ["proteinTarget", "Protein (g)"],
              ["carbsTarget", "Carbs (g)"],
              ["fatTarget", "Fat (g)"],
              ["waterGoalMl", "Water (ml)"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label} htmlFor={`tgt-${k}`}>
              <Input id={`tgt-${k}`} type="number" value={vals[k]} onChange={(e) => setVals((v) => ({ ...v, [k]: e.target.value }))} />
            </Field>
          ))}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <p className="text-xs text-subtle">For personalised nutrition guidance, please speak with a registered dietitian or doctor.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save targets</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MealRow({ meal, onEdit }: { meal: Meal; onEdit: () => void }) {
  const { update } = useUserData();
  const confirm = useConfirm();
  return (
    <li className={cn("flex items-start gap-3 px-4 py-3", meal.completed && "bg-primary-soft/40")}>
      <Checkbox
        size="lg"
        className="mt-0.5"
        checked={meal.completed}
        onCheckedChange={(v) => update((d) => setMealCompleted(d, meal.id, v === true))}
        aria-label={`Mark ${meal.name} as ${meal.completed ? "not eaten" : "eaten"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{meal.name}</p>
        <p className="text-xs text-muted">
          {meal.serving} · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
        </p>
      </div>
      <span className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums">{meal.calories}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="-mr-2" aria-label={`Actions for ${meal.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            destructive
            onSelect={() =>
              confirm.ask({
                title: "Remove meal?",
                description: `“${meal.name}” will be removed from this day.`,
                confirmLabel: "Remove",
                destructive: true,
                onConfirm: () => {
                  update((d) => deleteMeal(d, meal.id));
                  toast.success("Meal removed");
                },
              })
            }
          >
            <Trash2 /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {confirm.element}
    </li>
  );
}

function WeekView({ anchor }: { anchor: string }) {
  const { data } = useUserData();
  const rows = weeklyNutrition(data, anchor);
  const logged = rows.filter((r) => r.eaten > 0);
  const avg = logged.length ? Math.round(logged.reduce((a, r) => a + r.eaten, 0) / logged.length) : 0;
  const avgProtein = logged.length ? Math.round(logged.reduce((a, r) => a + r.protein, 0) / logged.length) : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted">Avg. calories eaten</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{avg.toLocaleString()}</p>
            <p className="text-xs text-muted">on {logged.length} logged day{logged.length === 1 ? "" : "s"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted">Avg. protein</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">{avgProtein} g</p>
            <p className="text-xs text-muted">target {data.settings.proteinTarget} g</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted">Meals checked off</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">
              {weekDates(anchor).reduce((a, d) => a + mealsOn(data, d).filter((m) => m.completed).length, 0)}/
              {weekDates(anchor).reduce((a, d) => a + mealsOn(data, d).length, 0)}
            </p>
            <p className="text-xs text-muted">planned this week</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Calories by day</CardTitle>
            <CardDescription>Eaten vs. planned (approximate)</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ChartFrame
            summary="Calories eaten and planned per day this week"
            columns={[{ key: "label", label: "Day" }, { key: "eaten", label: "Eaten (kcal)" }, { key: "planned", label: "Planned (kcal)" }, { key: "protein", label: "Protein (g)" }]}
            rows={rows}
            height={260}
            legend={<ChartLegend items={[{ label: "Eaten", color: CHART.s1 }, { label: "Planned", color: CHART.s2 }, { label: "Target", color: "var(--subtle)", dashed: true }]} />}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={2}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={52} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip unit="kcal" />} />
                <ReferenceLine y={data.settings.calorieTarget} stroke="var(--subtle)" strokeDasharray="4 4" />
                <Bar dataKey="eaten" name="Eaten" fill={CHART.s1} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="planned" name="Planned" fill={CHART.s2} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </CardContent>
      </Card>
    </div>
  );
}

function NutritionInner() {
  const { data, update } = useUserData();
  const params = useSearchParams();
  const router = useRouter();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [view, setView] = useState<"day" | "week">("day");
  const [dialog, setDialog] = useState<{ open: boolean; type?: MealType; meal?: Meal | null }>({ open: false });
  const [targetsOpen, setTargetsOpen] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (params.get("new") === "1") {
      setDialog({ open: true, type: "snack" });
      router.replace("/dashboard/nutrition");
    }
  }, [params, router]);

  const meals = useMemo(() => mealsOn(data, date), [data, date]);
  const eaten = mealTotals(meals, true);
  const planned = mealTotals(meals);
  const s = data.settings;
  const yesterday = shiftISO(date, -1);
  const yesterdayCount = mealsOn(data, yesterday).length;

  function copyYesterday() {
    const run = () => {
      update((d) => copyMealsToDay(d, yesterday, date));
      toast.success(`Copied ${yesterdayCount} meal${yesterdayCount === 1 ? "" : "s"} from ${formatDate(yesterday, "EEE")}`);
    };
    if (meals.length) {
      confirm.ask({
        title: "Copy meals into this day?",
        description: `This day already has ${meals.length} meal${meals.length === 1 ? "" : "s"}. ${yesterdayCount} more will be added.`,
        confirmLabel: "Copy meals",
        onConfirm: run,
      });
    } else run();
  }

  const macros = [
    { key: "protein", label: "Protein", value: eaten.protein, target: s.proteinTarget },
    { key: "carbs", label: "Carbs", value: eaten.carbs, target: s.carbsTarget },
    { key: "fat", label: "Fat", value: eaten.fat, target: s.fatTarget },
  ] as const;

  return (
    <div>
      <PageHeader
        title="Nutrition"
        description="Plan meals, check them off, and keep an eye on approximate totals."
        actions={
          <>
            <Button variant="outline" onClick={() => setTargetsOpen(true)}>
              <Target /> Targets
            </Button>
            <Button onClick={() => setDialog({ open: true, type: "breakfast" })}>
              <Plus /> Add meal
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label={view === "day" ? "Previous day" : "Previous week"} onClick={() => setDate((d) => shiftISO(d, view === "day" ? -1 : -7))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label={view === "day" ? "Next day" : "Next week"} onClick={() => setDate((d) => shiftISO(d, view === "day" ? 1 : 7))}>
            <ChevronRight />
          </Button>
          <h2 className="ml-1 text-lg font-semibold" aria-live="polite">
            {view === "day"
              ? date === today
                ? `Today · ${formatDate(date, "MMM d")}`
                : formatDate(date, "EEEE, MMM d")
              : `${formatDate(weekDates(date)[0]!, "MMM d")} – ${formatDate(weekDates(date)[6]!, "MMM d")}`}
          </h2>
          {date !== today && (
            <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
              Today
            </Button>
          )}
        </div>
        <Segmented
          label="Nutrition view"
          value={view}
          onChange={setView}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
          ]}
        />
      </div>

      {view === "week" ? (
        <WeekView anchor={date} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] [&>*]:min-w-0">
          <div className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <ProgressRing value={pct(eaten.calories, s.calorieTarget)} size={128} stroke={11} label="Calories eaten vs target">
                  <span className="font-display text-2xl font-bold tabular-nums">{eaten.calories.toLocaleString()}</span>
                  <span className="text-[11px] text-muted">of {s.calorieTarget.toLocaleString()} kcal</span>
                </ProgressRing>
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-sm text-muted">
                    Planned for the day: <span className="font-semibold text-foreground">{planned.calories.toLocaleString()} kcal</span>
                    {" · "}
                    {meals.filter((m) => m.completed).length}/{meals.length} meals eaten
                  </p>
                  {macros.map((m) => (
                    <div key={m.key}>
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted">
                          <span className="size-2 rounded-sm" style={{ background: MACRO_COLORS[m.key] }} aria-hidden />
                          {m.label}
                        </span>
                        <span className="tabular-nums">
                          {m.value} / {m.target} g
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-label={m.label} aria-valuenow={pct(m.value, m.target)} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct(m.value, m.target)}%`, background: MACRO_COLORS[m.key] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {meals.length === 0 && yesterdayCount > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border-strong p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">Nothing planned yet. Reuse {formatDate(yesterday, "EEEE")}’s meals?</p>
                <Button variant="secondary" size="sm" onClick={copyYesterday}>
                  <Copy /> Copy {yesterdayCount} meal{yesterdayCount === 1 ? "" : "s"}
                </Button>
              </div>
            )}

            {(Object.keys(MEAL_TYPES) as MealType[]).map((type) => {
              const list = meals.filter((m) => m.type === type);
              const total = mealTotals(list);
              return (
                <Card key={type}>
                  <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <div>
                      <h3 className="font-semibold">{MEAL_TYPES[type].label}</h3>
                      <p className="text-xs text-muted">{list.length ? `${total.calories} kcal · ${total.protein} g protein` : MEAL_TYPES[type].time}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setDialog({ open: true, type })} aria-label={`Add to ${MEAL_TYPES[type].label}`}>
                      <Plus /> Add
                    </Button>
                  </div>
                  {list.length ? (
                    <ul className="divide-y divide-border">
                      {list.map((m) => (
                        <MealRow key={m.id} meal={m} onEdit={() => setDialog({ open: true, meal: m })} />
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-4 text-sm text-subtle">No {MEAL_TYPES[type].label.toLowerCase()} planned.</p>
                  )}
                </Card>
              );
            })}

            {meals.length > 0 && yesterdayCount > 0 && (
              <Button variant="ghost" size="sm" onClick={copyYesterday}>
                <Copy /> Copy meals from {formatDate(yesterday, "EEEE")}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hydration</CardTitle>
              </CardHeader>
              <CardContent>
                <WaterTracker date={date} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  <Salad className="size-4 text-accent-text" aria-hidden /> Your preferences
                </p>
                <p className="text-muted">
                  Diet: <span className="text-foreground">{DIET_PREFERENCES[data.profile.diet]}</span>
                </p>
                <p className="text-muted">
                  Allergies: <span className="text-foreground">{data.profile.allergies.length ? data.profile.allergies.join(", ") : "None listed"}</span>
                </p>
                <p className="text-xs text-subtle">Change these in Profile. The meal library is filtered to your diet by default.</p>
              </CardContent>
            </Card>
            <p className="flex gap-2 rounded-2xl border border-border p-4 text-xs leading-relaxed text-muted">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              Nutrition values are approximate. Sample meal plans are general educational examples, not medical or dietetic advice.
            </p>
          </div>
        </div>
      )}

      <MealDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} date={date} type={dialog.type} meal={dialog.meal} />
      <TargetsDialog open={targetsOpen} onOpenChange={setTargetsOpen} />
      {confirm.element}
    </div>
  );
}

export default function NutritionPage() {
  return (
    <Suspense>
      <NutritionInner />
    </Suspense>
  );
}
