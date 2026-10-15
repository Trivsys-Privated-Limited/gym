"use client";

import Link from "next/link";
import { useMemo } from "react";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { AlertTriangle, ArrowRight, CalendarDays, CreditCard, DoorOpen, LogIn, LogOut, QrCode, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { ChartFrame, ChartTooltip, axisProps, gridProps } from "@/components/charts/chart-kit";
import { StatTile } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulatedBadge } from "@/components/ui/simulated";
import { memberStatus } from "@/lib/calculations";
import { CHART, MEMBER_STATUS } from "@/lib/constants";
import { formatDate, shiftISO, toISODate, todayISO, weekDates, weekdayOf } from "@/lib/dates";
import { checkIn, checkOut, openVisit } from "@/lib/gym-actions";
import { useGymData } from "@/lib/store/app-store";
import { formatCurrency } from "@/lib/utils";

function TodayClasses() {
  const { gym } = useGymData();
  const today = todayISO();
  const classes = gym.classes.filter((c) => c.day === weekdayOf(today)).sort((a, b) => a.start.localeCompare(b.start));
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Today’s classes</CardTitle>
          <CardDescription>{formatDate(today, "EEEE")}</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/gym/classes">
            Timetable <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {classes.length ? (
          <ul className="space-y-2">
            {classes.map((c) => {
              const booked = gym.bookings.filter((b) => b.classId === c.id && b.date === today).length;
              const trainer = gym.trainers.find((t) => t.id === c.trainerId);
              return (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="w-12 shrink-0 font-display text-lg font-bold tabular-nums">{c.start}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted">
                      {trainer?.name} · {c.room}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {booked}/{c.capacity}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">No classes scheduled today.</p>
        )}
      </CardContent>
    </Card>
  );
}

function StaffOverview() {
  const { gym } = useGymData();
  const today = todayISO();

  const stats = useMemo(() => {
    const statuses = gym.members.map((m) => memberStatus(m, today));
    const inGym = gym.attendance.filter((a) => a.date === today && !a.checkOut).length;
    const visitsToday = gym.attendance.filter((a) => a.date === today).length;
    const monthStart = toISODate(startOfMonth(new Date()));
    const revenueMonth = gym.payments.filter((p) => p.status === "paid" && p.date >= monthStart).reduce((a, p) => a + p.amount, 0);
    const pending = gym.payments.filter((p) => p.status !== "paid").length;
    return {
      active: statuses.filter((s) => s === "active" || s === "expiring").length,
      expiring: statuses.filter((s) => s === "expiring").length,
      expired: statuses.filter((s) => s === "expired").length,
      inGym,
      visitsToday,
      revenueMonth,
      pending,
    };
  }, [gym, today]);

  const revenue = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i);
        const from = toISODate(startOfMonth(d));
        const to = toISODate(endOfMonth(d));
        return {
          month: format(d, "MMM"),
          revenue: gym.payments.filter((p) => p.status === "paid" && p.date >= from && p.date <= to).reduce((a, p) => a + p.amount, 0),
        };
      }),
    [gym.payments],
  );

  const attendance = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const date = shiftISO(today, i - 13);
        return { day: formatDate(date, "MMM d"), visits: gym.attendance.filter((a) => a.date === date).length };
      }),
    [gym.attendance, today],
  );

  const expiringSoon = gym.members
    .filter((m) => memberStatus(m, today) === "expiring")
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={Users} label="Active members" value={stats.active} sub={`${stats.expired} expired`} href="/dashboard/gym/members" />
        <StatTile icon={AlertTriangle} label="Expiring in 14 days" value={stats.expiring} sub="Follow up to renew" href="/dashboard/gym/members" />
        <StatTile icon={DoorOpen} label="In the gym now" value={stats.inGym} sub={`${stats.visitsToday} visits today`} href="/dashboard/gym/attendance" />
        <StatTile icon={CreditCard} label="Revenue this month" value={formatCurrency(stats.revenueMonth)} sub={`${stats.pending} pending/failed · demo`} href="/dashboard/gym/memberships" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Paid demo payments, last 6 months</CardDescription>
            </div>
            <SimulatedBadge />
          </CardHeader>
          <CardContent>
            <ChartFrame summary="Demo revenue per month for the last six months" columns={[{ key: "month", label: "Month" }, { key: "revenue", label: "Revenue (USD)" }]} rows={revenue} height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} width={56} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip formatter={(v) => formatCurrency(v)} />} />
                  <Bar dataKey="revenue" name="Revenue" fill={CHART.s1} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Check-ins per day, last 14 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ChartFrame summary="Gym check-ins per day for the last 14 days" columns={[{ key: "day", label: "Day" }, { key: "visits", label: "Visits" }]} rows={attendance} height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendance} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="day" {...axisProps} minTickGap={12} />
                  <YAxis {...axisProps} allowDecimals={false} width={44} />
                  <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<ChartTooltip unit="visits" />} />
                  <Bar dataKey="visits" name="Check-ins" fill={CHART.s2} radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </CardContent>
        </Card>
        <TodayClasses />
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Expiring soon</CardTitle>
              <CardDescription>Memberships ending in the next 14 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {expiringSoon.length ? (
              <ul className="divide-y divide-border">
                {expiringSoon.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="truncate font-medium">{m.name}</span>
                    <span className="shrink-0 text-xs text-warning">Ends {formatDate(m.expiryDate, "MMM d")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No memberships expiring soon.</p>
            )}
            <Button asChild variant="link" size="sm" className="mt-3">
              <Link href="/dashboard/gym/members?status=expiring">Manage renewals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberOverview() {
  const { gym, update } = useGymData();
  const today = todayISO();
  const me = gym.members.find((m) => m.id === gym.selfMemberId);
  if (!me) return <p className="text-muted">Your member record could not be found. Reset demo data in Settings.</p>;
  const plan = gym.plans.find((p) => p.id === me.planId);
  const status = memberStatus(me, today);
  const visit = openVisit(gym, me.id);
  const monthStart = toISODate(startOfMonth(new Date()));
  const visitsThisMonth = gym.attendance.filter((a) => a.memberId === me.id && a.date >= monthStart).length;
  const week = weekDates(today);
  const myBookings = gym.bookings
    .filter((b) => b.memberId === me.id && b.date >= today && b.date <= week[6]!)
    .map((b) => ({ b, c: gym.classes.find((c) => c.id === b.classId) }))
    .filter((x) => x.c)
    .sort((a, b) => a.b.date.localeCompare(b.b.date));
  const trainer = gym.trainers.find((t) => t.id === me.trainerId);

  return (
    <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>My membership</CardTitle>
            <CardDescription>{me.name}</CardDescription>
          </div>
          <Badge tone={MEMBER_STATUS[status].tone}>{MEMBER_STATUS[status].label}</Badge>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-[1fr_auto]">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">Plan</dt>
              <dd className="font-semibold">{plan?.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Renews / expires</dt>
              <dd className="font-semibold">{formatDate(me.expiryDate, "MMM d, yyyy")}</dd>
            </div>
            <div>
              <dt className="text-muted">Member since</dt>
              <dd className="font-semibold">{formatDate(me.joinDate, "MMM yyyy")}</dd>
            </div>
            <div>
              <dt className="text-muted">Visits this month</dt>
              <dd className="font-semibold">{visitsThisMonth}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Assigned trainer</dt>
              <dd className="font-semibold">{trainer ? `${trainer.name} · ${trainer.specialties.join(", ")}` : "None"}</dd>
            </div>
          </dl>
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong p-4 text-center">
            <QrCode className="size-20 text-muted" aria-hidden />
            <SimulatedBadge label="Simulated QR" />
            <p className="max-w-36 text-xs text-subtle">Placeholder only — no real QR verification.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {visit ? (
              <Button
                variant="secondary"
                onClick={() => {
                  update((g) => checkOut(g, me.id));
                  toast.success("Checked out (simulated)");
                }}
              >
                <LogOut /> Check out
              </Button>
            ) : (
              <Button
                onClick={() => {
                  update((g) => checkIn(g, me.id));
                  toast.success("Checked in (simulated)", { description: "Have a great session!" });
                }}
                disabled={status === "expired" || status === "frozen"}
              >
                <LogIn /> Check in now
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/dashboard/gym/memberships">Plans & payments</Link>
            </Button>
          </div>
          {visit && <p className="text-sm text-accent-text sm:col-span-2">You checked in at {format(new Date(visit.checkIn), "HH:mm")}.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>My booked classes</CardTitle>
            <CardDescription>Rest of this week</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {myBookings.length ? (
            <ul className="space-y-2">
              {myBookings.map(({ b, c }) => (
                <li key={b.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">{c!.name}</p>
                  <p className="text-xs text-muted">
                    {formatDate(b.date, "EEE, MMM d")} · {c!.start} · {c!.room}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No upcoming bookings.</p>
          )}
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link href="/dashboard/gym/classes">
              <CalendarDays /> Book a class
            </Link>
          </Button>
        </CardContent>
      </Card>
      <div className="lg:col-span-3">
        <TodayClasses />
      </div>
    </div>
  );
}

export default function GymOverviewPage() {
  const { role } = useGymData();
  return role === "member" ? <MemberOverview /> : <StaffOverview />;
}
