"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleSwitcher } from "@/components/gym/role-switcher";
import { DemoNotice } from "@/components/ui/simulated";
import { useUserData } from "@/lib/store/app-store";
import type { DemoRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; roles: DemoRole[] }[] = [
  { href: "/dashboard/gym", label: "Overview", roles: ["member", "trainer", "admin"] },
  { href: "/dashboard/gym/members", label: "Members", roles: ["trainer", "admin"] },
  { href: "/dashboard/gym/memberships", label: "Memberships", roles: ["member", "admin"] },
  { href: "/dashboard/gym/attendance", label: "Attendance", roles: ["member", "trainer", "admin"] },
  { href: "/dashboard/gym/trainers", label: "Trainers", roles: ["member", "trainer", "admin"] },
  { href: "/dashboard/gym/classes", label: "Classes", roles: ["member", "trainer", "admin"] },
];

export default function GymLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useUserData();
  const role = data.settings.demoRole;
  const tabs = TABS.filter((t) => t.roles.includes(role));

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-accent-text">Gym management · Demo area</p>
          <h1 className="font-display text-3xl font-bold uppercase sm:text-4xl">FITFLOW Gym</h1>
        </div>
        <div className="flex flex-col gap-1.5 lg:items-end">
          <span className="text-xs text-muted">Simulated role (not real authorization)</span>
          <RoleSwitcher />
        </div>
      </div>
      <DemoNotice className="mb-5">
        Sample records for a fictional gym. Payments, QR check-ins, emails and WhatsApp messages are <strong>simulated</strong> — nothing is charged or sent.
      </DemoNotice>
      <nav aria-label="Gym sections" className="mb-6 overflow-x-auto border-b border-border">
        <ul className="flex min-w-max gap-1">
          {tabs.map((t) => {
            const active = t.href === "/dashboard/gym" ? pathname === t.href : pathname.startsWith(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px inline-flex h-11 items-center border-b-2 px-3 text-sm font-medium transition-colors",
                    active ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {children}
    </div>
  );
}
