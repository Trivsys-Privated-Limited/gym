import type {
  AttendanceRecord,
  ClassBooking,
  GymClass,
  GymData,
  Member,
  MembershipPlan,
  Payment,
  PaymentMethod,
  Trainer,
} from "@/lib/types";
import { shiftISO, weekDates, weekdayOf } from "@/lib/dates";
import { seededRandom } from "./seed";

export const GYM_DATA_VERSION = 1;

export const PLANS: MembershipPlan[] = [
  { id: "plan-basic", name: "Basic", priceMonthly: 29, durationMonths: 1, features: ["Gym floor access", "Off-peak hours (10:00–16:00)", "Locker room"] },
  { id: "plan-standard", name: "Standard", priceMonthly: 49, durationMonths: 1, features: ["Full-hours gym access", "2 group classes per week", "Locker room", "App workout plans"], highlighted: true },
  { id: "plan-premium", name: "Premium", priceMonthly: 79, durationMonths: 1, features: ["Unlimited classes", "Monthly trainer check-in", "Towel service", "Guest pass each month"] },
  { id: "plan-annual", name: "Annual Standard", priceMonthly: 39, durationMonths: 12, features: ["Standard benefits", "Billed annually (12 months)", "Freeze up to 2 months"] },
];

export const TRAINERS: Trainer[] = [
  { id: "tr-1", name: "Jordan Reyes", email: "jordan.trainer@example.com", specialties: ["Strength", "Powerlifting"], bio: "Focuses on technique-first barbell training for all levels.", shifts: [{ day: 1, start: "06:00", end: "14:00" }, { day: 3, start: "06:00", end: "14:00" }, { day: 5, start: "06:00", end: "14:00" }] },
  { id: "tr-2", name: "Priya Nair", email: "priya.trainer@example.com", specialties: ["Mobility", "Yoga", "Recovery"], bio: "Helps members move better with mobility and breath-led sessions.", shifts: [{ day: 2, start: "08:00", end: "16:00" }, { day: 4, start: "08:00", end: "16:00" }, { day: 6, start: "08:00", end: "13:00" }] },
  { id: "tr-3", name: "Marcus Chen", email: "marcus.trainer@example.com", specialties: ["HIIT", "Conditioning"], bio: "Designs high-energy, scalable conditioning classes.", shifts: [{ day: 1, start: "14:00", end: "21:00" }, { day: 2, start: "14:00", end: "21:00" }, { day: 4, start: "14:00", end: "21:00" }] },
  { id: "tr-4", name: "Sofia Almeida", email: "sofia.trainer@example.com", specialties: ["Beginners", "Full-body", "Strength"], bio: "Specialises in helping new members build confident routines.", shifts: [{ day: 3, start: "12:00", end: "20:00" }, { day: 5, start: "12:00", end: "20:00" }, { day: 0, start: "09:00", end: "14:00" }] },
  { id: "tr-5", name: "Kwame Mensah", email: "kwame.trainer@example.com", specialties: ["Cycling", "Endurance"], bio: "Leads indoor cycling and endurance-focused sessions.", shifts: [{ day: 2, start: "06:00", end: "12:00" }, { day: 4, start: "06:00", end: "12:00" }, { day: 6, start: "07:00", end: "12:00" }] },
];

export const CLASSES: GymClass[] = [
  { id: "cl-1", name: "Strength Fundamentals", trainerId: "tr-1", day: 1, start: "07:00", durationMin: 60, capacity: 12, room: "Studio A", level: "beginner" },
  { id: "cl-2", name: "HIIT Express", trainerId: "tr-3", day: 1, start: "18:00", durationMin: 30, capacity: 16, room: "Studio B", level: "all" },
  { id: "cl-3", name: "Indoor Cycling", trainerId: "tr-5", day: 2, start: "07:00", durationMin: 45, capacity: 20, room: "Cycle Room", level: "all" },
  { id: "cl-4", name: "Mobility Flow", trainerId: "tr-2", day: 2, start: "12:30", durationMin: 45, capacity: 14, room: "Studio A", level: "all" },
  { id: "cl-5", name: "Barbell Technique", trainerId: "tr-1", day: 3, start: "07:00", durationMin: 60, capacity: 8, room: "Platform Area", level: "intermediate" },
  { id: "cl-6", name: "New Member Full-Body", trainerId: "tr-4", day: 3, start: "17:30", durationMin: 45, capacity: 10, room: "Studio B", level: "beginner" },
  { id: "cl-7", name: "Conditioning Circuit", trainerId: "tr-3", day: 4, start: "18:30", durationMin: 45, capacity: 16, room: "Studio B", level: "intermediate" },
  { id: "cl-8", name: "Yoga for Recovery", trainerId: "tr-2", day: 4, start: "09:00", durationMin: 60, capacity: 14, room: "Studio A", level: "all" },
  { id: "cl-9", name: "Endurance Ride", trainerId: "tr-5", day: 4, start: "07:00", durationMin: 50, capacity: 20, room: "Cycle Room", level: "advanced" },
  { id: "cl-10", name: "Friday Full-Body", trainerId: "tr-4", day: 5, start: "17:30", durationMin: 50, capacity: 12, room: "Studio A", level: "all" },
  { id: "cl-11", name: "Weekend Ride", trainerId: "tr-5", day: 6, start: "08:00", durationMin: 45, capacity: 20, room: "Cycle Room", level: "all" },
  { id: "cl-12", name: "Saturday Stretch", trainerId: "tr-2", day: 6, start: "10:00", durationMin: 45, capacity: 14, room: "Studio A", level: "all" },
  { id: "cl-13", name: "Sunday Strength Club", trainerId: "tr-4", day: 0, start: "10:00", durationMin: 60, capacity: 12, room: "Platform Area", level: "intermediate" },
];

