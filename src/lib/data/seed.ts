import type {
  ActivityItem,
  Meal,
  MealTemplate,
  Profile,
  ScheduledWorkout,
  Settings,
  Task,
  UserData,
  WeightEntry,
  WorkoutSession,
} from "@/lib/types";
import { shiftISO, weekdayOf } from "@/lib/dates";
import { DEFAULT_HABITS, MEAL_LIBRARY, ROUTINE_TEMPLATES } from "./templates";

export const DATA_VERSION = 1;

/** Small deterministic PRNG so seeded demo data is stable between resets. */
export function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  units: "kg",
  theme: "dark",
  notifications: { workoutReminders: true, mealReminders: false, hydrationReminders: true, weeklySummary: true },
  waterGoalMl: 2500,
  calorieTarget: 2200,
  proteinTarget: 130,
  carbsTarget: 240,
  fatTarget: 70,
  demoRole: "member",
};

export function defaultProfile(name: string, email: string): Profile {
  return {
    name,
    email,
    goal: "general",
    experience: "beginner",
    location: "home",
    workoutDays: [1, 3, 5],
    sessionMinutes: 30,
    equipment: ["none"],
    diet: "none",
    allergies: [],
    onboarded: false,
  };
}

/** A brand-new account: real empty states, starter routines and habits only. */
export function emptyUserData(name: string, email: string): UserData {
  return {
    version: DATA_VERSION,
    profile: defaultProfile(name, email),
    settings: { ...DEFAULT_SETTINGS },
    tasks: [],
    habits: DEFAULT_HABITS.map((h) => ({ ...h })),
    habitLog: {},
    routines: ROUTINE_TEMPLATES.map((r) => ({ ...r, exercises: r.exercises.map((e) => ({ ...e })) })),
    schedule: [],
    sessions: [],
    meals: [],
    water: {},
    weights: [],
    measurements: [],
    personalBests: [],
    goals: [],
    activity: [],
  };
}

function mealFrom(t: MealTemplate, date: string, completed: boolean, idx: number): Meal {
  const { id: templateId, ...rest } = t;
  return { ...rest, id: `meal_${date}_${templateId}_${idx}`, date, completed };
}

const lib = (id: string) => MEAL_LIBRARY.find((m) => m.id === id)!;

