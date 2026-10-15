import type { Habit, MealTemplate, Routine, RoutineExercise } from "@/lib/types";
import { EXERCISE_MAP } from "./exercises";

function rx(exerciseId: string, overrides: Partial<RoutineExercise> = {}): RoutineExercise {
  const ex = EXERCISE_MAP[exerciseId];
  if (!ex) throw new Error(`Unknown exercise ${exerciseId}`);
  return { exerciseId, sets: ex.sets, reps: ex.reps, restSeconds: ex.restSeconds, ...overrides };
}

const EPOCH = "2026-01-01T00:00:00.000Z";

/** Starter routines every account can use and edit. */
export const ROUTINE_TEMPLATES: Routine[] = [
  {
    id: "rt-full-body-home",
    name: "Full-Body Home Foundations",
    description: "A no-equipment session covering legs, push, hinge and core. Great for building a routine.",
    location: "home",
    focus: "full-body",
    estimatedMinutes: 30,
    createdAt: EPOCH,
    exercises: [
      rx("ex-jumping-jack", { sets: 2 }),
      rx("ex-bodyweight-squat"),
      rx("ex-push-up"),
      rx("ex-glute-bridge"),
      rx("ex-reverse-lunge"),
      rx("ex-plank"),
    ],
  },
  {
    id: "rt-gym-lower",
    name: "Gym Lower Body Strength",
    description: "Squat, hinge and single-leg work to build lower-body strength.",
    location: "gym",
    focus: "strength",
    estimatedMinutes: 50,
    createdAt: EPOCH,
    exercises: [
      rx("ex-back-squat"),
      rx("ex-romanian-deadlift"),
      rx("ex-step-up"),
      rx("ex-calf-raise"),
      rx("ex-side-plank"),
    ],
  },
  {
    id: "rt-gym-upper",
    name: "Gym Upper Body Strength",
    description: "Balanced pushing and pulling for chest, back, shoulders and arms.",
    location: "gym",
    focus: "strength",
    estimatedMinutes: 45,
    createdAt: EPOCH,
    exercises: [
      rx("ex-db-bench-press"),
      rx("ex-lat-pulldown"),
      rx("ex-db-shoulder-press"),
      rx("ex-db-row"),
      rx("ex-bicep-curl"),
      rx("ex-bench-dip"),
    ],
  },
  {
    id: "rt-cardio-conditioning",
    name: "Cardio Conditioning",
    description: "Steady cardio plus short intervals to build your engine.",
    location: "gym",
    focus: "cardio",
    estimatedMinutes: 35,
    createdAt: EPOCH,
    exercises: [rx("ex-stationary-bike"), rx("ex-mountain-climber"), rx("ex-kettlebell-swing"), rx("ex-jumping-jack")],
  },
  {
    id: "rt-mobility-reset",
    name: "Mobility & Recovery Reset",
    description: "A gentle flow for rest days and stiff hips or backs.",
    location: "home",
    focus: "mobility",
    estimatedMinutes: 20,
    createdAt: EPOCH,
    exercises: [
      rx("ex-cat-cow"),
      rx("ex-worlds-greatest-stretch"),
      rx("ex-hip-flexor-stretch"),
      rx("ex-bird-dog"),
      rx("ex-dead-bug"),
    ],
  },
  {
    id: "rt-home-dumbbell",
    name: "Home Dumbbell Builder",
    description: "A full-body session with a pair of dumbbells — ideal for home training.",
    location: "home",
    focus: "full-body",
    estimatedMinutes: 40,
    createdAt: EPOCH,
    exercises: [
      rx("ex-goblet-squat"),
      rx("ex-db-row"),
      rx("ex-db-shoulder-press"),
      rx("ex-romanian-deadlift"),
      rx("ex-band-pull-apart"),
      rx("ex-dead-bug"),
    ],
  },
];

export const DEFAULT_HABITS: Habit[] = [
  { id: "hb-water", title: "Drink water with every meal", category: "hydration" },
  { id: "hb-steps", title: "Take a 10-minute walk", category: "workout" },
  { id: "hb-stretch", title: "Stretch for 5 minutes", category: "recovery" },
  { id: "hb-protein", title: "Include protein at breakfast", category: "nutrition" },
  { id: "hb-sleep", title: "Screens off 30 min before bed", category: "sleep" },
];

/**
 * Sample meal library. Nutrition values are approximate and for general
 * educational purposes only.
 */
