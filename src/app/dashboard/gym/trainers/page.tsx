"use client";

import { useMemo, useState } from "react";
import { Mail, Search, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { WEEKDAYS } from "@/lib/dates";
import { useGymData } from "@/lib/store/app-store";
import { cn, initials } from "@/lib/utils";

export default function TrainersPage() {
  const { gym, role } = useGymData();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const specialties = useMemo(() => [...new Set(gym.trainers.flatMap((t) => t.specialties))].sort(), [gym.trainers]);
  const trainers = gym.trainers.filter(
    (t) => (!query.trim() || t.name.toLowerCase().includes(query.trim().toLowerCase())) && (specialty === "all" || t.specialties.includes(specialty)),
  );

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input aria-label="Search trainers" placeholder="Search trainers" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select aria-label="Filter by specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
          <option value="all">All specialties</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <p className="mb-4 text-xs text-subtle">All trainers are fictional sample profiles.</p>

      {trainers.length ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {trainers.map((t) => {
            const classes = gym.classes.filter((c) => c.trainerId === t.id).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
            const clients = gym.members.filter((m) => m.trainerId === t.id).length;
            return (
              <li key={t.id}>
                <Card className="h-full">
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-3 font-display text-xl font-bold">{initials(t.name)}</span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold">{t.name}</h2>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {t.specialties.map((s) => (
                            <Badge key={s} tone="primary">
                              {s}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-muted">{t.bio}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
                          <Mail className="size-3.5" aria-hidden /> {t.email} (placeholder)
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-2 text-xs font-medium text-muted">Weekly schedule</p>
                      <ol className="grid grid-cols-7 gap-1">
                        {WEEKDAYS.map((d) => {
                          const shift = t.shifts.find((s) => s.day === d.value);
                          return (
                            <li
                              key={d.value}
                              className={cn("rounded-lg px-1 py-2 text-center", shift ? "bg-primary-soft" : "bg-surface-2")}
                              aria-label={`${d.long}: ${shift ? `${shift.start} to ${shift.end}` : "off"}`}
                            >
                              <span className="block text-[11px] font-semibold">{d.short}</span>
                              <span className={cn("mt-0.5 block text-[10px] leading-tight", shift ? "text-accent-text" : "text-subtle")}>
                                {shift ? (
                                  <>
                                    {shift.start}
                                    <br />
                                    {shift.end}
                                  </>
                                ) : (
                                  "Off"
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted">Classes</p>
                        {classes.length ? (
                          <ul className="space-y-0.5 text-sm">
                            {classes.map((c) => (
                              <li key={c.id}>
                                {c.name} <span className="text-muted">· {WEEKDAYS.find((w) => w.value === c.day)?.short} {c.start}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted">No group classes</p>
                        )}
                      </div>
                      {role !== "member" && (
                        <div className="rounded-xl bg-surface-2 px-3 py-2 text-center">
                          <p className="text-[11px] text-muted">Assigned members</p>
                          <p className="font-display text-xl font-bold">{clients}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={UserRound} title="No trainers match" description="Try another search or specialty." />
      )}
    </div>
  );
}
