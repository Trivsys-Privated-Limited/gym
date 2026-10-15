import type { Metadata } from "next";
import { Droplets, Scale, ShieldCheck, Sprout } from "lucide-react";
import { PageIntro } from "@/components/marketing/page-intro";
import { FinalCta, NutritionPreview, Section, SectionHeading } from "@/components/marketing/sections";
import { MealBrowser } from "@/components/marketing/meal-browser";

export const metadata: Metadata = { title: "Nutrition" };

const PRINCIPLES = [
  { icon: Sprout, title: "Food you enjoy", text: "Flexible sample meals for different preferences — vegetarian, vegan, dairy-free and more." },
  { icon: Scale, title: "Approximate, not obsessive", text: "Estimates help you notice patterns. You don’t need to hit numbers perfectly." },
  { icon: Droplets, title: "Hydration included", text: "Track water with one tap alongside your meals and daily tasks." },
  { icon: ShieldCheck, title: "No extremes", text: "No crash targets, no miracle claims. Set your own targets, and adjust anytime." },
];

export default function NutritionPage() {
  return (
    <>
      <PageIntro
        eyebrow="Nutrition"
        title="Simple meal planning that fits training"
        description="Plan your day from breakfast to snacks, check meals off as you eat them, and see approximate calories and macros add up automatically."
        image="/images/meal-egg-salad.jpg"
      />

      <Section>
        <SectionHeading eyebrow="A sample day" title="See the totals add up" />
        <NutritionPreview />
      </Section>

      <Section className="border-y border-border bg-surface/40">
        <SectionHeading eyebrow="Our approach" title="Sustainable by design" />
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon className="size-6 text-accent-text" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Meal library"
          title="Sample meals to get you started"
          description="Add any of these to your plan inside the app, or create your own meals with custom values."
        />
        <MealBrowser />
        <div className="mt-10 rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-muted">
          <strong className="text-foreground">Important:</strong> Sample nutrition plans are general educational examples. They are not medical or dietetic advice and
          aren’t tailored to any health condition, pregnancy or allergy. Please consult a registered dietitian or doctor for personalised guidance.
        </div>
      </Section>

      <FinalCta title="Plan your first day of meals" text="Create a demo profile and start building meals that work for you." />
    </>
  );
}
