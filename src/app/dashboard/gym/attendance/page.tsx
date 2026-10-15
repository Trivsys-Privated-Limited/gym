"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarCheck, ChevronLeft, ChevronRight, DoorOpen, LogIn, LogOut, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SimulatedBadge } from "@/components/ui/simulated";
import { memberStatus } from "@/lib/calculations";
import { formatDate, shiftISO, todayISO } from "@/lib/dates";
import { checkIn, checkOut, openVisit } from "@/lib/gym-actions";
import { useGymData } from "@/lib/store/app-store";
import { formatDuration, initials } from "@/lib/utils";

function FrontDesk() {
  const { gym, update } = useGymData();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = q ? gym.members.filter((m) => m.name.toLowerCase().includes(q) || m.email.includes(q)).slice(0, 6) : [];
  const inGym = gym.attendance.filter((a) => a.date === todayISO() && !a.checkOut);

  return (
    <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Front desk check-in <SimulatedBadge />
            </CardTitle>
            <CardDescription>Search a member to check them in or out. No QR scanner or hardware is connected.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <Input aria-label="Find member" placeholder="Start typing a member’s name…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 pl-9" />
          </div>
          <ul className="mt-3 space-y-2" aria-live="polite">
            {matches.map((m) => {
              const visit = openVisit(gym, m.id);
              const status = memberStatus(m);
              const blocked = status === "expired" || status === "frozen";
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-bold">{initials(m.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted">{visit ? `In since ${format(new Date(visit.checkIn), "HH:mm")}` : blocked ? `Membership ${status}` : "Not checked in"}</p>
                  </div>
                  {visit ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        update((g) => checkOut(g, m.id));
                        toast.success(`${m.name} checked out`);
                      }}
                    >
                      <LogOut /> Out
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={blocked}
                      title={blocked ? "Renew or unfreeze the membership first" : undefined}
                      onClick={() => {
                        update((g) => checkIn(g, m.id));
                        toast.success(`${m.name} checked in`);
                      }}
                    >
                      <LogIn /> In
                    </Button>
                  )}
                </li>
              );
            })}
            {q && matches.length === 0 && <li className="py-3 text-sm text-muted">No members found.</li>}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>In the gym now</CardTitle>
            <CardDescription>{inGym.length} checked in</CardDescription>
          </div>
          <DoorOpen className="size-5 text-subtle" aria-hidden />
        </CardHeader>
        <CardContent>
          {inGym.length ? (
            <ul className="divide-y divide-border">
              {inGym.map((a) => {
                const m = gym.members.find((x) => x.id === a.memberId);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate font-medium">{m?.name ?? "Former member"}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted">since {format(new Date(a.checkIn), "HH:mm")}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          update((g) => checkOut(g, a.memberId));
                          toast.success(`${m?.name ?? "Member"} checked out`);
                        }}
                      >
                        Check out
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nobody is checked in right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceLog({ onlyMemberId }: { onlyMemberId?: string }) {
  const { gym } = useGymData();
  const [date, setDate] = useState(todayISO());
  const records = useMemo(
    () => gym.attendance.filter((a) => a.date === date && (!onlyMemberId || a.memberId === onlyMemberId)).sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
    [gym.attendance, date, onlyMemberId],
  );
  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-center">
        <div>
          <CardTitle>Attendance log</CardTitle>
          <CardDescription>{records.length} visit{records.length === 1 ? "" : "s"}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Previous day" onClick={() => setDate((d) => shiftISO(d, -1))}>
            <ChevronLeft />
          </Button>
          <span className="min-w-28 text-center text-sm font-medium" aria-live="polite">
            {date === todayISO() ? "Today" : formatDate(date, "EEE, MMM d")}
          </span>
          <Button variant="outline" size="icon-sm" aria-label="Next day" disabled={date >= todayISO()} onClick={() => setDate((d) => shiftISO(d, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[480px] text-sm">
              <caption className="sr-only">Attendance on {date}</caption>
              <thead className="bg-surface-2 text-left text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Member</th>
                  <th scope="col" className="px-3 py-2 font-medium">Check-in</th>
                  <th scope="col" className="px-3 py-2 font-medium">Check-out</th>
                  <th scope="col" className="px-3 py-2 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {records.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-3 py-2">{gym.members.find((m) => m.id === a.memberId)?.name ?? "Former member"}</td>
                    <td className="px-3 py-2 tabular-nums">{format(new Date(a.checkIn), "HH:mm")}</td>
                    <td className="px-3 py-2 tabular-nums">{a.checkOut ? format(new Date(a.checkOut), "HH:mm") : <Badge tone="success">In gym</Badge>}</td>
                    <td className="px-3 py-2 tabular-nums text-muted">
                      {a.checkOut ? formatDuration((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 1000) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState compact icon={CalendarCheck} title="No visits recorded" description="Pick another day or check someone in." />
        )}
      </CardContent>
    </Card>
  );
}

function MyAttendance() {
  const { gym, update } = useGymData();
  const me = gym.members.find((m) => m.id === gym.selfMemberId);
  if (!me) return null;
  const visits = gym.attendance.filter((a) => a.memberId === me.id).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  const visit = openVisit(gym, me.id);
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              Self check-in <SimulatedBadge />
            </p>
            <p className="text-sm text-muted">{visit ? `Checked in since ${format(new Date(visit.checkIn), "HH:mm")}` : "You’re not checked in."}</p>
          </div>
          <Button
            variant={visit ? "secondary" : "primary"}
            onClick={() => {
              update((g) => (visit ? checkOut(g, me.id) : checkIn(g, me.id)));
              toast.success(visit ? "Checked out (simulated)" : "Checked in (simulated)");
            }}
          >
            {visit ? <LogOut /> : <LogIn />} {visit ? "Check out" : "Check in"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>My visits</CardTitle>
            <CardDescription>{visits.length} in the last 30 days</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {visits.length ? (
            <ul className="divide-y divide-border">
              {visits.slice(0, 20).map((a) => (
                <li key={a.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <span>{formatDate(a.date, "EEE, MMM d")}</span>
                  <span className="tabular-nums text-muted">
                    {format(new Date(a.checkIn), "HH:mm")} – {a.checkOut ? format(new Date(a.checkOut), "HH:mm") : "now"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No visits yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AttendancePage() {
  const { role } = useGymData();
  if (role === "member") return <MyAttendance />;
  return (
    <div className="space-y-4">
      <FrontDesk />
      <AttendanceLog />
    </div>
  );
}
