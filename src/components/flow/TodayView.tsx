import { useMemo, useState } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday as isDateToday } from "date-fns";
import {
  CheckCircle2, Circle, FileText, Link2, Timer, ChevronLeft, ChevronRight, Plus,
  StickyNote,
} from "lucide-react";
import { isDueToday, isOverdue, useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";

const priorityPill: Record<Priority, string> = {
  high: "bg-priority-high/10 text-priority-high border-priority-high/20",
  medium: "bg-priority-medium/10 text-priority-medium border-priority-medium/20",
  low: "bg-status-done/10 text-status-done border-status-done/20",
};

const tileTints = ["bg-tile-pink", "bg-tile-sky", "bg-tile-peach", "bg-tile-mint"];

export function TodayView() {
  const tasks = useTasks((s) => s.tasks);
  const addTask = useTasks((s) => s.addTask);
  const toggleDone = useTasks((s) => s.toggleDone);
  const selectTask = useTasks((s) => s.selectTask);

  const todays = useMemo(() => {
    const list = tasks.filter((t) => isDueToday(t) || isOverdue(t) || (!t.dueDate && t.status !== "done"));
    return list.slice(0, 6);
  }, [tasks]);

  const completedToday = todays.filter((t) => t.status === "done").length;
  const totalActive = tasks.filter((t) => t.status !== "done").length;
  const totalDone = tasks.filter((t) => t.status === "done").length;
  const tagsCount = new Set(tasks.flatMap((t) => t.tags)).size;
  const recurringCount = tasks.filter((t) => t.recurrence !== "none").length;

  const [taskInput, setTaskInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState<{ id: string; text: string }[]>([
    { id: "n1", text: "Idea: weekly review template with mood tracking" },
    { id: "n2", text: "Read 'Designing Data-Intensive Apps' chapter 4" },
    { id: "n3", text: "Call mom this weekend" },
  ]);

  const stats = [
    { label: "Tasks today", value: todays.filter((t) => t.status !== "done").length, delta: "+3", icon: CheckCircle2, color: "tile-purple" as const, accent: "from-primary/20 to-primary/0" },
    { label: "Active tasks", value: totalActive, delta: "+5", icon: FileText, color: "tile-blue" as const, accent: "from-tile-blue/20 to-tile-blue/0" },
    { label: "Completed", value: totalDone, delta: "+12", icon: Link2, color: "tile-green" as const, accent: "from-tile-green/20 to-tile-green/0" },
    { label: "Recurring", value: recurringCount, delta: "+18%", icon: Timer, color: "tile-orange" as const, accent: "from-tile-orange/20 to-tile-orange/0" },
  ];

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today);
  const monthDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    const days = eachDayOfInterval({ start, end });
    const padStart = getDay(start); // 0 = Sun
    return { days, padStart };
  }, [calMonth]);

  return (
    <div className="space-y-8 pb-10 max-w-[1280px]">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, Thomas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <button className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-foreground/70">
          This week
        </button>
      </div>

      {/* Stat row — flat, refined */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Three column row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Today's Tasks */}
        <section className="lg:col-span-5 rounded-xl bg-card border border-border shadow-card p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold tracking-tight">Today's tasks</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {completedToday}/{todays.length} completed
              </p>
            </div>
            <select
              defaultValue="medium"
              className="text-[11px] bg-secondary border border-border rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-background transition-colors"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (taskInput.trim()) {
                addTask({ title: taskInput.trim(), dueDate: new Date().toISOString() });
                setTaskInput("");
              }
            }}
            className="flex items-center gap-2 mb-3"
          >
            <input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Add a task and press Enter…"
              className="flex-1 text-[13px] bg-secondary border border-transparent rounded-md px-3 py-2 outline-none focus:bg-background focus:border-primary/40 placeholder:text-muted-foreground transition-colors"
            />
            <button
              type="submit"
              className="h-8 w-8 grid place-items-center rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="space-y-1 flex-1">
            {todays.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10">
                No tasks for today yet.
              </div>
            ) : todays.map((t) => {
              const isDone = t.status === "done";
              return (
                <div
                  key={t.id}
                  onClick={() => selectTask(t.id)}
                  className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-secondary cursor-pointer transition-colors"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleDone(t.id); }}
                    className="shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-status-done" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/60 hover:text-primary transition-colors" />
                    )}
                  </button>
                  <span className={cn(
                    "flex-1 text-[13px] truncate",
                    isDone && "line-through text-muted-foreground"
                  )}>
                    {t.title}
                  </span>
                  <span className={cn(
                    "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize",
                    priorityPill[t.priority]
                  )}>
                    {t.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Notes */}
        <section className="lg:col-span-3 rounded-xl bg-card border border-border shadow-card p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold tracking-tight">Quick notes</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{notes.length} saved</p>
            </div>
            <StickyNote className="h-4 w-4 text-muted-foreground" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (noteInput.trim()) {
                setNotes([{ id: Math.random().toString(36).slice(2), text: noteInput.trim() }, ...notes]);
                setNoteInput("");
              }
            }}
            className="flex items-center gap-2 mb-3"
          >
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Jot a thought…"
              className="flex-1 text-[13px] bg-secondary border border-transparent rounded-md px-3 py-2 outline-none focus:bg-background focus:border-primary/40 placeholder:text-muted-foreground transition-colors"
            />
            <button
              type="submit"
              className="h-8 w-8 grid place-items-center rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="grid grid-cols-1 gap-2 flex-1 content-start">
            {notes.map((n, i) => (
              <div
                key={n.id}
                className={cn(
                  "rounded-lg p-3 text-[12px] leading-snug text-foreground/80 border border-border/60 hover:shadow-card transition-all cursor-default",
                  tileTints[i % tileTints.length]
                )}
              >
                {n.text}
              </div>
            ))}
          </div>
        </section>

        {/* Calendar */}
        <section className="lg:col-span-4 rounded-xl bg-card border border-border shadow-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold tracking-tight">Calendar</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                className="h-7 w-7 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-semibold tabular-nums">{format(calMonth, "MMMM yyyy")}</span>
              <button
                onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                className="h-7 w-7 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-[10px] font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: monthDays.padStart }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
              {monthDays.days.map((d) => {
              const hasTask = tasks.some((t) => t.dueDate && isSameDay(parseISO(t.dueDate), d));
              const isCurrent = isDateToday(d);
              return (
                <button
                  key={d.toISOString()}
                  className={cn(
                    "relative h-7 w-7 mx-auto grid place-items-center text-[11px] tabular-nums rounded-md transition-colors",
                    isCurrent
                      ? "bg-foreground text-background font-semibold"
                      : "hover:bg-secondary text-foreground/80"
                  )}
                >
                  {d.getDate()}
                  {hasTask && !isCurrent && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2">
              Today's schedule
            </div>
            <div className="space-y-2">
              {todays.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate!), new Date())).slice(0, 3).map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    i % 2 === 0 ? "bg-primary" : "bg-tile-blue"
                  )} />
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {format(parseISO(t.dueDate!), "HH:mm")}
                  </span>
                  <span className="flex-1 truncate font-medium">{t.title}</span>
                </div>
              ))}
              {todays.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate!), new Date())).length === 0 && (
                <div className="text-xs text-muted-foreground">No scheduled events.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label, value, delta, icon: Icon, color,
}: {
  label: string;
  value: number;
  delta: string;
  icon: any;
  color: "tile-purple" | "tile-blue" | "tile-green" | "tile-orange";
  accent: string;
}) {
  const iconBg: Record<string, string> = {
    "tile-purple": "bg-primary/10 text-primary",
    "tile-blue": "bg-tile-blue/10 text-tile-blue",
    "tile-green": "bg-tile-green/10 text-tile-green",
    "tile-orange": "bg-tile-orange/10 text-tile-orange",
  };
  const isUp = delta.startsWith("+");
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-foreground/15 transition-colors">
      <div className="flex items-center justify-between">
        <div className={cn("h-7 w-7 rounded-md grid place-items-center", iconBg[color])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className={cn(
          "text-[10px] font-semibold tabular-nums",
          isUp ? "text-tile-green" : "text-muted-foreground"
        )}>
          {delta}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div className="text-[24px] leading-none font-semibold tracking-tight tabular-nums">{value}</div>
      </div>
      <div className="text-[12px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
