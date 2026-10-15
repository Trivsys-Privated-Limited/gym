"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

export const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/workouts", label: "Workouts" },
  { href: "/nutrition", label: "Nutrition" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { session, hydrated } = useAppStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const signedIn = hydrated && !!session;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors",
        scrolled ? "border-border bg-background/90 backdrop-blur-md" : "border-transparent bg-background/0",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {PUBLIC_NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "text-foreground" : "text-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard">
                <LayoutDashboard /> Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}

          <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Trigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="!size-5" />
              </Button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay animate-overlay-in lg:hidden" />
              <DialogPrimitive.Content className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background px-4 pb-6 pt-3 animate-fade-in focus:outline-none lg:hidden">
                <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">Site navigation</DialogPrimitive.Description>
                <div className="flex h-10 items-center justify-between">
                  <Logo />
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close menu">
                      <X className="!size-5" />
                    </Button>
                  </DialogPrimitive.Close>
                </div>
                <nav aria-label="Mobile" className="mt-4">
                  <ul className="flex flex-col">
                    {PUBLIC_NAV.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={pathname === item.href ? "page" : undefined}
                          className="flex rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-surface-2 aria-[current=page]:text-accent-text"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="mt-4 grid gap-2">
                  {signedIn ? (
                    <Button asChild size="lg">
                      <Link href="/dashboard">Go to dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild size="lg">
                        <Link href="/sign-up">Get Started</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                        <Link href="/sign-in">Sign In</Link>
                      </Button>
                    </>
                  )}
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </div>
    </header>
  );
}
