"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field, describedBy } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { addTask, updateTask } from "@/lib/actions";
import { PRIORITIES, TASK_CATEGORIES } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { taskSchema, type TaskValues } from "@/lib/schemas";
import { useUserData } from "@/lib/store/app-store";
import type { Priority, Task, TaskCategory } from "@/lib/types";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultDate?: string;
}

export function TaskDialog({ open, onOpenChange, task, defaultDate }: TaskDialogProps) {
  const { data, update } = useUserData();
  const blank: TaskValues = { title: "", description: "", category: "workout", priority: "medium", dueDate: defaultDate ?? todayISO(), dueTime: "" };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaskValues>({ resolver: zodResolver(taskSchema), defaultValues: blank });

  useEffect(() => {
    if (!open) return;
    reset(
      task
        ? { title: task.title, description: task.description ?? "", category: task.category, priority: task.priority, dueDate: task.dueDate, dueTime: task.dueTime ?? "" }
        : blank,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  function onSubmit(values: TaskValues) {
    const duplicate = data.tasks.some(
      (t) => t.id !== task?.id && !t.completed && t.dueDate === values.dueDate && t.title.trim().toLowerCase() === values.title.trim().toLowerCase(),
    );
    if (duplicate) {
      setError("title", { message: "You already have an open task with this title on that day." });
      return;
    }
    const input = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      category: values.category as TaskCategory,
      priority: values.priority as Priority,
      dueDate: values.dueDate,
      dueTime: values.dueTime || undefined,
    };
    if (task) {
      update((d) => updateTask(d, task.id, input));
      toast.success("Task updated");
    } else {
      update((d) => addTask(d, input));
      toast.success("Task added", { description: input.title });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={task ? "Edit task" : "New task"} description="Keep it small and specific — that’s what gets done.">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Title" htmlFor="task-title" error={errors.title?.message}>
            <Input {...describedBy("task-title", errors.title?.message)} placeholder="e.g. 20-minute walk after lunch" autoFocus {...register("title")} />
          </Field>
          <Field label="Description" htmlFor="task-desc" optional error={errors.description?.message}>
            <Textarea {...describedBy("task-desc", errors.description?.message)} rows={2} {...register("description")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="task-cat">
              <Select id="task-cat" {...register("category")}>
                {(Object.keys(TASK_CATEGORIES) as TaskCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {TASK_CATEGORIES[c].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority" htmlFor="task-priority">
              <Select id="task-priority" {...register("priority")}>
                {(Object.keys(PRIORITIES) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITIES[p].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date" htmlFor="task-date" error={errors.dueDate?.message}>
              <Input {...describedBy("task-date", errors.dueDate?.message)} type="date" {...register("dueDate")} />
            </Field>
            <Field label="Time" htmlFor="task-time" optional>
              <Input id="task-time" type="time" {...register("dueTime")} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {task ? "Save changes" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
