import {
  Apple,
  Bed,
  Droplets,
  Dumbbell,
  HeartPulse,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import type {
  DietPreference,
  DietTag,
  Difficulty,
  Equipment,
  ExerciseCategory,
  Experience,
  FitnessGoal,
  MealType,
  MemberStatus,
  MuscleGroup,
  PaymentStatus,
  Priority,
  RoutineFocus,
  TaskCategory,
} from "./types";

export const TASK_CATEGORIES: Record<TaskCategory, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  workout: { label: "Workout", icon: Dumbbell, tone: "primary" },
  nutrition: { label: "Nutrition", icon: Apple, tone: "warning" },
  hydration: { label: "Hydration", icon: Droplets, tone: "info" },
  sleep: { label: "Sleep", icon: Bed, tone: "violet" },
  recovery: { label: "Recovery", icon: HeartPulse, tone: "danger" },
  general: { label: "General", icon: ListChecks, tone: "neutral" },
};

export const PRIORITIES: Record<Priority, { label: string; tone: BadgeTone }> = {
  high: { label: "High", tone: "danger" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "neutral" },
};

export const GOALS: Record<FitnessGoal, { label: string; description: string }> = {
  general: { label: "General fitness", description: "Feel better, move more and build a routine you enjoy." },
  strength: { label: "Strength", description: "Get stronger on fundamental lifts and movements." },
  muscle: { label: "Muscle building", description: "Train progressively to build muscle over time." },
  weight: { label: "Weight management", description: "Support a sustainable change with activity and habits." },
};

export const EXPERIENCE: Record<Experience, { label: string; description: string }> = {
  beginner: { label: "Beginner", description: "New to training or returning after a long break." },
  intermediate: { label: "Intermediate", description: "Training consistently for 6+ months." },
  advanced: { label: "Advanced", description: "Several years of structured training." },
};

export const DIET_PREFERENCES: Record<DietPreference, string> = {
  none: "No preference",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  "dairy-free": "Dairy-free",
  "gluten-free": "Gluten-free",
};

export const DIET_TAGS: Record<DietTag, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  "high-protein": "High protein",
  "dairy-free": "Dairy-free",
  "gluten-free": "Gluten-free",
};

export const MEAL_TYPES: Record<MealType, { label: string; time: string }> = {
  breakfast: { label: "Breakfast", time: "Morning" },
  lunch: { label: "Lunch", time: "Midday" },
  dinner: { label: "Dinner", time: "Evening" },
  snack: { label: "Snacks", time: "Anytime" },
};

export const EQUIPMENT: Record<Equipment, string> = {
  none: "Bodyweight",
  dumbbells: "Dumbbells",
  barbell: "Barbell",
  kettlebell: "Kettlebell",
  "resistance-band": "Resistance band",
  "pull-up-bar": "Pull-up bar",
  bench: "Bench / box",
  machine: "Machines",
  cable: "Cable machine",
  "cardio-machine": "Cardio machine",
};

export const MUSCLES: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  core: "Core",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

export const EXERCISE_CATEGORIES: Record<ExerciseCategory, string> = {
  strength: "Strength",
  cardio: "Cardio",
  mobility: "Mobility",
  core: "Core",
};

export const DIFFICULTY: Record<Difficulty, { label: string; tone: BadgeTone }> = {
  beginner: { label: "Beginner", tone: "primary" },
  intermediate: { label: "Intermediate", tone: "warning" },
  advanced: { label: "Advanced", tone: "danger" },
};

export const FOCUS: Record<RoutineFocus, { label: string; image: string }> = {
  strength: { label: "Strength", image: "/images/strength.jpg" },
  cardio: { label: "Cardio", image: "/images/cardio.jpg" },
  mobility: { label: "Mobility", image: "/images/mobility.jpg" },
  "full-body": { label: "Full body", image: "/images/full-body.jpg" },
};

export const MEMBER_STATUS: Record<MemberStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "success" },
  expiring: { label: "Expiring soon", tone: "warning" },
  expired: { label: "Expired", tone: "danger" },
  frozen: { label: "Frozen", tone: "info" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: "Paid", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
};

/** Categorical chart colours (validated for both themes against surface). */
export const CHART = {
  /** Categorical order — validated per theme (lightness band, CVD, contrast). */
  s1: "var(--chart-1)",
  s2: "var(--chart-2)",
  s3: "var(--chart-3)",
  muted: "var(--surface-3)",
  grid: "var(--chart-grid)",
  axis: "var(--subtle)",
};

export const MACRO_COLORS = { protein: "var(--chart-1)", carbs: "var(--chart-2)", fat: "var(--chart-3)" } as const;