export const MEAL_LIBRARY: MealTemplate[] = [
  { id: "ml-oats", name: "Overnight oats with berries", type: "breakfast", serving: "1 jar (300 g)", calories: 380, protein: 16, carbs: 58, fat: 9, tags: ["vegetarian"] },
  { id: "ml-greek-yogurt", name: "Greek yogurt, honey & walnuts", type: "breakfast", serving: "1 bowl (250 g)", calories: 320, protein: 22, carbs: 28, fat: 13, tags: ["vegetarian", "high-protein", "gluten-free"] },
  { id: "ml-egg-toast", name: "Scrambled eggs on wholegrain toast", type: "breakfast", serving: "2 eggs, 2 slices", calories: 410, protein: 24, carbs: 34, fat: 18, tags: ["vegetarian", "high-protein"] },
  { id: "ml-tofu-scramble", name: "Tofu scramble with spinach", type: "breakfast", serving: "1 plate (280 g)", calories: 300, protein: 21, carbs: 14, fat: 17, tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"] },
  { id: "ml-smoothie", name: "Banana peanut smoothie", type: "breakfast", serving: "1 glass (400 ml)", calories: 360, protein: 15, carbs: 48, fat: 12, tags: ["vegetarian"] },

  { id: "ml-chicken-bowl", name: "Chicken, rice & veg bowl", type: "lunch", serving: "1 bowl (420 g)", calories: 560, protein: 42, carbs: 62, fat: 14, tags: ["high-protein", "dairy-free", "gluten-free"] },
  { id: "ml-chickpea-bowl", name: "Chickpea & roasted veg bowl", type: "lunch", serving: "1 bowl (400 g)", calories: 490, protein: 18, carbs: 64, fat: 17, tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"] },
  { id: "ml-tuna-wrap", name: "Tuna & salad wholewheat wrap", type: "lunch", serving: "1 wrap", calories: 430, protein: 32, carbs: 40, fat: 14, tags: ["pescatarian", "high-protein", "dairy-free"] },
  { id: "ml-lentil-soup", name: "Red lentil soup with bread", type: "lunch", serving: "1 bowl + 1 slice", calories: 420, protein: 21, carbs: 63, fat: 8, tags: ["vegan", "vegetarian", "dairy-free"] },
  { id: "ml-quinoa-salad", name: "Quinoa, feta & cucumber salad", type: "lunch", serving: "1 bowl (350 g)", calories: 450, protein: 16, carbs: 46, fat: 21, tags: ["vegetarian", "gluten-free"] },

  { id: "ml-salmon", name: "Baked salmon, potatoes & greens", type: "dinner", serving: "1 plate", calories: 620, protein: 40, carbs: 48, fat: 27, tags: ["pescatarian", "high-protein", "gluten-free", "dairy-free"] },
  { id: "ml-tofu-stirfry", name: "Tofu & vegetable stir-fry with rice", type: "dinner", serving: "1 plate (450 g)", calories: 540, protein: 26, carbs: 68, fat: 17, tags: ["vegan", "vegetarian", "dairy-free"] },
  { id: "ml-turkey-chili", name: "Turkey & bean chili", type: "dinner", serving: "1 bowl (400 g)", calories: 510, protein: 41, carbs: 45, fat: 15, tags: ["high-protein", "dairy-free", "gluten-free"] },
  { id: "ml-veg-pasta", name: "Wholewheat pasta with tomato & lentils", type: "dinner", serving: "1 plate", calories: 580, protein: 25, carbs: 92, fat: 11, tags: ["vegan", "vegetarian", "dairy-free"] },
  { id: "ml-beef-potato", name: "Lean beef, sweet potato & broccoli", type: "dinner", serving: "1 plate", calories: 600, protein: 44, carbs: 52, fat: 21, tags: ["high-protein", "dairy-free", "gluten-free"] },

  { id: "ml-apple-pb", name: "Apple with peanut butter", type: "snack", serving: "1 apple + 1 tbsp", calories: 190, protein: 4, carbs: 25, fat: 8, tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"] },
  { id: "ml-cottage", name: "Cottage cheese & pineapple", type: "snack", serving: "1 cup", calories: 180, protein: 20, carbs: 16, fat: 4, tags: ["vegetarian", "high-protein", "gluten-free"] },
  { id: "ml-hummus", name: "Hummus & carrot sticks", type: "snack", serving: "60 g hummus", calories: 170, protein: 6, carbs: 18, fat: 9, tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"] },
  { id: "ml-almonds", name: "Mixed nuts", type: "snack", serving: "30 g", calories: 175, protein: 6, carbs: 6, fat: 15, tags: ["vegan", "vegetarian", "dairy-free", "gluten-free"] },
  { id: "ml-protein-shake", name: "Protein shake with milk", type: "snack", serving: "1 shaker (350 ml)", calories: 230, protein: 32, carbs: 14, fat: 5, tags: ["vegetarian", "high-protein", "gluten-free"] },
  { id: "ml-edamame", name: "Steamed edamame", type: "snack", serving: "1 cup (155 g)", calories: 190, protein: 17, carbs: 14, fat: 8, tags: ["vegan", "vegetarian", "dairy-free", "gluten-free", "high-protein"] },
];
