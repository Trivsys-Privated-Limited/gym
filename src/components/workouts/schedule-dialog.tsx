"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { scheduleWorkout, updateScheduled } from "@/lib/actions";
import { formatDate, todayISO } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { ScheduledWorkout } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date?: string;
  routineId?: string;
  editing?: ScheduledWorkout | null;
}

export function ScheduleDialog({ open, onOpenChange, date, routineId, editing }: Props) {
  const { data, update } = useUserData();
  const [rid, setRid] = useState("");
  const [day, setDay] = useState(todayISO());
  const [time, setTime] = useState("18:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRid(editing?.routineId ?? routineId ?? data.routines[0]?.id ?? "");
    setDay(editing?.date ?? date ?? todayISO());
    setTime(editing?.time ?? "18:00");
    setError(null);
  }, [open, editing, routineId, date, data.routines]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rid) return setError("Choose a routine.");
    if (!day) return setError("Choose a date.");
    const clash = data.schedule.some((s) => s.id !== editing?.id && s.date === day && s.routineId === rid && s.status === "planned");
    if (clash) return setError("This routine is already planned on that day.");
    const name = data.routines.find((r) => r.id === rid)?.name;
    if (editing) {
      update((d) => updateScheduled(d, editing.id, { routineId: rid, date: day, time: time || undefined }));
      toast.success("Workout rescheduled", { description: `${name} · ${formatDate(day)}` });
    } else {
      update((d) => scheduleWorkout(d, { routineId: rid, date: day, time: time || undefined }));
      toast.success("Workout scheduled", { description: `${name} · ${formatDate(day)}` });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={editing ? "Reschedule workout" : "Schedule a workout"} size="sm">
        {data.routines.length === 0 ? (
          <p className="text-sm text-muted">Create a routine first, then you can add it to your calendar.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Routine" htmlFor="sch-routine">
              <Select id="sch-routine" value={rid} onChange={(e) => setRid(e.target.value)}>
                {data.routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.location === "gym" ? "Gym" : "Home"} · ~{r.estimatedMinutes} min)
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" htmlFor="sch-date">
                <Input id="sch-date" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
              </Field>
              <Field label="Time" htmlFor="sch-time" optional>
                <Input id="sch-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
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
              <Button type="submit">{editing ? "Save" : "Schedule"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
