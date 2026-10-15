import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageIntro } from "@/components/marketing/page-intro";
import { FinalCta, GYM_FEATURES, Section } from "@/components/marketing/sections";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Features" };

const BLOCKS = [
  {
    eyebrow: "Workout planning",
    title: "A weekly plan you can actually follow",
    text: "Schedule routines on a daily or weekly calendar, then run them in a focused workout mode — one exercise at a time with set tracking and a rest timer.",
    points: ["Daily and weekly calendar views", "Gym and home routines you can edit", "Active workout mode with rest timer", "Planned vs. completed sessions"],
    image: "/images/strength.jpg",
    alt: "Athlete gripping a barbell",
  },
  {
    eyebrow: "Daily tasks & habits",
    title: "Small wins, every single day",
    text: "Turn intentions into a checklist. Add tasks by category and priority, and keep simple recurring habits that build momentum.",
    points: ["Workout, nutrition, hydration, sleep and recovery categories", "Due dates, times and priorities", "Daily habit checklist with streaks", "Clear feedback on every action"],
    image: "/images/stairs.jpg",
    alt: "Runner climbing concrete steps",
  },
  {
    eyebrow: "Nutrition",
    title: "Plan meals without the spreadsheet",
    text: "Build each day from breakfast to snacks. Calories and macros are totalled from your meals, and hydration sits right alongside.",
    points: ["Breakfast, lunch, dinner and snacks", "Approximate calories, protein, carbs and fat", "Vegetarian, vegan and other filters", "Daily and weekly views"],
    image: "/images/meal-veg-bowl.jpg",
    alt: "Colourful vegetable and chickpea bowl",
  },
  {
    eyebrow: "Progress & goals",
    title: "Progress you can see — honestly",
    text: "Log weight, measurements and personal bests. Charts and goal progress come straight from your own records, never from promises.",
    points: ["Weight log and optional measurements", "Weekly consistency and workout history", "Personal bests and achievements", "Goal progress indicators"],
    image: "/images/dumbbells.jpg",
    alt: "Lifter taking dumbbells from a rack",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Features"
        title="Built for the whole fitness journey"
        description="From the first workout to the hundredth, FITFLOW keeps your training, food, habits and progress in one calm, focused place."
        image="/images/dumbbell-rack.jpg"
      >
        <Button asChild size="lg">
          <Link href="/sign-up">
            Start Your Journey <ArrowRight />
          </Link>
        </Button>
      </PageIntro>

      <Section>
        <div className="space-y-24">
          {BLOCKS.map((b, i) => (
            <article key={b.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-3xl border border-border", i % 2 === 1 && "lg:order-2")}>
                <Image src={b.image} alt={b.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-text">{b.eyebrow}</p>
                <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] sm:text-5xl">{b.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{b.text}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {b.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section className="border-y border-border bg-surface/40">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-text">For gyms</p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] sm:text-5xl">Gym management, kept separate</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              A dedicated area for gym staff with members, plans, attendance, trainers and classes — tucked away so personal users aren’t overwhelmed. Switch between
              Member, Trainer and Admin views in the demo.
            </p>
            <p className="mt-4 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm">
              Payments, QR check-ins and messaging are simulated in this demo. Nothing is charged or sent.
            </p>
          </div>
          <div className="relative">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border">
              <Image src="/images/gym-floor.jpg" alt="A bright, well-equipped gym floor" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {GYM_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
                  <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <div className="pt-20 sm:pt-28">
        <FinalCta />
      </div>
    </>
  );
}
