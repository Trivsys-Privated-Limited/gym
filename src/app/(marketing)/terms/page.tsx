import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/page-intro";
import { Section } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "Terms (placeholder)" };

export default function TermsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Placeholder"
        title="Terms of use"
        description="This page is a placeholder. Replace it with terms of service reviewed by a qualified professional before launch."
      />
      <Section className="pt-12">
        <div className="max-w-3xl space-y-4 text-muted">
          <h2 className="text-xl font-semibold text-foreground">Demo terms</h2>
          <p>FITFLOW is currently a demonstration product. Features such as payments, notifications, attendance integrations and messaging are simulated.</p>
          <p>
            Workout and nutrition content is general and educational. It is not medical advice. Consult a qualified professional before starting a new exercise or
            nutrition program, especially if you have an injury or health condition.
          </p>
          <p>All sample people, members, trainers and figures shown in the app are fictional.</p>
        </div>
      </Section>
    </>
  );
}
