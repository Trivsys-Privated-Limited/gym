"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, describedBy } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addMeal, updateMeal } from "@/lib/actions";
import { DIET_TAGS, MEAL_TYPES } from "@/lib/constants";
import { MEAL_LIBRARY } from "@/lib/data/templates";
import { mealSchema, type MealValues } from "@/lib/schemas";
import { useUserData } from "@/lib/store/app-store";
import type { DietPreference, DietTag, Meal, MealType } from "@/lib/types";

/** Map a profile preference onto the meal tag that satisfies it. */
const PREF_TO_TAG: Partial<Record<DietPreference, DietTag>> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  pescatarian: "pescatarian",
  "dairy-free": "dairy-free",
  "gluten-free": "gluten-free",
};

function suitsPreference(tags: DietTag[], tag: DietTag | "all") {
  if (tag === "all") return true;
  if (tag === "pescatarian") return tags.includes("pescatarian") || tags.includes("vegetarian");
  if (tag === "vegetarian") return tags.includes("vegetarian") || tags.includes("vegan");
  return tags.includes(tag);
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string;
  type?: MealType;
  meal?: Meal | null;
}

export function MealDialog({ open, onOpenChange, date, type = "breakfast", meal }: Props) {
  const { data, update } = useUserData();
  const [tab, setTab] = useState<"library" | "custom">("library");
  const [slot, setSlot] = useState<MealType>(type);
  const prefTag = PREF_TO_TAG[data.profile.diet];
  const [tag, setTag] = useState<DietTag | "all">(prefTag ?? "all");
  const [added, setAdded] = useState<string[]>([]);

  const blank: MealValues = { name: "", type, serving: "1 serving", calories: 0, protein: 0, carbs: 0, fat: 0, date };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MealValues>({ resolver: zodResolver(mealSchema), defaultValues: blank });

  useEffect(() => {
    if (!open) return;
    setTab(meal ? "custom" : "library");
    setSlot(meal?.type ?? type);
    setTag(prefTag ?? "all");
    setAdded([]);
    reset(meal ? { name: meal.name, type: meal.type, serving: meal.serving, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, date: meal.date } : { ...blank, type });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meal, type, date]);

  const library = useMemo(
    () => MEAL_LIBRARY.filter((m) => suitsPreference(m.tags, tag)).sort((a, b) => Number(b.type === slot) - Number(a.type === slot)),
    [tag, slot],
  );
  const allergyWarning = (name: string) =>
    data.profile.allergies.find((a) => name.toLowerCase().includes(a.toLowerCase().replace(/s$/, "")));

  function addFromLibrary(id: string) {
    const t = MEAL_LIBRARY.find((m) => m.id === id);
    if (!t) return;
    const { id: _ignored, ...rest } = t;
    void _ignored;
    update((d) => addMeal(d, { ...rest, type: slot, date }));
    setAdded((a) => [...a, id]);
    toast.success(`Added to ${MEAL_TYPES[slot].label.toLowerCase()}`, { description: t.name });
  }

  function onSubmit(v: MealValues) {
    const input = {
      name: v.name.trim(),
      serving: v.serving.trim(),
      type: v.type as MealType,
      calories: Math.round(v.calories),
      protein: Math.round(v.protein),
      carbs: Math.round(v.carbs),
      fat: Math.round(v.fat),
      date: v.date,
    };
    if (meal) {
      update((d) => updateMeal(d, meal.id, input));
      toast.success("Meal updated");
    } else {
      update((d) => addMeal(d, { ...input, tags: [] }));
      toast.success("Meal added", { description: input.name });
    }
    onOpenChange(false);
  }

  const customForm = (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Food or meal" htmlFor="meal-name" error={errors.name?.message}>
        <Input {...describedBy("meal-name", errors.name?.message)} placeholder="e.g. Chicken salad" {...register("name")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Meal" htmlFor="meal-type">
          <Select id="meal-type" {...register("type")}>
            {(Object.keys(MEAL_TYPES) as MealType[]).map((t) => (
              <option key={t} value={t}>
                {MEAL_TYPES[t].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Serving size" htmlFor="meal-serving" error={errors.serving?.message}>
          <Input {...describedBy("meal-serving", errors.serving?.message)} {...register("serving")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["calories", "Calories", "kcal"],
            ["protein", "Protein", "g"],
            ["carbs", "Carbs", "g"],
            ["fat", "Fat", "g"],
          ] as const
        ).map(([key, label, unit]) => (
          <Field key={key} label={`${label} (${unit})`} htmlFor={`meal-${key}`} error={errors[key]?.message}>
            <Input {...describedBy(`meal-${key}`, errors[key]?.message)} type="number" inputMode="decimal" min={0} {...register(key)} />
          </Field>
        ))}
      </div>
      <Field label="Date" htmlFor="meal-date">
        <Input id="meal-date" type="date" {...register("date")} />
      </Field>
      <p className="text-xs text-subtle">Use approximate values — packaging labels or a nutrition database are good sources.</p>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit">{meal ? "Save meal" : "Add meal"}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={meal ? "Edit meal" : "Add a meal"} description="Nutrition values are approximate." size="lg">
        {meal ? (
          customForm
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="library">From meal library</TabsTrigger>
              <TabsTrigger value="custom">Custom food</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                <Select aria-label="Add to meal" value={slot} onChange={(e) => setSlot(e.target.value as MealType)}>
                  {(Object.keys(MEAL_TYPES) as MealType[]).map((t) => (
                    <option key={t} value={t}>
                      Add to {MEAL_TYPES[t].label.toLowerCase()}
                    </option>
                  ))}
                </Select>
                <Select aria-label="Dietary filter" value={tag} onChange={(e) => setTag(e.target.value as typeof tag)}>
                  <option value="all">All diets</option>
                  {(Object.keys(DIET_TAGS) as DietTag[]).map((t) => (
                    <option key={t} value={t}>
                      {DIET_TAGS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                {library.map((m) => {
                  const warn = allergyWarning(m.name);
                  const isAdded = added.includes(m.id);
                  return (
                    <li key={m.id} className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted">
                          {MEAL_TYPES[m.type].label} · {m.serving} · {m.calories} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                        </p>
                        {warn && (
                          <Badge tone="warning" className="mt-1">
                            Check ingredients: {warn}
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant={isAdded ? "ghost" : "secondary"} onClick={() => addFromLibrary(m.id)} aria-label={`Add ${m.name}`}>
                        <Plus /> {isAdded ? "Add again" : "Add"}
                      </Button>
                    </li>
                  );
                })}
                {library.length === 0 && <li className="p-4 text-center text-sm text-muted">No sample meals match this filter.</li>}
              </ul>
              <DialogFooter>
                <Button onClick={() => onOpenChange(false)}>Done</Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="custom" className="mt-4">
              {customForm}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
