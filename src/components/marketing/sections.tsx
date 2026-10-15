import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  Dumbbell,
  LineChart,
  ListChecks,
  Salad,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress";
import { mealTotals } from "@/lib/calculations";
import { MEAL_LIBRARY } from "@/lib/data/templates";
import { MACRO_COLORS } from "@/lib/constants";
import type { Meal } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-text">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
    </div>
  );
}

export function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-20 sm:py-28", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

/* --------------------------------- Hero -------------------------------- */

export function Hero() {
  return (
    <section className="relative isolate -mt-16 overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-squat.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] opacity-50 lg:left-[30%] lg:w-[70%] lg:opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
        <div className="animate-fade-in">
          <p className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Workouts · Nutrition · Habits · Progress
          </p>
          <h1 className="mt-6 font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight sm:text-6xl lg:text-7xl">
            Your Fitness Journey.
            <br />
            Your Plan.
            <br />
            <span className="text-primary">Your Progress.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Plan your workouts, build better habits, track your nutrition, and make every day count.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Start Your Journey <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-background/40 backdrop-blur">
              <Link href="/features">Explore Features</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-subtle">
            No credit card, no backend — or{" "}
            <Link href="/sign-in?demo=1" className="font-medium text-foreground underline underline-offset-4 hover:text-accent-text">
              explore the demo account
            </Link>
            .
          </p>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}

function DashboardPreview() {
  const bars = [35, 0, 50, 0, 45, 25, 0];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end" aria-label="Product preview with sample data">
      <div className="rounded-3xl border border-border-strong bg-surface/90 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-subtle">Good evening</p>
            <p className="font-semibold">Today&apos;s plan</p>
          </div>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">Preview · sample data</span>
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
          <ProgressRing value={60} size={76} stroke={8} label="Daily tasks complete">
            <span className="text-lg font-bold">3/5</span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-xs text-subtle">Daily checklist</p>
            <ul className="mt-1.5 space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent-text" aria-hidden /> Morning mobility
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-accent-text" aria-hidden /> Protein at breakfast
              </li>
              <li className="flex items-center gap-2 text-muted">
                <span className="size-4 rounded border-2 border-border-strong" aria-hidden /> Drink 2.5 L water
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Upper Body Strength</p>
            <p className="text-xs text-muted">6 exercises · ~45 min · 18:30</p>
          </div>
          <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-accent-text">Start</span>
        </div>

        <div className="mt-3 rounded-2xl border border-border p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">Active minutes</p>
            <p className="text-xs text-subtle">This week</p>
          </div>
          <div className="mt-3 flex h-20 items-end gap-2" aria-hidden>
            {bars.map((b, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-[var(--chart-1)]" style={{ height: `${Math.max(b, 4) * 1.3}px`, opacity: b ? 1 : 0.25 }} />
                <span className="text-[10px] text-subtle">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Features ------------------------------ */

export const FEATURES = [
  { icon: CalendarDays, title: "Smart workout planning", text: "Schedule sessions across a weekly calendar and see planned versus completed at a glance." },
  { icon: ListChecks, title: "Daily fitness tasks", text: "A focused to-do list for workouts, meals, hydration, sleep and recovery." },
  { icon: Dumbbell, title: "Personalised routines", text: "Start from editable gym or home routines, then build your own from the exercise library." },
  { icon: Salad, title: "Meal planning & nutrition", text: "Plan breakfast to snacks, with approximate calories and macros totalled for you." },
  { icon: LineChart, title: "Progress tracking", text: "Log weight, measurements and personal bests, and watch the trend lines over time." },
  { icon: Target, title: "Goals & habit building", text: "Set realistic goals, build daily habits and celebrate streaks of consistency." },
  { icon: BadgeCheck, title: "Gym membership management", text: "Members, plans, payment records and expiry dates — organised for gym staff." },
  { icon: CalendarCheck, title: "Attendance tracking", text: "Check members in and out and spot busy days with simple attendance charts." },
];

export function FeatureGrid() {
  return (
    <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map(({ icon: Icon, title, text }) => (
        <li key={title} className="group bg-background p-6 transition-colors hover:bg-surface sm:p-7">
          <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-accent-text transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
          <h3 className="mt-5 font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------- How it works ---------------------------- */

const STEPS = [
  { title: "Create your demo profile", text: "Sign up in seconds — everything is stored privately in your own browser." },
  { title: "Choose your fitness goals", text: "Tell us your goal, experience, schedule, equipment and food preferences." },
  { title: "Follow your plan", text: "Get a starter weekly schedule, then track workouts, meals and habits day by day." },
];

export function HowItWorks() {
  return (
    <ol className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
      {STEPS.map((s, i) => (
        <li key={s.title} className="relative border-t-2 border-border-strong pt-6">
          <span className="absolute -top-0.5 left-0 h-0.5 w-16 bg-primary" aria-hidden />
          <span className="font-display text-6xl font-extrabold leading-none text-surface-3">0{i + 1}</span>
          <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

/* --------------------------- Workout showcase -------------------------- */

export const WORKOUT_TYPES = [
  { title: "Strength training", image: "/images/strength.jpg", alt: "Athlete gripping a loaded barbell before a deadlift", meta: "45–60 min · Gym", text: "Squat, hinge, push and pull with progressive structure." },
  { title: "Cardio conditioning", image: "/images/cardio.jpg", alt: "Athlete training with battle ropes outdoors", meta: "20–40 min · Gym or outdoors", text: "Build your engine with steady work and short intervals." },
  { title: "Mobility & recovery", image: "/images/mobility.jpg", alt: "Group performing a kneeling mobility exercise on mats", meta: "15–25 min · Anywhere", text: "Move better and recover between harder sessions." },
  { title: "Full-body workouts", image: "/images/full-body.jpg", alt: "Athlete performing a barbell curl in a gym", meta: "40–50 min · Gym", text: "Train every major muscle group in one efficient session." },
  { title: "Home workouts", image: "/images/home.jpg", alt: "Person doing a crunch on an exercise mat at home", meta: "20–40 min · Home", text: "Bodyweight and dumbbell sessions that fit your living room." },
];

export function WorkoutShowcase() {
  return (
    <ul className="mt-12 grid snap-x snap-mandatory auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-4 sm:auto-cols-[45%] lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible">
      {WORKOUT_TYPES.map((w) => (
        <li key={w.title} className="group relative snap-start overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="relative aspect-[4/5]">
            <Image src={w.image} alt={w.alt} fill sizes="(min-width: 1024px) 20vw, 78vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-xs text-white/70">{w.meta}</p>
              <h3 className="mt-1 font-display text-2xl font-bold uppercase leading-none">{w.title}</h3>
              <p className="mt-2 text-sm text-white/80">{w.text}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------- Nutrition preview ------------------------- */

const SAMPLE_DAY = ["ml-greek-yogurt", "ml-chickpea-bowl", "ml-salmon", "ml-apple-pb"];

export function sampleDayMeals(): Meal[] {
  return SAMPLE_DAY.map((id) => {
    const t = MEAL_LIBRARY.find((m) => m.id === id)!;
    return { ...t, date: "sample", completed: false };
  });
}

export function NutritionPreview() {
  const meals = sampleDayMeals();
  const totals = mealTotals(meals);
  const images = ["/images/meal-egg-salad.jpg", "/images/meal-veg-bowl.jpg", "/images/meal-tofu-bowl.jpg"];
  const macros = [
    { key: "protein", label: "Protein", grams: totals.protein, kcal: totals.protein * 4 },
    { key: "carbs", label: "Carbs", grams: totals.carbs, kcal: totals.carbs * 4 },
    { key: "fat", label: "Fat", grams: totals.fat, kcal: totals.fat * 9 },
  ] as const;
  const macroKcal = macros.reduce((a, m) => a + m.kcal, 0);

  return (
    <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
      <div className="grid grid-cols-3 gap-3">
        {images.map((src, i) => (
          <div key={src} className={cn("relative overflow-hidden rounded-2xl border border-border", i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square")}>
            <Image src={src} alt={["A bowl of greens, eggs and vegetables", "A colourful vegetable and chickpea bowl", "A tofu and vegetable bowl"][i]!} fill sizes="(min-width: 1024px) 30vw, 60vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Sample day — summary</h3>
          <span className="text-xs text-subtle">Approximate values</span>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {meals.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs capitalize text-subtle">{m.type}</p>
                <p className="truncate font-medium">{m.name}</p>
              </div>
              <span className="shrink-0 tabular-nums text-muted">{m.calories} kcal</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm text-muted">Total</span>
          <span className="font-display text-3xl font-bold tabular-nums">
            {totals.calories.toLocaleString()} <span className="text-base font-semibold text-muted">kcal</span>
          </span>
        </div>
        <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {macros.map((m) => (
            <div key={m.key} style={{ width: `${(m.kcal / macroKcal) * 100}%`, background: MACRO_COLORS[m.key] }} />
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {macros.map((m) => (
            <div key={m.key}>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <span className="size-2 rounded-sm" style={{ background: MACRO_COLORS[m.key] }} aria-hidden />
                {m.label}
              </dt>
              <dd className="font-semibold tabular-nums">{m.grams} g</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs leading-relaxed text-subtle">
          Totals are calculated from the meals above. Sample plans are general educational examples, not medical or dietetic advice.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------- FAQ -------------------------------- */

export const FAQS = [
  { q: "Is this a real service?", a: "Not yet. This is a frontend-only demo of FITFLOW. Accounts, workouts, meals and progress are saved in your browser’s localStorage — nothing is sent to a server." },
  { q: "Is my demo account secure?", a: "No — demo accounts are not secure authentication. Passwords are hashed before being stored locally, but anyone with access to this browser could read or change the data. Don’t use a real password." },
  { q: "Do I need gym equipment?", a: "No. You can choose home or gym training during onboarding. The library includes bodyweight, dumbbell and gym-based exercises, and every routine can be edited." },
  { q: "How are calories and macros calculated?", a: "Each meal has approximate nutrition values, and daily totals are added up from the meals you plan or log. Values are estimates for general guidance only." },
  { q: "Will this tell me what I should eat?", a: "FITFLOW offers sample meals and lets you set your own targets. It doesn’t give medical or dietetic advice — please talk to a qualified professional for personalised guidance." },
  { q: "How does progress tracking work?", a: "Log your weight, optional body measurements and personal bests. Charts and goal progress are calculated from what you log and the workouts you complete." },
  { q: "What about the gym management area?", a: "It’s a demo for gym staff: members, plans, attendance, trainers and classes with sample records. Payments, QR check-ins and messages are simulated — nothing real is charged or sent." },
  { q: "Can I reset or export my data?", a: "Yes. In Settings you can export your demo data as JSON or reset everything back to its starting state." },
];

export function Faq({ items = FAQS }: { items?: typeof FAQS }) {
  return (
    <div className="mt-12 divide-y divide-border rounded-3xl border border-border bg-surface">
      {items.map((f) => (
        <details key={f.q} className="group px-5 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="-mt-1 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ------------------------------- Final CTA ----------------------------- */

export function FinalCta({ title = "Ready to make every day count?", text = "Create a free demo profile and get your starter plan in under two minutes." }: { title?: string; text?: string }) {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-16">
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-5xl">{title}</h2>
          <p className="mt-4 text-base text-primary-foreground/80 sm:text-lg">{text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link href="/sign-up">
                Start Your Journey <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/sign-in?demo=1">Explore the demo</Link>
            </Button>
          </div>
        </div>
        <svg className="absolute -right-10 bottom-0 hidden h-full w-1/2 text-primary-foreground/10 md:block" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
          <path d="M0 80c25 0 25-50 50-50s25 50 50 50 25-50 50-50 25 50 50 50" fill="none" stroke="currentColor" strokeWidth="14" />
        </svg>
      </div>
    </section>
  );
}

export const GYM_FEATURES = [
  { icon: Users, title: "Member directory", text: "Search, filter and sort members with status and expiry at a glance." },
  { icon: ClipboardList, title: "Plans & payments", text: "Membership plans plus demo payment records — clearly simulated." },
  { icon: Clock, title: "Check-in / check-out", text: "Front-desk attendance with live “in the gym now” counts." },
  { icon: CalendarDays, title: "Classes & trainers", text: "Weekly timetable, trainer schedules and demo class bookings." },
];
