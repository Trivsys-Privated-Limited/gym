import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/page-intro";
import { Section } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "Privacy (placeholder)" };

export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Placeholder"
        title="Privacy policy"
        description="This page is a placeholder. Replace it with a privacy policy reviewed by a qualified professional before launch."
      />
      <Section className="pt-12">
        <div className="max-w-3xl space-y-4 text-muted">
          <h2 className="text-xl font-semibold text-foreground">How this demo handles data</h2>
          <p>
            This frontend demo does not have a server. Everything you enter — account details, workouts, meals, progress and contact messages — is stored in your
            browser’s localStorage or sessionStorage on this device only.
          </p>
          <p>Nothing is transmitted, sold or shared. Clearing your browser’s site data, or using Settings → Reset demo data, removes it.</p>
          <p>Passwords are hashed before being stored locally, but demo accounts are not secure authentication. Do not reuse a real password.</p>
        </div>
      </Section>
    </>
  );
}
