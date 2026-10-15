import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <p className="mt-10 font-display text-8xl font-extrabold text-surface-3">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
