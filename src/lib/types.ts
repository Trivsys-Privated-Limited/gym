/**
 * Domain model for FITFLOW. These types are the contract a future backend
 * should satisfy — the UI only talks to them through the store/actions layer.
 */

export type ID = string;
/** Local calendar date, yyyy-MM-dd */
export type ISODate = string;
/** Full ISO timestamp */
export type ISODateTime = string;

/* ----------------------------- Demo auth ----------------------------- */

export interface Account {
  id: ID;
  name: string;
  email: string;
  /** Salted SHA-256 digest. Demo only — this is NOT real security. */
  passwordHash: string;
  salt: string;
  createdAt: ISODateTime;
  isDemo?: boolean;
}

export interface Session {
  userId: ID;
  name: string;
  email: string;
  remember: boolean;
  startedAt: ISODateTime;
}

/* ------------------------------ Profile ------------------------------ */

export type FitnessGoal = "general" | "strength" | "muscle" | "weight";
export type Experience = "beginner" | "intermediate" | "advanced";
export type WorkoutLocation = "gym" | "home";
export type DietPreference = "none" | "vegetarian" | "vegan" | "pescatarian" | "dairy-free" | "gluten-free";
export type Units = "kg" | "lb";
export type ThemePref = "dark" | "light" | "system";
export type DemoRole = "member" | "trainer" | "admin";

export type Equipment =
  | "none"
  | "dumbbells"
  | "barbell"
  | "kettlebell"
  | "resistance-band"
  | "pull-up-bar"
  | "bench"
  | "machine"
  | "cable"
  | "cardio-machine";

export interface Profile {
  name: string;
  email: string;
  goal: FitnessGoal;
  experience: Experience;
  location: WorkoutLocation;
  /** 0 = Sunday … 6 = Saturday */
  workoutDays: number[];
  sessionMinutes: number;
  equipment: Equipment[];
  diet: DietPreference;
  allergies: string[];
  heightCm?: number;
  startingWeightKg?: number;
  targetWeightKg?: number;
  personalGoal?: string;
  bio?: string;
  onboarded: boolean;
}

export interface NotificationPrefs {
  workoutReminders: boolean;
  mealReminders: boolean;
  hydrationReminders: boolean;
  weeklySummary: boolean;
}

export interface Settings {
  units: Units;
  theme: ThemePref;
  notifications: NotificationPrefs;
  waterGoalMl: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  demoRole: DemoRole;
}

/* ------------------------------- Tasks ------------------------------- */

export type TaskCategory = "workout" | "nutrition" | "hydration" | "sleep" | "recovery" | "general";
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: ID;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: Priority;
  dueDate: ISODate;
  dueTime?: string;
  completed: boolean;
  completedAt?: ISODateTime;
  createdAt: ISODateTime;
}

export interface Habit {
  id: ID;
  title: string;
  category: TaskCategory;
}

/* ----------------------------- Workouts ------------------------------ */

export type ExerciseCategory = "strength" | "cardio" | "mobility" | "core";
export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "core"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: ID;
  name: string;
  category: ExerciseCategory;
  muscles: MuscleGroup[];
  equipment: Equipment;
  difficulty: Difficulty;
  sets: number;
  reps: string;
  restSeconds: number;
  locations: WorkoutLocation[];
  summary: string;
  instructions: string[];
  mistakes: string[];
  safety: string[];
}

export type RoutineFocus = "strength" | "cardio" | "mobility" | "full-body";

export interface RoutineExercise {
  exerciseId: ID;
  sets: number;
  reps: string;
  restSeconds: number;
}

export interface Routine {
  id: ID;
  name: string;
  description: string;
  location: WorkoutLocation;
  focus: RoutineFocus;
  estimatedMinutes: number;
  exercises: RoutineExercise[];
  createdAt: ISODateTime;
}

export type ScheduleStatus = "planned" | "completed" | "skipped";

export interface ScheduledWorkout {
  id: ID;
  routineId: ID;
  date: ISODate;
  time?: string;
  status: ScheduleStatus;
  sessionId?: ID;
}

export interface SessionExerciseLog {
  exerciseId: ID;
  setsPlanned: number;
  setsCompleted: number;
}

