/**
 * Pure state transitions for the user bucket: (data, input) => data.
 * When a backend arrives, each of these maps naturally onto one API mutation.
 */
import type {
  ActivityType,
  Goal,
  Habit,
  Meal,
  MeasurementEntry,
  PersonalBest,
  Profile,
  Routine,
  ScheduledWorkout,
  Settings,
  Task,
  UserData,
  WeightEntry,
  WorkoutSession,
} from "./types";
import { shiftISO, todayISO, weekdayOf } from "./dates";
import { uid } from "./utils";

const MAX_ACTIVITY = 40;

export function logActivity(d: UserData, type: ActivityType, message: string): UserData {
  const item = { id: uid("act"), type, message, at: new Date().toISOString() };
  return { ...d, activity: [item, ...d.activity].slice(0, MAX_ACTIVITY) };
}

/* -------------------------------- tasks ------------------------------- */

export type TaskInput = Omit<Task, "id" | "completed" | "completedAt" | "createdAt">;

export function addTask(d: UserData, input: TaskInput): UserData {
  const task: Task = { ...input, id: uid("task"), completed: false, createdAt: new Date().toISOString() };
  return { ...d, tasks: [task, ...d.tasks] };
}

export function updateTask(d: UserData, id: string, input: TaskInput): UserData {
  return { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...input } : t)) };
}

export function deleteTask(d: UserData, id: string): UserData {
  return { ...d, tasks: d.tasks.filter((t) => t.id !== id) };
}

export function setTaskCompleted(d: UserData, id: string, completed: boolean): UserData {
  const task = d.tasks.find((t) => t.id === id);
  if (!task || task.completed === completed) return d;
  const next = {
    ...d,
    tasks: d.tasks.map((t) =>
      t.id === id ? { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined } : t,
    ),
  };
  return completed ? logActivity(next, "task", `Completed “${task.title}”`) : next;
}

export function clearCompletedTasks(d: UserData): UserData {
  return { ...d, tasks: d.tasks.filter((t) => !t.completed) };
}

/* -------------------------------- habits ------------------------------ */

export function toggleHabit(d: UserData, date: string, habitId: string): UserData {
  const current = d.habitLog[date] ?? [];
  const next = current.includes(habitId) ? current.filter((id) => id !== habitId) : [...current, habitId];
  return { ...d, habitLog: { ...d.habitLog, [date]: next } };
}

export function addHabit(d: UserData, habit: Omit<Habit, "id">): UserData {
  return { ...d, habits: [...d.habits, { ...habit, id: uid("hb") }] };
}

export function removeHabit(d: UserData, id: string): UserData {
  return { ...d, habits: d.habits.filter((h) => h.id !== id) };
}

/* -------------------------------- water ------------------------------- */

export function addWater(d: UserData, date: string, ml: number): UserData {
  const value = Math.max(0, Math.min(10000, (d.water[date] ?? 0) + ml));
  const next = { ...d, water: { ...d.water, [date]: value } };
  return ml > 0 ? logActivity(next, "water", `Added ${ml} ml of water`) : next;
}

/* -------------------------------- meals ------------------------------- */

export type MealInput = Omit<Meal, "id" | "completed"> & { completed?: boolean };

export function addMeal(d: UserData, input: MealInput): UserData {
  const meal: Meal = { ...input, completed: input.completed ?? false, id: uid("meal") };
  return logActivity({ ...d, meals: [...d.meals, meal] }, "meal", `Planned ${meal.type}: ${meal.name}`);
}

export function updateMeal(d: UserData, id: string, input: Partial<MealInput>): UserData {
  return { ...d, meals: d.meals.map((m) => (m.id === id ? { ...m, ...input } : m)) };
}

export function deleteMeal(d: UserData, id: string): UserData {
  return { ...d, meals: d.meals.filter((m) => m.id !== id) };
}

export function setMealCompleted(d: UserData, id: string, completed: boolean): UserData {
  const meal = d.meals.find((m) => m.id === id);
  if (!meal) return d;
  const next = updateMeal(d, id, { completed });
  return completed ? logActivity(next, "meal", `Logged ${meal.type}: ${meal.name}`) : next;
}

/** Copy every meal from one day to another (unchecked). */
export function copyMealsToDay(d: UserData, from: string, to: string): UserData {
  const copies = d.meals
    .filter((m) => m.date === from)
    .map((m) => ({ ...m, id: uid("meal"), date: to, completed: false }));
  return { ...d, meals: [...d.meals, ...copies] };
}

/* ------------------------------- routines ----------------------------- */

export function saveRoutine(d: UserData, routine: Omit<Routine, "id" | "createdAt"> & { id?: string }): UserData {
  if (routine.id && d.routines.some((r) => r.id === routine.id)) {
    return { ...d, routines: d.routines.map((r) => (r.id === routine.id ? { ...r, ...routine, id: r.id } : r)) };
  }
  const created: Routine = { ...routine, id: uid("rt"), createdAt: new Date().toISOString() };
  return { ...d, routines: [...d.routines, created] };
}

export function deleteRoutine(d: UserData, id: string): UserData {
  return {
    ...d,
    routines: d.routines.filter((r) => r.id !== id),
    // Future planned sessions for a deleted routine no longer make sense; history stays.
    schedule: d.schedule.filter((s) => !(s.routineId === id && s.status === "planned")),
  };
}

export function scheduleWorkout(d: UserData, input: Omit<ScheduledWorkout, "id" | "status">): UserData {
  return { ...d, schedule: [...d.schedule, { ...input, id: uid("sch"), status: "planned" }] };
}

