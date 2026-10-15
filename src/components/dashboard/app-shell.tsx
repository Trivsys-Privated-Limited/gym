"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Apple,
  ChevronDown,
  Dumbbell,
  ExternalLink,
  FlaskConical,
  LogOut,
  Menu,
  Plus,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOBILE_TABS, NAV_GROUPS, isActive } from "./nav-config";
import { useUserData, useAppStore } from "@/lib/store/app-store";
import { cn, initials } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary-soft text-accent-text" : "text-muted hover:bg-surface-2 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function DemoFootnote() {
  return (
    <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-xs text-muted">
      <p className="flex items-center gap-1.5 font-semibold text-foreground">
        <FlaskConical className="size-3.5 text-warning" aria-hidden /> Frontend demo
      </p>
      <p className="mt-1 leading-relaxed">Data is saved in this browser only. Reset or export it in Settings.</p>
    </div>
  );
}

function ProfileMenu() {
  const { session, data } = useUserData();
  const { signOut } = useAppStore();
  const router = useRouter();
  const name = data.profile.name || session.name;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-surface-2"
          aria-label="Open profile menu"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-surface-3 text-xs font-bold">{initials(name)}</span>
          <ChevronDown className="hidden size-4 text-muted sm:block" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted">{session.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/dashboard/profile")}>
          <UserRound /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/dashboard/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/")}>
          <ExternalLink /> Public website
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={() => {
            signOut();
            toast.success("Signed out");
            router.replace("/sign-in");
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QuickAdd() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" aria-label="Quick actions">
          <Plus /> <span className="hidden sm:inline">Quick add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push("/dashboard/tasks?new=1")}>
          <Plus /> Add a task
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/dashboard/workouts/active")}>
          <Dumbbell /> Start a workout
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/dashboard/nutrition?new=1")}>
          <Apple /> Log a meal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  // Active workout mode is a focused, full-screen experience.
  const focusMode = pathname.startsWith("/dashboard/workouts/active");
  if (focusMode) return <main id="main">{children}</main>;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-border bg-surface/50 px-4 py-5 lg:flex">
        <Logo href="/dashboard" className="px-2" />
        <NavLinks />
        <div className="mt-auto">
          <DemoFootnote />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogPrimitive.Trigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu className="!size-5" />
                </Button>
              </DialogPrimitive.Trigger>
              <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay animate-overlay-in" />
                <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,85vw)] flex-col gap-6 overflow-y-auto border-r border-border bg-background px-4 py-4 animate-sheet-in focus:outline-none">
                  <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">Dashboard sections</DialogPrimitive.Description>
                  <div className="flex items-center justify-between">
                    <Logo href="/dashboard" className="px-2" />
                    <DialogPrimitive.Close asChild>
                      <Button variant="ghost" size="icon" aria-label="Close navigation">
                        <X className="!size-5" />
                      </Button>
                    </DialogPrimitive.Close>
                  </div>
                  <NavLinks onNavigate={() => setMenuOpen(false)} />
                  <div className="mt-auto">
                    <DemoFootnote />
                  </div>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
            <Logo href="/dashboard" className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          </div>
          <p className="hidden items-center gap-1.5 text-xs text-muted lg:flex">
            <FlaskConical className="size-3.5 text-warning" aria-hidden /> Demo mode — data stays in this browser
          </p>
          <div className="flex items-center gap-2">
            <QuickAdd />
            <ProfileMenu />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {MOBILE_TABS.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active ? "text-accent-text" : "text-muted")}
                >
                  <Icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMenuOpen(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted">
              <Menu className="size-5" aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
