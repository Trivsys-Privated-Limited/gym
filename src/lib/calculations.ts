/** Pure business calculations — no React, no storage. Easy to unit test or move server-side. */
import type {
  Goal,
  MacroInfo,
  Meal,
  Member,
  MemberStatus,
  Task,
  UserData,
  WeightEntry,
  WorkoutSession,
} from "./types";
import { shiftISO, todayISO, weekDates, formatDate } from "./dates";
import { pct, round } from "./utils";

/* ------------------------------ nutrition ----------------------------- */

export function mealTotals(meals: Meal[], onlyCompleted = false): MacroInfo {
  return meals
    .filter((m) => !onlyCompleted || m.completed)
    .reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

export function mealsOn(data: UserData, date: string) {
  return data.meals.filter((m) => m.date === date);
}

export function weeklyNutrition(data: UserData, anchor: string) {
  return weekDates(anchor).map((date) => {
    const meals = mealsOn(data, date);
    const eaten = mealTotals(meals, true);
    const planned = mealTotals(meals);
    return { date, label: formatDate(date, "EEE"), eaten: eaten.calories, planned: planned.calories, protein: eaten.protein };
  });
}

export function macroCalories(m: MacroInfo) {
  return { protein: m.protein * 4, carbs: m.carbs * 4, fat: m.fat * 9 };
}

/* -------------------------------- tasks ------------------------------- */

export function taskStats(tasks: Task[]) {
  const done = tasks.filter((t) => t.completed).length;
  return { total: tasks.length, done, open: tasks.length - done, percent: pct(done, tasks.length) };
}

export function tasksDueOn(tasks: Task[], date: string) {
  return tasks.filter((t) => t.dueDate === date);
}

export function sortTasks(tasks: Task[]) {
  const pr = { high: 0, medium: 1, low: 2 } as const;
  return [...tasks].sort(
    (a, b) =>
      Number(a.completed) - Number(b.completed) ||
      a.dueDate.localeCompare(b.dueDate) ||
      (a.dueTime ?? "99").localeCompare(b.dueTime ?? "99") ||
      pr[a.priority] - pr[b.priority],
  );
}

export function habitCompletion(data: UserData, date: string) {
  const done = (data.habitLog[date] ?? []).filter((id) => data.habits.some((h) => h.id === id)).length;
  return { done, total: data.habits.length, percent: pct(done, data.habits.length) };
}

/* ------------------------------- workouts ----------------------------- */

export function sessionsBetween(sessions: WorkoutSession[], from: string, to: string) {
  return sessions.filter((s) => s.date >= from && s.date <= to);
}

export function weeklyActivity(sessions: WorkoutSession[], anchor: string) {
  return weekDates(anchor).map((date) => {
    const day = sessions.filter((s) => s.date === date);
    return {
      date,
      label: formatDate(date, "EEE"),
      minutes: Math.round(day.reduce((a, s) => a + s.durationSec, 0) / 60),
      sessions: day.length,
    };
  });
}

/** Sessions per week for the last N weeks (oldest first). */
export function weeklyConsistency(data: UserData, weeks = 8, today = todayISO()) {
  return Array.from({ length: weeks }, (_, i) => {
    const anchor = shiftISO(today, -7 * (weeks - 1 - i));
    const days = weekDates(anchor);
    const from = days[0]!;
    const to = days[6]!;
    const planned = data.schedule.filter((s) => s.date >= from && s.date <= to).length;
    const completed = sessionsBetween(data.sessions, from, to).length;
    return { week: formatDate(from, "MMM d"), completed, planned };
  });
}

export function sessionSetTotals(s: WorkoutSession) {
  const planned = s.exercises.reduce((a, e) => a + e.setsPlanned, 0);
  const done = s.exercises.reduce((a, e) => a + e.setsCompleted, 0);
  return { planned, done };
}

/** Consecutive days (ending today or yesterday) with a workout or at least one habit done. */
export function activeStreak(data: UserData, today = todayISO()) {
  const active = (d: string) => data.sessions.some((s) => s.date === d) || (data.habitLog[d]?.length ?? 0) > 0;
  let cursor = active(today) ? today : shiftISO(today, -1);
  let streak = 0;
  while (active(cursor) && streak < 366) {
    streak++;
    cursor = shiftISO(cursor, -1);
  }
  return streak;
}

/* ------------------------------- progress ----------------------------- */

export function sortedWeights(weights: WeightEntry[]) {
  return [...weights].sort((a, b) => a.date.localeCompare(b.date));
}

export function latestWeight(data: UserData): number | undefined {
  return sortedWeights(data.weights).at(-1)?.weightKg ?? data.profile.startingWeightKg;
}

export function weightChange(data: UserData) {
  const sorted = sortedWeights(data.weights);
  if (sorted.length < 2) return undefined;
  return round(sorted.at(-1)!.weightKg - sorted[0]!.weightKg, 1);
}

export interface GoalProgress {
  current: number;
  target: number;
  percent: number;
  detail: string;
}

export function goalProgress(goal: Goal, data: UserData, today = todayISO()): GoalProgress {
  switch (goal.metric) {
    case "weekly-workouts": {
      const days = weekDates(today);
      const current = sessionsBetween(data.sessions, days[0]!, days[6]!).length;
      return { current, target: goal.target, percent: pct(current, goal.target), detail: `${current} of ${goal.target} this week` };
    }
    case "daily-water": {
      const current = data.water[today] ?? 0;
      return { current, target: goal.target, percent: pct(current, goal.target), detail: `${current} of ${goal.target} ml today` };
    }
    case "target-weight": {
      const sorted = sortedWeights(data.weights);
      const start = data.profile.startingWeightKg ?? sorted[0]?.weightKg;
      const current = sorted.at(-1)?.weightKg ?? start;
      if (start == null || current == null) {
        return { current: 0, target: goal.target, percent: 0, detail: "Log your weight to track this goal" };
      }
      const totalDelta = goal.target - start;
      const done = current - start;
      const percent = totalDelta === 0 ? 100 : pct(Math.max(0, done / totalDelta) * 100, 100);
      return { current, target: goal.target, percent, detail: `${current} kg now · target ${goal.target} kg` };
    }
    default:
      return {
        current: goal.current,
        target: goal.target,
        percent: pct(goal.current, goal.target),
        detail: `${goal.current} of ${goal.target} ${goal.unit}`,
      };
  }
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  earned: boolean;
}

export function achievements(data: UserData, today = todayISO()): Achievement[] {
  const workouts = data.sessions.length;
  const streak = activeStreak(data, today);
  const hydrationDays = Object.values(data.water).filter((ml) => ml >= data.settings.waterGoalMl).length;
  const tasksDone = data.tasks.filter((t) => t.completed).length;
  const weighIns = data.weights.length;
  const habitDays = Object.values(data.habitLog).filter((ids) => ids.length >= Math.max(1, data.habits.length)).length;
  const list = [
    { id: "first-workout", title: "First Session", description: "Complete your first workout.", progress: workouts, goal: 1 },
    { id: "ten-workouts", title: "Double Digits", description: "Complete 10 workouts.", progress: workouts, goal: 10 },
    { id: "streak-7", title: "Week of Momentum", description: "Stay active 7 days in a row.", progress: streak, goal: 7 },
    { id: "hydration-5", title: "Well Hydrated", description: "Hit your water goal on 5 days.", progress: hydrationDays, goal: 5 },
    { id: "tasks-20", title: "Checklist Pro", description: "Complete 20 daily tasks.", progress: tasksDone, goal: 20 },
    { id: "weigh-ins", title: "Steady Tracker", description: "Log your weight 8 times.", progress: weighIns, goal: 8 },
    { id: "habits-all", title: "Full House", description: "Complete every habit in a single day.", progress: habitDays, goal: 1 },
  ];
  return list.map((a) => ({ ...a, progress: Math.min(a.progress, a.goal), earned: a.progress >= a.goal }));
}

/* --------------------------------- gym -------------------------------- */

export function memberStatus(m: Member, today = todayISO()): MemberStatus {
  if (m.frozen) return "frozen";
  if (m.expiryDate < today) return "expired";
  if (m.expiryDate <= shiftISO(today, 14)) return "expiring";
  return "active";
}
