import { useState } from "react";
import {
  Circle, CheckCircle2, ChevronRight, ChevronDown, Flag, Calendar as CalIcon,
  Trash2, ExternalLink, Plus, CornerDownLeft, Check, Clock, Folder as FolderIcon
} from "lucide-react";
import { format, parseISO, isToday, isPast, addDays } from "date-fns";
import { useTasks, isOverdue, isDueToday } from "@/store/tasks";
import type { Task, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  tone?: "danger" | "accent" | "muted";
}

const priorityColors: Record<Priority, { border: string; text: string; bg: string; fill: string }> = {
  high: {
    border: "border-red-500/70",
    text: "text-red-500",
    bg: "hover:bg-red-500/10",
    fill: "fill-red-500"
  },
  medium: {
    border: "border-amber-500/70",
    text: "text-amber-500",
    bg: "hover:bg-amber-500/10",
    fill: "fill-amber-500"
  },
  low: {
    border: "border-blue-500/70",
    text: "text-blue-500",
    bg: "hover:bg-blue-500/10",
    fill: "fill-blue-500"
  }
};

const priorityBadge: Record<Priority, string> = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export function TaskRow({ task, tone }: Props) {
  const selectTask = useTasks((s) => s.selectTask);
  const toggleDone = useTasks((s) => s.toggleDone);
  const updateTask = useTasks((s) => s.updateTask);
  const deleteTask = useTasks((s) => s.deleteTask);
  const folders = useTasks((s) => s.folders);
  const folder = folders.find((f) => f.id === task.folder);
  const addSubtask = useTasks((s) => s.addSubtask);
  const toggleSubtask = useTasks((s) => s.toggleSubtask);
  const deleteSubtask = useTasks((s) => s.deleteSubtask);

  const [expanded, setExpanded] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const isDone = task.status === "done";
  const overdue = isOverdue(task);
  const dueIsToday = task.dueDate && isToday(parseISO(task.dueDate));
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  
  const currentPriorityColor = priorityColors[task.priority] || priorityColors.medium;

  const handleSetPriority = (p: Priority) => {
    updateTask(task.id, { priority: p });
    setShowPriorityDropdown(false);
  };

  const handleSetDueDate = (daysOffset: number | null, customDate?: string) => {
    if (daysOffset === null && !customDate) {
      updateTask(task.id, { dueDate: undefined });
    } else {
      const targetDate = customDate ? new Date(customDate) : addDays(new Date(), daysOffset || 0);
      targetDate.setHours(12, 0, 0, 0); // standardize time
      updateTask(task.id, { dueDate: targetDate.toISOString() });
    }
    setShowDateDropdown(false);
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtaskTitle.trim()) {
      addSubtask(task.id, subtaskTitle.trim());
      setSubtaskTitle("");
      setExpanded(true);
    }
  };

  return (
    <div className="space-y-1">
      {/* Task Main Row */}
      <div
        className={cn(
          "group relative flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg border border-border/40 bg-card hover:bg-secondary/40 hover:border-border transition-all cursor-pointer",
          isDone && "opacity-60"
        )}
        onClick={() => selectTask(task.id)}
      >
        {/* Left Side Indicator Indicator */}
        <div 
          className={cn(
            "absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all",
            task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
          )} 
        />

        {/* Expand / Collapse Chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className={cn(
            "h-5 w-5 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground transition-all shrink-0",
            !hasSubtasks && "opacity-0 cursor-default"
          )}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Priority Checkbox Circle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDone(task.id);
          }}
          className={cn(
            "h-4.5 w-4.5 rounded-full border transition-all grid place-items-center shrink-0",
            currentPriorityColor.border,
            currentPriorityColor.bg,
            isDone && "bg-status-done border-status-done text-white hover:bg-status-done/90"
          )}
        >
          {isDone ? (
            <Check className="h-3 w-3 text-white stroke-[3px]" />
          ) : (
            <Circle className={cn("h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity", currentPriorityColor.text)} />
          )}
        </button>

        {/* Task Title & Details */}
        <div className="flex-1 min-w-0">
          <div className={cn("text-[13px] font-medium text-foreground", isDone && "line-through text-muted-foreground")}>
            {task.title}
          </div>
          
          <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap">
            {task.dueDate && (
              <span className={cn("inline-flex items-center gap-1", overdue ? "text-red-500 font-semibold" : dueIsToday ? "text-amber-500" : "")}>
                <Clock className="h-3 w-3" />
                {dueIsToday ? "Today" : overdue ? "Overdue" : format(parseISO(task.dueDate), "EEE, MMM d")}
              </span>
            )}
            {folder && (
              <span className="inline-flex items-center gap-1">
                <FolderIcon className="h-3 w-3" /> {folder.name}
              </span>
            )}
            {hasSubtasks && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-secondary/85 px-1.5 py-0.5 rounded text-muted-foreground">
                Subtasks {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
              </span>
            )}
            {task.tags.map((t) => (
              <span key={t} className="text-[10px] text-primary hover:underline">
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Task Actions (Priority, Calendar, Detail, Delete) */}
        <div className="flex items-center gap-1 shrink-0 relative">
          
          {/* Priority Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPriorityDropdown(!showPriorityDropdown);
                setShowDateDropdown(false);
              }}
              className={cn(
                "h-7 w-7 rounded-md grid place-items-center hover:bg-secondary transition-all",
                showPriorityDropdown ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Set priority"
            >
              <Flag className={cn("h-3.5 w-3.5", currentPriorityColor.fill, currentPriorityColor.text)} />
            </button>

            {showPriorityDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setShowPriorityDropdown(false); }} />
                <div className="absolute right-0 top-full mt-1 z-40 w-32 rounded-lg border border-border bg-popover shadow-elev p-1 animate-fade-in text-left">
                  {(["high", "medium", "low"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPriority(p);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-secondary flex items-center gap-2 capitalize",
                        task.priority === p && "bg-secondary font-semibold"
                      )}
                    >
                      <Flag className={cn("h-3 w-3", priorityColors[p].fill, priorityColors[p].text)} />
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Calendar Due Date Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDateDropdown(!showDateDropdown);
                setShowPriorityDropdown(false);
              }}
              className={cn(
                "h-7 w-7 rounded-md grid place-items-center hover:bg-secondary transition-all",
                showDateDropdown ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Schedule task"
            >
              <CalIcon className="h-3.5 w-3.5" />
            </button>

            {showDateDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setShowDateDropdown(false); }} />
                <div className="absolute right-0 top-full mt-1 z-40 w-48 rounded-lg border border-border bg-popover shadow-elev p-1 animate-fade-in text-left">
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Schedule Due Date</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetDueDate(0); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-secondary flex items-center justify-between"
                  >
                    <span>Today</span>
                    <span className="text-[10px] text-muted-foreground">Today</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetDueDate(1); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-secondary flex items-center justify-between"
                  >
                    <span>Tomorrow</span>
                    <span className="text-[10px] text-muted-foreground">Tmrw</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetDueDate(7); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-secondary flex items-center justify-between"
                  >
                    <span>Next Week</span>
                    <span className="text-[10px] text-muted-foreground">+7d</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetDueDate(null); }}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-secondary text-red-500 font-medium"
                  >
                    Clear Date
                  </button>
                  <div className="border-t border-border my-1" />
                  <div className="px-2.5 py-1 flex items-center gap-1.5">
                    <input
                      type="date"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.value) handleSetDueDate(null, e.target.value);
                      }}
                      className="w-full bg-secondary border border-border rounded-md px-1.5 py-1 text-[10.5px] outline-none text-foreground"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Delete Button (Visible on hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this task?")) deleteTask(task.id);
            }}
            className="h-7 w-7 rounded-md grid place-items-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Open Details Panel */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              selectTask(task.id);
            }}
            className="h-7 w-7 rounded-md grid place-items-center text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Open Details Panel"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Subtasks List */}
      {expanded && (
        <div className="pl-9 pr-3 py-1.5 space-y-1.5 border-l-2 border-dashed border-border ml-7 animate-fade-in">
          {task.subtasks && task.subtasks.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-secondary/45 border border-transparent hover:border-border/40 transition-colors"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSubtask(task.id, s.id);
                }}
                className={cn(
                  "h-4 w-4 rounded border grid place-items-center transition-colors shrink-0",
                  s.done ? "bg-status-done border-status-done text-white" : "border-border hover:border-primary"
                )}
              >
                {s.done && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
              </button>
              <span className={cn("flex-1 text-[12px]", s.done && "line-through text-muted-foreground")}>
                {s.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSubtask(task.id, s.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity p-0.5"
                title="Delete subtask"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Inline Add Subtask Field */}
          <form
            onSubmit={handleAddSubtaskSubmit}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-2 py-1"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Add subtask inline..."
              className="flex-1 text-[12px] bg-transparent outline-none border-b border-transparent focus:border-border/80 placeholder:text-muted-foreground/60 text-foreground transition-all py-0.5"
            />
            {subtaskTitle.trim() && (
              <button
                type="submit"
                className="h-5 px-1.5 rounded bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/95 flex items-center gap-0.5"
              >
                Add <CornerDownLeft className="h-2 w-2" />
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
