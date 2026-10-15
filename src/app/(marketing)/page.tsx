import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Faq,
  FeatureGrid,
  FinalCta,
  Hero,
  HowItWorks,
  NutritionPreview,
  Section,
  SectionHeading,
  WorkoutShowcase,
} from "@/components/marketing/sections";
import { ProgressPreview } from "@/components/marketing/progress-preview";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section id="features">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Everything in one place"
            title="One platform for your whole routine"
            description="Training, food, habits and progress live together — so your plan actually fits your day."
          />
          <Button asChild variant="outline">
            <Link href="/features">
              All features <ArrowRight />
            </Link>
          </Button>
        </div>
        <FeatureGrid />
      </Section>

      <Section className="border-y border-border bg-surface/40">
        <SectionHeading eyebrow="How it works" title="Three steps to your first plan" />
        <HowItWorks />
      </Section>

      <Section id="workouts">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Workouts"
            title="Train the way you like"
            description="Gym or home, 20 minutes or an hour — every routine is a starting point you can make your own."
          />
          <Button asChild variant="outline">
            <Link href="/workouts">
              Browse workouts <ArrowRight />
            </Link>
          </Button>
        </div>
        <WorkoutShowcase />
      </Section>

      <Section id="nutrition" className="border-y border-border bg-surface/40">
        <SectionHeading
          eyebrow="Nutrition"
          title="Meals that support your training"
          description="Plan simple meals, check them off as you go, and see your approximate calories and macros add up."
        />
        <NutritionPreview />
      </Section>

      <Section id="progress">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Progress"
            title="See your consistency grow"
            description="Charts are built from the workouts, habits and logs you record — no guesswork, no inflated promises."
          />
          <span className="self-start rounded-full border border-border-strong px-3 py-1 text-xs text-muted md:self-auto">
            Illustrative demo data
          </span>
        </div>
        <ProgressPreview />
      </Section>

      <Section id="faq" className="border-t border-border">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" align="center" />
        <div className="mx-auto max-w-3xl">
          <Faq />
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