/** The "Explore Demo" account: several weeks of plausible, clearly-fictional history. */
export function demoUserData(today: string, name: string, email: string): UserData {
  const rand = seededRandom(42);
  const base = emptyUserData(name, email);
  const at = (date: string, time = "08:00") => new Date(`${date}T${time}:00`).toISOString();

  const profile: Profile = {
    ...base.profile,
    goal: "strength",
    experience: "intermediate",
    location: "gym",
    workoutDays: [1, 3, 5, 6],
    sessionMinutes: 50,
    equipment: ["dumbbells", "barbell", "bench", "machine", "cable"],
    heightCm: 178,
    startingWeightKg: 80.5,
    targetWeightKg: 77.5,
    personalGoal: "Train four times a week and feel stronger on squats.",
    onboarded: true,
  };

  // Weekly plan: Mon upper, Wed lower, Fri full body, Sat mobility; 4 weeks back + 2 ahead.
  const plan: Record<number, string> = {
    1: "rt-gym-upper",
    3: "rt-gym-lower",
    5: "rt-full-body-home",
    6: "rt-mobility-reset",
  };
  const schedule: ScheduledWorkout[] = [];
  const sessions: WorkoutSession[] = [];
  for (let offset = -27; offset <= 13; offset++) {
    const date = shiftISO(today, offset);
    const routineId = plan[weekdayOf(date)];
    if (!routineId) continue;
    const routine = base.routines.find((r) => r.id === routineId)!;
    const id = `sch_${date}`;
    if (offset < 0) {
      const skipped = rand() < 0.15;
      if (skipped) {
        schedule.push({ id, routineId, date, time: "18:30", status: "skipped" });
        continue;
      }
      const sessionId = `ses_${date}`;
      const duration = Math.round(routine.estimatedMinutes * (0.85 + rand() * 0.3) * 60);
      const start = at(date, "18:30");
      sessions.push({
        id: sessionId,
        routineId,
        routineName: routine.name,
        focus: routine.focus,
        date,
        startedAt: start,
        endedAt: new Date(new Date(start).getTime() + duration * 1000).toISOString(),
        durationSec: duration,
        scheduledId: id,
        exercises: routine.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          setsPlanned: e.sets,
          setsCompleted: rand() < 0.85 ? e.sets : Math.max(1, e.sets - 1),
        })),
      });
      schedule.push({ id, routineId, date, time: "18:30", status: "completed", sessionId });
    } else {
      schedule.push({ id, routineId, date, time: "18:30", status: "planned" });
    }
  }
  // An extra unscheduled cardio session for variety.
  const cardioDate = shiftISO(today, -9);
  sessions.push({
    id: `ses_${cardioDate}_cardio`,
    routineId: "rt-cardio-conditioning",
    routineName: "Cardio Conditioning",
    focus: "cardio",
    date: cardioDate,
    startedAt: at(cardioDate, "07:00"),
    endedAt: at(cardioDate, "07:36"),
    durationSec: 36 * 60,
    exercises: [
      { exerciseId: "ex-stationary-bike", setsPlanned: 1, setsCompleted: 1 },
      { exerciseId: "ex-mountain-climber", setsPlanned: 3, setsCompleted: 3 },
      { exerciseId: "ex-kettlebell-swing", setsPlanned: 3, setsCompleted: 3 },
      { exerciseId: "ex-jumping-jack", setsPlanned: 3, setsCompleted: 2 },
    ],
  });

  const tasks: Task[] = [
    { title: "Pack gym bag for tonight", category: "workout", priority: "medium", d: 0, time: "07:30", done: true },
    { title: "Drink 2.5 L of water", category: "hydration", priority: "high", d: 0, done: false },
    { title: "Prep lunch for tomorrow", category: "nutrition", priority: "medium", d: 0, time: "20:00", done: false, desc: "Chicken, rice & veg bowl × 2" },
    { title: "10-minute evening stretch", category: "recovery", priority: "low", d: 0, time: "21:30", done: false },
    { title: "In bed by 23:00", category: "sleep", priority: "medium", d: 0, time: "23:00", done: false },
    { title: "Log this week's weight", category: "general", priority: "low", d: 2, done: false },
    { title: "Try the mobility reset routine", category: "recovery", priority: "medium", d: 3, done: false },
    { title: "Buy groceries for meal prep", category: "nutrition", priority: "high", d: 1, time: "18:00", done: false, desc: "Oats, Greek yogurt, salmon, broccoli, rice" },
    { title: "Book a class for Saturday", category: "workout", priority: "low", d: -1, done: true },
    { title: "Foam roll legs", category: "recovery", priority: "low", d: -2, done: true },
  ].map((t, i) => {
    const dueDate = shiftISO(today, t.d);
    return {
      id: `task_seed_${i}`,
      title: t.title,
      description: t.desc,
      category: t.category as Task["category"],
      priority: t.priority as Task["priority"],
      dueDate,
      dueTime: t.time,
      completed: t.done,
      completedAt: t.done ? at(dueDate, "09:00") : undefined,
      createdAt: at(shiftISO(dueDate, -1), "12:00"),
    };
  });

  const habitLog: UserData["habitLog"] = {};
  for (let d = -20; d <= 0; d++) {
    const date = shiftISO(today, d);
    const done = base.habits.filter(() => rand() < (d === 0 ? 0.4 : 0.7)).map((h) => h.id);
    if (done.length) habitLog[date] = done;
  }

  // Meals: past 13 days fully planned; today partly eaten.
  const rotation = [
    ["ml-greek-yogurt", "ml-chicken-bowl", "ml-salmon", "ml-apple-pb"],
    ["ml-egg-toast", "ml-tuna-wrap", "ml-turkey-chili", "ml-protein-shake"],
    ["ml-oats", "ml-chickpea-bowl", "ml-beef-potato", "ml-cottage"],
    ["ml-smoothie", "ml-quinoa-salad", "ml-tofu-stirfry", "ml-almonds"],
  ];
  const meals: Meal[] = [];
  for (let d = -13; d <= 1; d++) {
    const date = shiftISO(today, d);
    const day = rotation[(d + 100) % rotation.length]!;
    day.forEach((id, idx) => {
      const completed = d < 0 ? rand() < 0.9 : d === 0 ? idx < 2 : false;
      meals.push(mealFrom(lib(id), date, completed, idx));
    });
  }

  const water: UserData["water"] = {};
  for (let d = -13; d <= 0; d++) {
    water[shiftISO(today, d)] = d === 0 ? 1250 : Math.round((1600 + rand() * 1200) / 250) * 250;
  }

  const weights: WeightEntry[] = [];
  for (let d = -56, i = 0; d <= 0; d += 4, i++) {
    const trend = 80.5 - (i * 2.1) / 14;
    weights.push({
      id: `w_${i}`,
      date: shiftISO(today, d),
      weightKg: Math.round((trend + (rand() - 0.5) * 0.6) * 10) / 10,
    });
  }

  const activity: ActivityItem[] = [
    { id: "act_1", type: "task" as const, message: "Completed “Pack gym bag for tonight”", at: at(today, "07:42") },
    { id: "act_2", type: "meal" as const, message: "Logged lunch: Chicken, rice & veg bowl", at: at(today, "12:55") },
    { id: "act_3", type: "water" as const, message: "Added 500 ml of water", at: at(today, "11:10") },
    ...sessions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map((s, i) => ({ id: `act_s${i}`, type: "workout" as const, message: `Finished ${s.routineName}`, at: s.endedAt })),
    { id: "act_w", type: "weight" as const, message: `Logged weight: ${weights.at(-1)!.weightKg} kg`, at: at(weights.at(-1)!.date, "07:15") },
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    ...base,
    profile,
    tasks,
    habitLog,
    schedule,
    sessions,
    meals,
    water,
    weights,
    measurements: [
      { id: "ms_1", date: shiftISO(today, -56), waistCm: 88, chestCm: 101, hipsCm: 98, armCm: 34, thighCm: 57 },
      { id: "ms_2", date: shiftISO(today, -28), waistCm: 86.5, chestCm: 101.5, hipsCm: 97, armCm: 34.5, thighCm: 57.5 },
      { id: "ms_3", date: shiftISO(today, -2), waistCm: 85, chestCm: 102, hipsCm: 96.5, armCm: 35, thighCm: 58 },
    ],
    personalBests: [
      { id: "pb_1", exercise: "Barbell Back Squat", value: 100, unit: "kg", date: shiftISO(today, -5) },
      { id: "pb_2", exercise: "Dumbbell Bench Press", value: 30, unit: "kg", date: shiftISO(today, -12) },
      { id: "pb_3", exercise: "Push-Up (max reps)", value: 32, unit: "reps", date: shiftISO(today, -19) },
      { id: "pb_4", exercise: "Forearm Plank", value: 95, unit: "sec", date: shiftISO(today, -8) },
    ],
    goals: [
      { id: "g_1", title: "Train 4× per week", metric: "weekly-workouts", target: 4, current: 0, unit: "sessions", createdAt: at(shiftISO(today, -30)) },
      { id: "g_2", title: "Reach target weight", metric: "target-weight", target: 77.5, current: 0, unit: "kg", deadline: shiftISO(today, 60), createdAt: at(shiftISO(today, -56)) },
      { id: "g_3", title: "Hit daily water goal", metric: "daily-water", target: 2500, current: 0, unit: "ml", createdAt: at(shiftISO(today, -30)) },
      { id: "g_4", title: "Hold a 2-minute plank", metric: "custom", target: 120, current: 95, unit: "sec", deadline: shiftISO(today, 45), createdAt: at(shiftISO(today, -30)) },
    ],
    activity,
  };
}