export function updateScheduled(d: UserData, id: string, patch: Partial<ScheduledWorkout>): UserData {
  return { ...d, schedule: d.schedule.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

export function removeScheduled(d: UserData, id: string): UserData {
  return { ...d, schedule: d.schedule.filter((s) => s.id !== id) };
}

export function recordSession(d: UserData, session: Omit<WorkoutSession, "id">): UserData {
  const id = uid("ses");
  let next: UserData = { ...d, sessions: [...d.sessions, { ...session, id }] };
  if (session.scheduledId) next = updateScheduled(next, session.scheduledId, { status: "completed", sessionId: id });
  return logActivity(next, "workout", `Finished ${session.routineName}`);
}

export function deleteSession(d: UserData, id: string): UserData {
  return {
    ...d,
    sessions: d.sessions.filter((s) => s.id !== id),
    schedule: d.schedule.map((s) => (s.sessionId === id ? { ...s, status: "planned", sessionId: undefined } : s)),
  };
}

/* ------------------------------- progress ----------------------------- */

export function saveWeight(d: UserData, entry: Omit<WeightEntry, "id"> & { id?: string }): UserData {
  if (entry.id) return { ...d, weights: d.weights.map((w) => (w.id === entry.id ? { ...w, ...entry, id: w.id } : w)) };
  return logActivity({ ...d, weights: [...d.weights, { ...entry, id: uid("w") }] }, "weight", `Logged weight: ${entry.weightKg} kg`);
}

export function deleteWeight(d: UserData, id: string): UserData {
  return { ...d, weights: d.weights.filter((w) => w.id !== id) };
}

export function saveMeasurement(d: UserData, entry: Omit<MeasurementEntry, "id"> & { id?: string }): UserData {
  if (entry.id) return { ...d, measurements: d.measurements.map((m) => (m.id === entry.id ? { ...entry, id: m.id } : m)) };
  return { ...d, measurements: [...d.measurements, { ...entry, id: uid("ms") }] };
}

export function deleteMeasurement(d: UserData, id: string): UserData {
  return { ...d, measurements: d.measurements.filter((m) => m.id !== id) };
}

export function savePersonalBest(d: UserData, pb: Omit<PersonalBest, "id"> & { id?: string }): UserData {
  if (pb.id) return { ...d, personalBests: d.personalBests.map((p) => (p.id === pb.id ? { ...pb, id: p.id } : p)) };
  return logActivity({ ...d, personalBests: [...d.personalBests, { ...pb, id: uid("pb") }] }, "goal", `New personal best: ${pb.exercise}`);
}

export function deletePersonalBest(d: UserData, id: string): UserData {
  return { ...d, personalBests: d.personalBests.filter((p) => p.id !== id) };
}

export function saveGoal(d: UserData, goal: Omit<Goal, "id" | "createdAt"> & { id?: string }): UserData {
  if (goal.id) return { ...d, goals: d.goals.map((g) => (g.id === goal.id ? { ...g, ...goal, id: g.id } : g)) };
  return logActivity(
    { ...d, goals: [...d.goals, { ...goal, id: uid("goal"), createdAt: new Date().toISOString() }] },
    "goal",
    `Set a new goal: ${goal.title}`,
  );
}

export function deleteGoal(d: UserData, id: string): UserData {
  return { ...d, goals: d.goals.filter((g) => g.id !== id) };
}

/* --------------------------- profile/settings ------------------------- */

export function updateProfile(d: UserData, patch: Partial<Profile>): UserData {
  return { ...d, profile: { ...d.profile, ...patch } };
}

export function updateSettings(d: UserData, patch: Partial<Settings>): UserData {
  return { ...d, settings: { ...d.settings, ...patch } };
}

/* ------------------------------ onboarding ---------------------------- */

/**
 * Save onboarding answers and build a simple starter schedule for the next
 * two weeks from the user's chosen days and location. Nothing here is a
 * medical assessment — it's a convenience the user can edit freely.
 */
export function completeOnboarding(d: UserData, answers: Partial<Profile>): UserData {
  let next = updateProfile(d, { ...answers, onboarded: true });
  const { location, workoutDays, goal } = next.profile;
  const today = todayISO();

  const pool = next.routines.filter((r) => r.location === location || location === "gym");
  const preferred =
    goal === "strength" || goal === "muscle"
      ? pool.filter((r) => r.focus === "strength" || r.focus === "full-body")
      : goal === "weight"
        ? pool.filter((r) => r.focus === "cardio" || r.focus === "full-body")
        : pool;
  const rotation = (preferred.length ? preferred : pool.length ? pool : next.routines).map((r) => r.id);

  const hasFuturePlan = next.schedule.some((s) => s.date >= today && s.status === "planned");
  if (!hasFuturePlan && rotation.length && workoutDays.length) {
    let i = 0;
    for (let offset = 0; offset < 14; offset++) {
      const date = shiftISO(today, offset);
      if (!workoutDays.includes(weekdayOf(date))) continue;
      next = scheduleWorkout(next, { routineId: rotation[i % rotation.length]!, date, time: "18:00" });
      i++;
    }
  }

  if (next.goals.length === 0) {
    next = saveGoal(next, { title: `Train ${workoutDays.length || 3}× per week`, metric: "weekly-workouts", target: workoutDays.length || 3, current: 0, unit: "sessions" });
    next = saveGoal(next, { title: "Hit daily water goal", metric: "daily-water", target: next.settings.waterGoalMl, current: 0, unit: "ml" });
    if (answers.targetWeightKg) {
      next = saveGoal(next, { title: "Reach target weight", metric: "target-weight", target: answers.targetWeightKg, current: 0, unit: "kg" });
    }
  }
  if (answers.startingWeightKg && next.weights.length === 0) {
    next = saveWeight(next, { date: today, weightKg: answers.startingWeightKg });
  }
  return logActivity(next, "system", "Completed onboarding — starter plan created");
}
