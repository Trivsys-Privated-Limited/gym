"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Check, ListChecks, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { TaskCheckRow } from "@/components/dashboard/widgets";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/segmented";
import { addHabit, clearCompletedTasks, deleteTask, removeHabit, toggleHabit } from "@/lib/actions";
import { habitCompletion, sortTasks, taskStats } from "@/lib/calculations";
import { TASK_CATEGORIES } from "@/lib/constants";
import { formatDate, shiftISO, todayISO, weekDates } from "@/lib/dates";
import { useUserData } from "@/lib/store/app-store";
import type { Task, TaskCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "today" | "week" | "all" | "completed";

function HabitTracker() {
  const { data, update } = useUserData();
  const today = todayISO();
  const [newHabit, setNewHabit] = useState("");
  const [editing, setEditing] = useState(false);
  const done = data.habitLog[today] ?? [];
  const stats = habitCompletion(data, today);
  const last7 = Array.from({ length: 7 }, (_, i) => shiftISO(today, i - 6));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const title = newHabit.trim();
    if (!title) return;
    if (data.habits.some((h) => h.title.toLowerCase() === title.toLowerCase())) {
      toast.error("That habit already exists");
      return;
    }
    update((d) => addHabit(d, { title, category: "general" }));
    setNewHabit("");
    toast.success("Habit added");
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Daily habits</CardTitle>
          <CardDescription>
            {stats.total ? `${stats.done} of ${stats.total} today` : "Add a few small habits to repeat daily"}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)} aria-pressed={editing}>
          {editing ? "Done" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent>
        {stats.total > 0 && <Progress value={stats.percent} label="Habits completed today" className="mb-4" />}
        <ul className="space-y-1">
          {data.habits.map((h) => {
            const checked = done.includes(h.id);
            const cat = TASK_CATEGORIES[h.category];
            return (
              <li key={h.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2/60">
                <Checkbox
                  id={`habit-${h.id}`}
                  size="lg"
                  checked={checked}
                  onCheckedChange={() => update((d) => toggleHabit(d, today, h.id))}
                />
                <label htmlFor={`habit-${h.id}`} className={cn("min-w-0 flex-1 cursor-pointer text-sm", checked && "text-muted line-through")}>
                  {h.title}
                </label>
                <cat.icon className="size-4 shrink-0 text-subtle" aria-label={cat.label} />
                {editing && (
                  <Button
                    variant="danger-ghost"
                    size="icon-sm"
                    aria-label={`Remove habit ${h.title}`}
                    onClick={() => {
                      update((d) => removeHabit(d, h.id));
                      toast.success("Habit removed");
                    }}
                  >
                    <X />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {data.habits.length === 0 && <p className="py-4 text-center text-sm text-muted">No habits yet.</p>}
        <form onSubmit={add} className="mt-3 flex gap-2">
          <label htmlFor="new-habit" className="sr-only">
            New habit
          </label>
          <Input id="new-habit" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} placeholder="Add a habit…" maxLength={60} />
          <Button type="submit" variant="secondary" size="icon" aria-label="Add habit" disabled={!newHabit.trim()}>
            <Plus />
          </Button>
        </form>

        {data.habits.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-muted">Last 7 days</p>
            <ol className="grid grid-cols-7 gap-1.5">
              {last7.map((d) => {
                const c = habitCompletion(data, d);
                return (
                  <li key={d} className="text-center">
                    <div
                      className="mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-lg text-[10px] font-semibold"
                      style={{ background: c.done ? `color-mix(in oklab, var(--primary) ${20 + c.percent * 0.8}%, var(--surface-2))` : "var(--surface-2)", color: c.percent > 60 ? "var(--primary-foreground)" : "var(--muted)" }}
                      title={`${formatDate(d, "EEE MMM d")}: ${c.done}/${c.total}`}
                    >
                      {c.done}/{c.total}
                    </div>
                    <span className="mt-1 block text-[10px] text-subtle">{formatDate(d, "EEEEE")}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TasksPageInner() {
  const { data, update } = useUserData();
  const router = useRouter();
  const params = useSearchParams();
  const confirm = useConfirm();
  const today = todayISO();
  const [view, setView] = useState<View>("today");
  const [category, setCategory] = useState<"all" | TaskCategory>("all");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setDialogOpen(true);
      router.replace("/dashboard/tasks");
    }
  }, [params, router]);

  const week = weekDates(today);
  const counts = useMemo(
    () => ({
      today: data.tasks.filter((t) => t.dueDate === today && !t.completed).length,
      week: data.tasks.filter((t) => t.dueDate >= week[0]! && t.dueDate <= week[6]! && !t.completed).length,
      all: data.tasks.filter((t) => !t.completed).length,
      completed: data.tasks.filter((t) => t.completed).length,
    }),
    [data.tasks, today, week],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortTasks(
      data.tasks.filter((t) => {
        if (view === "today" && t.dueDate !== today) return false;
        if (view === "week" && (t.dueDate < week[0]! || t.dueDate > week[6]!)) return false;
        if (view === "completed" && !t.completed) return false;
        if (category !== "all" && t.category !== category) return false;
        if (q && !`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    );
  }, [data.tasks, view, category, query, today, week]);

  const todayStats = taskStats(data.tasks.filter((t) => t.dueDate === today));
  const overdue = data.tasks.filter((t) => !t.completed && t.dueDate < today).length;

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Tasks & habits"
        description="Plan the small actions that move you forward — then check them off."
        actions={
          <Button onClick={openNew}>
            <Plus /> New task
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] [&>*]:min-w-0">
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProgressRing value={todayStats.percent} size={84} stroke={8} label="Today’s tasks complete">
                <span className="text-lg font-bold tabular-nums">{todayStats.percent}%</span>
              </ProgressRing>
              <div className="flex-1">
                <p className="font-semibold">Today’s progress</p>
                <p className="text-sm text-muted">
                  {todayStats.total === 0
                    ? "No tasks due today yet."
                    : todayStats.open === 0
                      ? "Everything done for today. Excellent!"
                      : `${todayStats.done} done · ${todayStats.open} to go`}
                </p>
                {overdue > 0 && (
                  <Badge tone="danger" className="mt-2">
                    {overdue} overdue
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Segmented
              label="Task view"
              value={view}
              onChange={setView}
              options={[
                { value: "today", label: "Today", count: counts.today },
                { value: "week", label: "This week", count: counts.week },
                { value: "all", label: "All", count: counts.all },
                { value: "completed", label: "Completed", count: counts.completed },
              ]}
            />
            <div className="flex gap-2">
              <div className="relative flex-1 xl:w-48">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
                <Input aria-label="Search tasks" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
              </div>
              <Select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)} wrapperClassName="w-36 shrink-0">
                <option value="all">All categories</option>
                {(Object.keys(TASK_CATEGORIES) as TaskCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {TASK_CATEGORIES[c].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-3 sm:p-4">
              {visible.length ? (
                <ul aria-label="Tasks">
                  {visible.map((t) => (
                    <li key={t.id}>
                      <TaskCheckRow
                        task={t}
                        showDate={view !== "today"}
                        actions={
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${t.title}`}>
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setEditing(t);
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                destructive
                                onSelect={() =>
                                  confirm.ask({
                                    title: "Delete this task?",
                                    description: `“${t.title}” will be permanently removed.`,
                                    confirmLabel: "Delete",
                                    destructive: true,
                                    onConfirm: () => {
                                      update((d) => deleteTask(d, t.id));
                                      toast.success("Task deleted");
                                    },
                                  })
                                }
                              >
                                <Trash2 /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  className="border-0"
                  icon={view === "completed" ? Check : ListChecks}
                  title={
                    query || category !== "all"
                      ? "No tasks match your filters"
                      : view === "completed"
                        ? "No completed tasks yet"
                        : view === "today"
                          ? "Nothing on today’s list"
                          : "No tasks here"
                  }
                  description={query || category !== "all" ? "Try a different search or category." : "Add a task to start building momentum."}
                  action={
                    query || category !== "all" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery("");
                          setCategory("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button size="sm" onClick={openNew}>
                        <Plus /> Add task
                      </Button>
                    )
                  }
                />
              )}
            </CardContent>
          </Card>

          {counts.completed > 0 && (
            <div className="flex justify-end">
              <Button
                variant="danger-ghost"
                size="sm"
                onClick={() =>
                  confirm.ask({
                    title: "Clear completed tasks?",
                    description: `This permanently removes ${counts.completed} completed task${counts.completed === 1 ? "" : "s"}.`,
                    confirmLabel: "Clear completed",
                    destructive: true,
                    onConfirm: () => {
                      update(clearCompletedTasks);
                      toast.success("Completed tasks cleared");
                    },
                  })
                }
              >
                <Trash2 /> Clear completed ({counts.completed})
              </Button>
            </div>
          )}
        </div>

        <HabitTracker />
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />
      {confirm.element}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageInner />
    </Suspense>
  );
}
