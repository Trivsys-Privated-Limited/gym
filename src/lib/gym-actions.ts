/**
 * Pure state transitions for the gym demo. Payments and check-ins are
 * SIMULATED — nothing here charges money or talks to hardware.
 */
import { addMonths, format, parseISO } from "date-fns";
import type { ClassBooking, GymClass, GymData, Member, Payment, PaymentMethod } from "./types";
import { todayISO } from "./dates";
import { uid } from "./utils";

export type MemberInput = Omit<Member, "id">;

export function addMember(g: GymData, input: MemberInput, payment?: { method: PaymentMethod }): GymData {
  const member: Member = { ...input, id: uid("mem") };
  let next: GymData = { ...g, members: [...g.members, member] };
  if (payment) next = recordPayment(next, member.id, member.planId, payment.method);
  return next;
}

export function updateMember(g: GymData, id: string, patch: Partial<Member>): GymData {
  return { ...g, members: g.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) };
}

export function deleteMember(g: GymData, id: string): GymData {
  if (id === g.selfMemberId) return g; // the demo user's own record can't be removed
  return {
    ...g,
    members: g.members.filter((m) => m.id !== id),
    bookings: g.bookings.filter((b) => b.memberId !== id),
    // Payments and attendance are kept as historical records.
  };
}

export function recordPayment(g: GymData, memberId: string, planId: string, method: PaymentMethod): GymData {
  const plan = g.plans.find((p) => p.id === planId);
  if (!plan) return g;
  const payment: Payment = {
    id: uid("pay"),
    memberId,
    planId,
    amount: plan.priceMonthly * plan.durationMonths,
    date: todayISO(),
    method,
    status: "paid",
    reference: `DEMO-${Math.floor(100000 + Math.random() * 899999)}`,
  };
  return { ...g, payments: [payment, ...g.payments] };
}

/** Extend a membership by one plan period from today or the current expiry (whichever is later). */
export function renewMembership(g: GymData, memberId: string, planId: string, method: PaymentMethod): GymData {
  const member = g.members.find((m) => m.id === memberId);
  const plan = g.plans.find((p) => p.id === planId);
  if (!member || !plan) return g;
  const today = todayISO();
  const base = member.expiryDate > today ? member.expiryDate : today;
  const expiryDate = format(addMonths(parseISO(base), plan.durationMonths), "yyyy-MM-dd");
  return recordPayment(updateMember(g, memberId, { planId, expiryDate, frozen: false }), memberId, planId, method);
}

export function setPaymentStatus(g: GymData, paymentId: string, status: Payment["status"]): GymData {
  return { ...g, payments: g.payments.map((p) => (p.id === paymentId ? { ...p, status } : p)) };
}

export function openVisit(g: GymData, memberId: string) {
  return g.attendance.find((a) => a.memberId === memberId && a.date === todayISO() && !a.checkOut);
}

export function checkIn(g: GymData, memberId: string): GymData {
  if (openVisit(g, memberId)) return g; // already checked in — prevents duplicates
  const now = new Date();
  return {
    ...g,
    attendance: [{ id: uid("att"), memberId, date: todayISO(), checkIn: now.toISOString() }, ...g.attendance],
  };
}

export function checkOut(g: GymData, memberId: string): GymData {
  const open = openVisit(g, memberId);
  if (!open) return g;
  return { ...g, attendance: g.attendance.map((a) => (a.id === open.id ? { ...a, checkOut: new Date().toISOString() } : a)) };
}

export function bookClass(g: GymData, classId: string, memberId: string, date: string): GymData {
  const cls = g.classes.find((c) => c.id === classId);
  if (!cls) return g;
  const existing = g.bookings.filter((b) => b.classId === classId && b.date === date);
  if (existing.some((b) => b.memberId === memberId) || existing.length >= cls.capacity) return g;
  const booking: ClassBooking = { id: uid("bk"), classId, memberId, date };
  return { ...g, bookings: [...g.bookings, booking] };
}

export function cancelBooking(g: GymData, classId: string, memberId: string, date: string): GymData {
  return { ...g, bookings: g.bookings.filter((b) => !(b.classId === classId && b.memberId === memberId && b.date === date)) };
}

export function addClass(g: GymData, input: Omit<GymClass, "id">): GymData {
  return { ...g, classes: [...g.classes, { ...input, id: uid("cl") }] };
}

export function deleteClass(g: GymData, id: string): GymData {
  return { ...g, classes: g.classes.filter((c) => c.id !== id), bookings: g.bookings.filter((b) => b.classId !== id) };
}
