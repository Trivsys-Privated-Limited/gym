import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Home, Building2 } from "lucide-react";
import { PageIntro } from "@/components/marketing/page-intro";
import { FinalCta, Section, SectionHeading, WorkoutShowcase } from "@/components/marketing/sections";
import { BodyMap } from "@/components/exercise/body-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTINE_TEMPLATES } from "@/lib/data/templates";
import { EXERCISES, EXERCISE_MAP } from "@/lib/data/exercises";
import { DIFFICULTY, EQUIPMENT, FOCUS } from "@/lib/constants";

export const metadata: Metadata = { title: "Workouts" };

const FEATURED_EXERCISES = ["ex-bodyweight-squat", "ex-push-up", "ex-reverse-lunge", "ex-db-row", "ex-plank", "ex-glute-bridge"];

export default function WorkoutsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Workouts"
        title="Routines for every place and pace"
        description="Start with a ready-made routine, follow clear exercise instructions, then customise everything once you find your rhythm."
        image="/images/cardio.jpg"
      />

      <Section>
        <SectionHeading eyebrow="Training styles" title="Pick your focus" />
        <WorkoutShowcase />
      </Section>

      <Section className="border-y border-border bg-surface/40">
        <SectionHeading
          eyebrow="Starter routines"
          title="Ready when you are"
          description="Every account starts with these routines. Edit sets, reps and rest — or build your own from the exercise library."
        />
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ROUTINE_TEMPLATES.map((r) => (
            <li key={r.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="relative h-36">
                <Image src={FOCUS[r.focus].image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                <div className="absolute left-4 top-4 flex gap-2">
                  <Badge tone="primary" className="bg-background/80 backdrop-blur">{FOCUS[r.focus].label}</Badge>
                  <Badge className="bg-background/80 backdrop-blur">
                    {r.location === "gym" ? <Building2 /> : <Home />} {r.location === "gym" ? "Gym" : "Home"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5 pt-2">
                <h3 className="text-lg font-semibold">{r.name}</h3>
                <p className="mt-1 text-sm text-muted">{r.description}</p>
                <ol className="mt-4 space-y-1.5 text-sm">
                  {r.exercises.map((e, i) => (
                    <li key={e.exerciseId} className="flex justify-between gap-3">
                      <span className="truncate">
                        <span className="mr-2 text-subtle tabular-nums">{i + 1}.</span>
                        {EXERCISE_MAP[e.exerciseId]?.name}
                      </span>
                      <span className="shrink-0 text-muted tabular-nums">
                        {e.sets} × {e.reps}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-auto flex items-center gap-1.5 pt-5 text-sm text-muted">
                  <Clock className="size-4" aria-hidden /> About {r.estimatedMinutes} minutes
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Exercise library"
            title={`${EXERCISES.length} exercises with clear cues`}
            description="Each exercise includes target muscles, equipment, sets and reps, rest, step-by-step instructions, common mistakes and safety notes."
          />
          <Button asChild variant="outline">
            <Link href="/sign-up">
              Open the full library <ArrowRight />
            </Link>
          </Button>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_EXERCISES.map((id) => {
            const ex = EXERCISE_MAP[id]!;
            return (
              <li key={id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="rounded-xl bg-surface-2 p-3">
                  <BodyMap muscles={ex.muscles} className="mx-auto max-w-56" />
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{ex.name}</h3>
                  <Badge tone={DIFFICULTY[ex.difficulty].tone}>{DIFFICULTY[ex.difficulty].label}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{ex.summary}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
                  <div>
                    <dt className="text-subtle">Sets × reps</dt>
                    <dd className="mt-0.5 font-medium">
                      {ex.sets} × {ex.reps}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-subtle">Rest</dt>
                    <dd className="mt-0.5 font-medium">{ex.restSeconds}s</dd>
                  </div>
                  <div>
                    <dt className="text-subtle">Equipment</dt>
                    <dd className="mt-0.5 font-medium">{EQUIPMENT[ex.equipment]}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-sm text-subtle">
          Exercise guidance is general and educational. If you have an injury or medical condition, check with a qualified professional first.
        </p>
      </Section>

      <FinalCta title="Your first workout is one click away" text="Create a demo profile and we’ll put a starter plan on your calendar." />
    </>
  );
}