const MEMBER_NAMES = [
  "Amara Okafor", "Ben Carter", "Chloe Dubois", "Daniel Kim", "Elena Petrova", "Farid Haddad",
  "Grace Liu", "Hugo Martins", "Isla Murray", "Jamal Wright", "Keiko Sato", "Liam O'Brien",
  "Maya Patel", "Noah Fischer", "Olivia Rossi", "Pedro Santos", "Quinn Taylor", "Rania Aziz",
  "Samuel Osei", "Tara Singh", "Umar Sheikh", "Valeria Gómez", "Will Thompson",
];

export function seedGymData(today: string, selfName: string, selfEmail: string): GymData {
  const rand = seededRandom(7);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;
  const methods: PaymentMethod[] = ["card", "card", "card", "cash", "bank-transfer"];

  const members: Member[] = MEMBER_NAMES.map((name, i) => {
    const plan = PLANS[i % PLANS.length]!;
    const joinOffset = -Math.floor(30 + rand() * 500);
    // Spread expiry dates so every status appears.
    const expiryOffset = i % 7 === 0 ? -Math.floor(3 + rand() * 30) : i % 5 === 0 ? Math.floor(2 + rand() * 12) : Math.floor(20 + rand() * 300);
    const slug = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.$/, "");
    return {
      id: `mem-${i + 1}`,
      name,
      email: `${slug}@example.com`,
      phone: `+00 555 01${String(i).padStart(2, "0")} ${String(Math.floor(1000 + rand() * 8999))}`,
      planId: plan.id,
      joinDate: shiftISO(today, joinOffset),
      expiryDate: shiftISO(today, expiryOffset),
      frozen: i === 9 || i === 17,
      trainerId: rand() < 0.5 ? pick(TRAINERS).id : undefined,
    };
  });

  const self: Member = {
    id: "mem-self",
    name: selfName,
    email: selfEmail,
    phone: "+00 555 0100 0000",
    planId: "plan-standard",
    joinDate: shiftISO(today, -120),
    expiryDate: shiftISO(today, 42),
    frozen: false,
    trainerId: "tr-4",
    notes: "This record represents you in the Member demo view.",
  };
  members.unshift(self);

  const payments: Payment[] = [];
  members.forEach((m) => {
    const plan = PLANS.find((p) => p.id === m.planId)!;
    const months = plan.durationMonths === 12 ? 1 : 6;
    for (let k = 0; k < months; k++) {
      const date = shiftISO(today, -(k * 30) - Math.floor(rand() * 20));
      if (date < m.joinDate) break;
      const roll = rand();
      payments.push({
        id: `pay-${m.id}-${k}`,
        memberId: m.id,
        planId: plan.id,
        amount: plan.priceMonthly * plan.durationMonths,
        date,
        method: pick(methods),
        status: roll < 0.88 ? "paid" : roll < 0.96 ? "pending" : "failed",
        reference: `DEMO-${(payments.length + 1001).toString()}`,
      });
    }
  });

  const attendance: AttendanceRecord[] = [];
  for (let d = -29; d <= 0; d++) {
    const date = shiftISO(today, d);
    const weekend = [0, 6].includes(weekdayOf(date));
    members.forEach((m) => {
      if (m.frozen || m.expiryDate < date) return;
      const chance = m.id === "mem-self" ? 0.45 : weekend ? 0.18 : 0.32;
      if (rand() > chance) return;
      const hour = 6 + Math.floor(rand() * 14);
      const minute = Math.floor(rand() * 60);
      const checkIn = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
      const stay = 40 + Math.floor(rand() * 60);
      const stillHere = d === 0 && rand() < 0.35;
      attendance.push({
        id: `att-${date}-${m.id}`,
        memberId: m.id,
        date,
        checkIn: checkIn.toISOString(),
        checkOut: stillHere ? undefined : new Date(checkIn.getTime() + stay * 60000).toISOString(),
      });
    });
  }

  const bookings: ClassBooking[] = [];
  const week = weekDates(today);
  CLASSES.forEach((c) => {
    const date = week.find((d) => weekdayOf(d) === c.day)!;
    const count = Math.floor(rand() * c.capacity * 0.9);
    const shuffled = members.filter((m) => m.id !== "mem-self").sort(() => rand() - 0.5);
    shuffled.slice(0, count).forEach((m) => bookings.push({ id: `bk-${c.id}-${m.id}`, classId: c.id, memberId: m.id, date }));
  });
  const selfClass = CLASSES.find((c) => c.id === "cl-6")!;
  bookings.push({ id: "bk-self-1", classId: selfClass.id, memberId: "mem-self", date: week.find((d) => weekdayOf(d) === selfClass.day)! });

  return {
    version: GYM_DATA_VERSION,
    plans: PLANS.map((p) => ({ ...p })),
    members,
    payments,
    attendance,
    trainers: TRAINERS.map((t) => ({ ...t })),
    classes: CLASSES.map((c) => ({ ...c })),
    bookings,
    selfMemberId: "mem-self",
  };
}
