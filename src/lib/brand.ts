/** Central brand config — change the product name and contact placeholders here. */
export const BRAND = {
  name: "FITFLOW",
  shortName: "FitFlow",
  tagline: "Your Fitness Journey. Your Plan. Your Progress.",
  description:
    "Plan your workouts, build better habits, track your nutrition, and make every day count.",
  // Placeholder contact details — replace before launch.
  contact: {
    email: "hello@example.com",
    phone: "+00 000 000 0000",
    address: "Your Street 1, Your City (placeholder)",
    hours: "Mon–Fri, 9:00–17:00 (placeholder)",
  },
} as const;

export const DEMO_ACCOUNT = {
  name: "Alex Morgan",
  email: "demo@fitflow.app",
  password: "demo1234",
} as const;
