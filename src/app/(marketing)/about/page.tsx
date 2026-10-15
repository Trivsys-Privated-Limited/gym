import type { Metadata } from "next";
import Image from "next/image";
import { CalendarCheck, Compass, HeartHandshake, LineChart, ListChecks, Repeat, Scale, Sparkles } from "lucide-react";
import { PageIntro } from "@/components/marketing/page-intro";
import { FinalCta, Section, SectionHeading } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "About" };

// Placeholder copy — edit freely to match your brand.
const VALUES = [
  { icon: Repeat, title: "Consistency over intensity", text: "Showing up regularly beats occasional heroics. We design for the long run." },
  { icon: Scale, title: "Honesty", text: "No inflated promises, fake numbers or miracle claims — just tools and clear information." },
  { icon: HeartHandshake, title: "Inclusive by default", text: "Beginners and experienced lifters, home and gym, every dietary preference." },
  { icon: Compass, title: "You stay in control", text: "Every plan, routine and target is editable. Your preferences come first." },
];

const BENEFITS = [
  { icon: CalendarCheck, text: "One calendar for workouts and plans" },
  { icon: ListChecks, text: "Daily tasks and habits that build momentum" },
  { icon: Sparkles, text: "Clear exercise instructions and safety notes" },
  { icon: LineChart, text: "Progress charts built from your own records" },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About"
        title="Fitness that fits real life"
        description="FITFLOW exists to make the everyday parts of fitness — planning, eating well, staying consistent — feel simple and achievable."
        image="/images/gym-floor.jpg"
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Our mission" title="Help people build routines that last" />
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Most people don’t struggle with knowing that exercise and good food matter. They struggle with fitting it all together: what to do today, what to eat,
              and whether any of it is working. Our mission is to bring those pieces into one calm place, so every day has a clear next step.
            </p>
          </div>
          <div>
            <SectionHeading eyebrow="The problem" title="Too many apps, too little clarity" />
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Workout trackers, meal apps, habit lists and gym portals rarely talk to each other. Motivation fades when progress is invisible and plans feel
              scattered. FITFLOW connects training, nutrition, habits and progress — and, for gyms, membership and attendance — in a single experience.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-y border-border bg-surface/40">
        <SectionHeading eyebrow="Core values" title="What we stand for" />
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="border-t-2 border-border-strong pt-6">
              <Icon className="size-6 text-accent-text" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border">
            <Image src="/images/stairs.jpg" alt="A person in running shoes climbing stone steps" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <SectionHeading
              eyebrow="Our approach"
              title="Progress is built one step at a time"
              description="We focus on achievable weekly plans, simple daily habits and honest tracking. Rest and recovery count as much as hard sessions, and nothing here replaces advice from a qualified professional."
            />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-sm">
                  <Icon className="size-5 shrink-0 text-accent-text" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <FinalCta title="Start your journey today" text="Create a demo profile and see how FITFLOW fits your week." />
    </>
  );
}
