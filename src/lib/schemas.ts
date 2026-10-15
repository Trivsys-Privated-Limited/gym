import { z } from "zod";

const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(60, "Name is too long"),
    email,
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((v) => v, "Please accept the demo terms to continue"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don’t match" });
export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotSchema = z.object({ email });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email,
  subject: z.string().trim().min(3, "Please add a subject").max(120, "Keep the subject under 120 characters"),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(2000, "Message is too long (2000 characters max)"),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(100, "Keep titles under 100 characters"),
  description: z.string().max(300, "Keep descriptions under 300 characters").optional(),
  category: z.enum(["workout", "nutrition", "hydration", "sleep", "recovery", "general"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().min(1, "Pick a date"),
  dueTime: z.string().optional(),
});
export type TaskValues = z.infer<typeof taskSchema>;

const nonNeg = (label: string, max: number) =>
  z.coerce.number({ invalid_type_error: `${label} must be a number` }).min(0, `${label} can’t be negative`).max(max, `${label} looks too high`);

export const mealSchema = z.object({
  name: z.string().trim().min(1, "Name the food or meal").max(80),
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  serving: z.string().trim().min(1, "Add a serving size").max(40),
  calories: nonNeg("Calories", 3000),
  protein: nonNeg("Protein", 300),
  carbs: nonNeg("Carbs", 500),
  fat: nonNeg("Fat", 300),
  date: z.string().min(1),
});
export type MealValues = z.infer<typeof mealSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(60),
  email,
  heightCm: z.union([z.literal(""), z.coerce.number().min(100, "Height looks too low").max(250, "Height looks too high")]).optional(),
  bio: z.string().max(200, "Keep your bio under 200 characters").optional(),
  personalGoal: z.string().max(140, "Keep this under 140 characters").optional(),
});
export type ProfileValues = z.infer<typeof profileSchema>;
