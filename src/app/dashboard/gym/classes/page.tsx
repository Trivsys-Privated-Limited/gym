"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/segmented";
import { memberStatus } from "@/lib/calculations";
import { formatDate, shiftISO, todayISO, weekDates, weekdayOf, WEEKDAYS } from "@/lib/dates";
import { addClass, bookClass, cancelBooking, deleteClass } from "@/lib/gym-actions";
import { useGymData } from "@/lib/store/app-store";
import type { Difficulty, GymClass } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVEL_LABEL: Record<GymClass["level"], string> = { all: "All levels", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

function AddClassDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { gym, update } = useGymData();
  const [f, setF] = useState({ name: "", trainerId: gym.trainers[0]?.id ?? "", day: "1", start: "18:00", durationMin: "45", capacity: "12", room: "Studio A", level: "all" });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const dur = Number(f.durationMin);
    const cap = Number(f.capacity);
    if (f.name.trim().length < 3) return setError("Give the class a name.");
    if (!(dur >= 15 && dur <= 180)) return setError("Duration should be 15–180 minutes.");
    if (!(cap >= 1 && cap <= 60)) return setError("Capacity should be 1–60.");
    update((g) =>
      addClass(g, { name: f.name.trim(), trainerId: f.trainerId, day: Number(f.day), start: f.start, durationMin: dur, capacity: cap, room: f.room.trim() || "Studio", level: f.level as Difficulty | "all" }),
    );
    toast.success("Class added to the timetable");
    onOpenChange(false);
    setF((x) => ({ ...x, name: "" }));
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add a weekly class" size="md">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Class name" htmlFor="cl-name">
            <Input id="cl-name" value={f.name} onChange={set("name")} maxLength={50} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trainer" htmlFor="cl-trainer">
              <Select id="cl-trainer" value={f.trainerId} onChange={set("trainerId")}>
                {gym.trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Day" htmlFor="cl-day">
              <Select id="cl-day" value={f.day} onChange={set("day")}>
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.long}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Start time" htmlFor="cl-start">
              <Input id="cl-start" type="time" value={f.start} onChange={set("start")} />
            </Field>
            <Field label="Duration (min)" htmlFor="cl-dur">
              <Input id="cl-dur" type="number" value={f.durationMin} onChange={set("durationMin")} />
            </Field>
            <Field label="Capacity" htmlFor="cl-cap">
              <Input id="cl-cap" type="number" value={f.capacity} onChange={set("capacity")} />
            </Field>
            <Field label="Room" htmlFor="cl-room">
              <Input id="cl-room" value={f.room} onChange={set("room")} />
            </Field>
            <Field label="Level" htmlFor="cl-level">
              <Select id="cl-level" value={f.level} onChange={set("level")}>
                {Object.entries(LEVEL_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add class</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RosterDialog({ cls, date, onClose }: { cls: GymClass | null; date: string; onClose: () => void }) {
  const { gym } = useGymData();
  const names = cls
    ? gym.bookings
        .filter((b) => b.classId === cls.id && b.date === date)
        .map((b) => gym.members.find((m) => m.id === b.memberId)?.name ?? "Former member")
        .sort()
    : [];
  return (
    <Dialog open={!!cls} onOpenChange={(o) => !o && onClose()}>
      {cls && (
        <DialogContent title={`${cls.name} — roster`} description={`${formatDate(date, "EEEE, MMM d")} · ${cls.start} · ${names.length}/${cls.capacity} booked`} size="sm">
          {names.length ? (
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {names.map((n, i) => (
                <li key={`${n}-${i}`}>{n}</li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted">No bookings yet.</p>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

export default function ClassesPage() {
  const { gym, update, role } = useGymData();
  const confirm = useConfirm();
  const today = todayISO();
  const [anchor, setAnchor] = useState(today);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [roster, setRoster] = useState<{ cls: GymClass | null; date: string }>({ cls: null, date: today });
  const days = weekDates(anchor);
  const me = gym.members.find((m) => m.id === gym.selfMemberId);
  const myStatus = me ? memberStatus(me) : "expired";
  const canBook = myStatus === "active" || myStatus === "expiring";

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setAnchor((a) => shiftISO(a, -7))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Next week" onClick={() => setAnchor((a) => shiftISO(a, 7))}>
            <ChevronRight />
          </Button>
          <h2 className="ml-1 font-semibold" aria-live="polite">
            {formatDate(days[0]!, "MMM d")} – {formatDate(days[6]!, "MMM d")}
          </h2>
          {!days.includes(today) && (
            <Button variant="ghost" size="sm" onClick={() => setAnchor(today)}>
              This week
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {role === "member" && (
            <Segmented
              label="Show classes"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All classes" },
                { value: "mine", label: "My bookings" },
              ]}
            />
          )}
          {role === "admin" && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus /> Add class
            </Button>
          )}
        </div>
      </div>
      {role === "member" && !canBook && (
        <p className="mb-4 rounded-lg bg-warning-soft px-3 py-2 text-sm">Your membership is {myStatus}. Renew it in Memberships to book classes.</p>
      )}

      <div className="space-y-5">
        {days.map((date) => {
          const list = gym.classes
            .filter((c) => c.day === weekdayOf(date))
            .filter((c) => filter === "all" || gym.bookings.some((b) => b.classId === c.id && b.date === date && b.memberId === gym.selfMemberId))
            .sort((a, b) => a.start.localeCompare(b.start));
          if (filter === "mine" && list.length === 0) return null;
          return (
            <section key={date} aria-labelledby={`day-${date}`}>
              <h3 id={`day-${date}`} className={cn("mb-2 text-sm font-semibold", date === today && "text-accent-text")}>
                {formatDate(date, "EEEE, MMM d")} {date === today && "· Today"}
              </h3>
              {list.length ? (
                <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((c) => {
                    const trainer = gym.trainers.find((t) => t.id === c.trainerId);
                    const bookings = gym.bookings.filter((b) => b.classId === c.id && b.date === date);
                    const mine = bookings.some((b) => b.memberId === gym.selfMemberId);
                    const full = bookings.length >= c.capacity;
                    const past = date < today || (date === today && c.start < new Date().toTimeString().slice(0, 5));
                    return (
                      <li key={c.id}>
                        <Card className={cn("p-4", mine && "border-primary/50", past && "opacity-60")}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold">{c.name}</p>
                              <p className="text-sm text-muted">{trainer?.name}</p>
                            </div>
                            <Badge tone={c.level === "all" ? "neutral" : c.level === "beginner" ? "primary" : c.level === "intermediate" ? "warning" : "danger"}>{LEVEL_LABEL[c.level]}</Badge>
                          </div>
                          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" aria-hidden /> {c.start} · {c.durationMin} min
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3.5" aria-hidden /> {c.room}
                            </span>
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <Progress value={(bookings.length / c.capacity) * 100} tone={full ? "warning" : "primary"} className="h-1.5" label={`${c.name} capacity`} />
                            <span className="shrink-0 text-xs tabular-nums text-muted">
                              {bookings.length}/{c.capacity}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            {role === "member" ? (
                              mine ? (
                                <>
                                  <Badge tone="success">Booked</Badge>
                                  {!past && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        update((g) => cancelBooking(g, c.id, gym.selfMemberId, date));
                                        toast.success("Booking cancelled");
                                      }}
                                    >
                                      Cancel booking
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-muted">{full ? "Class full" : `${c.capacity - bookings.length} spots left`}</span>
                                  <Button
                                    size="sm"
                                    disabled={full || past || !canBook}
                                    onClick={() => {
                                      update((g) => bookClass(g, c.id, gym.selfMemberId, date));
                                      toast.success("Class booked (demo)", { description: `${c.name} · ${formatDate(date, "EEE")} ${c.start}` });
                                    }}
                                  >
                                    {past ? "Finished" : "Book"}
                                  </Button>
                                </>
                              )
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => setRoster({ cls: c, date })}>
                                  <Users /> Roster
                                </Button>
                                {role === "admin" && (
                                  <Button
                                    size="icon-sm"
                                    variant="danger-ghost"
                                    aria-label={`Delete ${c.name}`}
                                    onClick={() =>
                                      confirm.ask({
                                        title: `Remove ${c.name}?`,
                                        description: "This weekly class and all of its bookings will be removed from the timetable.",
                                        confirmLabel: "Remove class",
                                        destructive: true,
                                        onConfirm: () => {
                                          update((g) => deleteClass(g, c.id));
                                          toast.success("Class removed");
                                        },
                                      })
                                    }
                                  >
                                    <Trash2 />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-border-strong px-4 py-3 text-sm text-subtle">No classes.</p>
              )}
            </section>
          );
        })}
        {filter === "mine" && !days.some((d) => gym.bookings.some((b) => b.date === d && b.memberId === gym.selfMemberId)) && (
          <p className="text-sm text-muted">You have no bookings this week.</p>
        )}
      </div>

      <AddClassDialog open={addOpen} onOpenChange={setAddOpen} />
      <RosterDialog cls={roster.cls} date={roster.date} onClose={() => setRoster((r) => ({ ...r, cls: null }))} />
      {confirm.element}
    </div>
  );
}