export interface WorkoutSession {
  id: ID;
  routineId: ID;
  routineName: string;
  focus: RoutineFocus;
  date: ISODate;
  startedAt: ISODateTime;
  endedAt: ISODateTime;
  durationSec: number;
  exercises: SessionExerciseLog[];
  scheduledId?: ID;
  notes?: string;
}

/* ----------------------------- Nutrition ----------------------------- */

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type DietTag = "vegetarian" | "vegan" | "high-protein" | "dairy-free" | "gluten-free" | "pescatarian";

export interface MacroInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealTemplate extends MacroInfo {
  id: ID;
  name: string;
  type: MealType;
  serving: string;
  tags: DietTag[];
}

export interface Meal extends MacroInfo {
  id: ID;
  date: ISODate;
  type: MealType;
  name: string;
  serving: string;
  tags: DietTag[];
  completed: boolean;
}

/* ----------------------------- Progress ------------------------------ */

export interface WeightEntry {
  id: ID;
  date: ISODate;
  weightKg: number;
  note?: string;
}

export interface MeasurementEntry {
  id: ID;
  date: ISODate;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
}

export type PBUnit = "kg" | "reps" | "sec" | "min" | "km";

export interface PersonalBest {
  id: ID;
  exercise: string;
  value: number;
  unit: PBUnit;
  date: ISODate;
}

export type GoalMetric = "weekly-workouts" | "target-weight" | "daily-water" | "custom";

export interface Goal {
  id: ID;
  title: string;
  metric: GoalMetric;
  target: number;
  /** Only used for custom goals; other metrics are derived from logs. */
  current: number;
  unit: string;
  deadline?: ISODate;
  createdAt: ISODateTime;
}

export type ActivityType = "workout" | "task" | "meal" | "water" | "weight" | "goal" | "system";

export interface ActivityItem {
  id: ID;
  type: ActivityType;
  message: string;
  at: ISODateTime;
}

/* ---------------------------- User bucket ---------------------------- */

export interface UserData {
  version: number;
  profile: Profile;
  settings: Settings;
  tasks: Task[];
  habits: Habit[];
  /** date -> completed habit ids */
  habitLog: Record<ISODate, ID[]>;
  routines: Routine[];
  schedule: ScheduledWorkout[];
  sessions: WorkoutSession[];
  meals: Meal[];
  /** date -> millilitres */
  water: Record<ISODate, number>;
  weights: WeightEntry[];
  measurements: MeasurementEntry[];
  personalBests: PersonalBest[];
  goals: Goal[];
  activity: ActivityItem[];
}

/* -------------------------------- Gym -------------------------------- */

export interface MembershipPlan {
  id: ID;
  name: string;
  priceMonthly: number;
  durationMonths: number;
  features: string[];
  highlighted?: boolean;
}

export interface Member {
  id: ID;
  name: string;
  email: string;
  phone: string;
  planId: ID;
  joinDate: ISODate;
  expiryDate: ISODate;
  frozen: boolean;
  trainerId?: ID;
  notes?: string;
}

export type MemberStatus = "active" | "expiring" | "expired" | "frozen";
export type PaymentMethod = "card" | "cash" | "bank-transfer";
export type PaymentStatus = "paid" | "pending" | "failed";

export interface Payment {
  id: ID;
  memberId: ID;
  planId: ID;
  amount: number;
  date: ISODate;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
}

export interface AttendanceRecord {
  id: ID;
  memberId: ID;
  date: ISODate;
  checkIn: ISODateTime;
  checkOut?: ISODateTime;
}

export interface TrainerShift {
  day: number;
  start: string;
  end: string;
}

export interface Trainer {
  id: ID;
  name: string;
  email: string;
  specialties: string[];
  bio: string;
  shifts: TrainerShift[];
}

export interface GymClass {
  id: ID;
  name: string;
  trainerId: ID;
  day: number;
  start: string;
  durationMin: number;
  capacity: number;
  room: string;
  level: Difficulty | "all";
}

export interface ClassBooking {
  id: ID;
  classId: ID;
  memberId: ID;
  date: ISODate;
}

export interface GymData {
  version: number;
  plans: MembershipPlan[];
  members: Member[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  trainers: Trainer[];
  classes: GymClass[];
  bookings: ClassBooking[];
  /** The member record that represents the signed-in demo user in "Member" view. */
  selfMemberId: ID;
}

export interface ContactMessage {
  id: ID;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: ISODateTime;
}
