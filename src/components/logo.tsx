import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground", className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15c3 0 3-6 6-6s3 6 6 6 3-6 6-6" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-md", className)} aria-label={`${BRAND.shortName} home`}>
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-wide">{BRAND.name}</span>
    </Link>
  );
}
