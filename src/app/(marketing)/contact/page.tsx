import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageIntro } from "@/components/marketing/page-intro";
import { ContactForm } from "@/components/marketing/contact-form";
import { Faq, FAQS, Section } from "@/components/marketing/sections";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Contact" };

const DETAILS = [
  { icon: Mail, label: "Email", value: BRAND.contact.email },
  { icon: Phone, label: "Phone", value: BRAND.contact.phone },
  { icon: MapPin, label: "Address", value: BRAND.contact.address },
  { icon: Clock, label: "Support hours", value: BRAND.contact.hours },
];

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="We’d love to hear from you"
        description="Questions, feedback or ideas for FITFLOW? Use the form below. In this demo, messages stay in your browser."
      />
      <Section className="pt-12 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <ContactForm />
          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">Contact details</h2>
                <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warning">Placeholder</span>
              </div>
              <ul className="mt-5 space-y-4">
                {DETAILS.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                      <Icon className="size-4 text-accent-text" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-subtle">{label}</p>
                      <p className="break-words text-sm">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-subtle">Replace these details in src/lib/brand.ts before launch.</p>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="font-semibold">Support tips</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                <li>Lost your demo data? It lives in this browser only — clearing site data removes it.</li>
                <li>Want a fresh start? Use Settings → Reset demo data.</li>
                <li>Forgot your demo password? Create a new demo account or use “Explore Demo”.</li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
      <Section className="border-t border-border pt-16">
        <h2 className="font-display text-4xl font-bold uppercase">Common questions</h2>
        <div className="max-w-3xl">
          <Faq items={FAQS.slice(0, 5)} />
        </div>
      </Section>
    </>
  );
}
