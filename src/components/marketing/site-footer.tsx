import Link from "next/link";
import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/brand";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/workouts", label: "Workouts" },
      { href: "/nutrition", label: "Nutrition" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy (placeholder)" },
      { href: "/terms", label: "Terms (placeholder)" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/sign-up", label: "Create demo account" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-in?demo=1", label: "Explore the demo" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">{BRAND.description}</p>
          <p className="mt-4 text-xs text-subtle">
            Frontend demo. Data is stored only in your browser and no information is sent anywhere.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. Working brand name — placeholder content.
          </p>
          <p>Photography from Unsplash. Not medical advice — consult a professional before starting a new program.</p>
        </div>
      </div>
    </footer>
  );
}
