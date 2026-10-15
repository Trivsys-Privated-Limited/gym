import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/images/hero-squat.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-md font-display text-5xl font-extrabold uppercase leading-[0.92]">
            Show up. <span className="text-primary">Track it.</span> Keep going.
          </p>
          <p className="mt-4 max-w-md text-muted">Workouts, nutrition, habits and progress in one place.</p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8">
          <Logo />
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> Back to site
          </Link>
        </div>
        <main id="main" className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
