import { CheckCircle2, Circle, Clock, Repeat, ListTodo } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { isOverdue, useTasks } from "@/store/tasks";

interface Props {
  task: Task;
  compact?: boolean;
  dragging?: boolean;
}

const priorityBadge: Record<string, string> = {
  high: "bg-priority-high/10 text-priority-high border-priority-high/20",
  medium: "bg-priority-medium/10 text-priority-medium border-priority-medium/20",
  low: "bg-priority-low/10 text-priority-low border-priority-low/20",
};

const priorityBar: Record<string, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

export function TaskCard({ task, compact, dragging }: Props) {
  const selectTask = useTasks((s) => s.selectTask);
  const toggleDone = useTasks((s) => s.toggleDone);
  const overdue = isOverdue(task);
  const isDone = task.status === "done";
  const dueIsToday = task.dueDate && isToday(parseISO(task.dueDate));

  const completed = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;

  return (
    <div
      onClick={() => selectTask(task.id)}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-border bg-card p-3 hover:border-foreground/15 hover:shadow-card transition-all overflow-hidden",
        dragging && "ring-1 ring-primary/40 shadow-glow rotate-[0.5deg]",
        isDone && "opacity-60"
      )}
    >
      {/* Priority left bar */}
      <div className={cn("absolute left-0 top-3 bottom-3 w-[2px] rounded-full", priorityBar[task.priority])} />

      <div className="flex items-start gap-2.5 pl-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); toggleDone(task.id); }}
          className="mt-0.5 text-muted-foreground/60 hover:text-status-done transition-colors shrink-0"
          aria-label="Toggle done"
        >
          {isDone ? <CheckCircle2 className="h-4 w-4 text-status-done" /> : <Circle className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className={cn(
            "text-[13px] font-medium leading-snug text-foreground",
            isDone && "line-through text-muted-foreground"
          )}>
            {task.title}
          </div>

          {task.description && !compact && (
            <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </div>
          )}

          {!compact && (task.tags.length > 0 || task.dueDate || task.recurrence !== "none" || total > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={cn(
                "text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border",
                priorityBadge[task.priority]
              )}>
                {task.priority}
              </span>
              {total > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                  <ListTodo className="h-2.5 w-2.5" /> {completed}/{total}
                </span>
              )}
              {task.tags.slice(0, 2).map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                  #{t}
                </span>
              ))}
              {task.recurrence !== "none" && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  <Repeat className="h-2.5 w-2.5" /> {task.recurrence}
                </span>
              )}
              {task.dueDate && (
                <span className={cn(
                  "ml-auto inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium",
                  overdue
                    ? "text-priority-high bg-priority-high/10"
                    : dueIsToday
                    ? "text-accent bg-accent/10"
                    : "text-muted-foreground bg-secondary"
                )}>
                  <Clock className="h-2.5 w-2.5" />
                  {dueIsToday ? "Today" : format(parseISO(task.dueDate), "MMM d")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
