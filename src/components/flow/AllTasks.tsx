import { useMemo, useState } from "react";
import { Search, Folder as FolderIcon, Flag, CalendarDays, ChevronDown, Circle, CheckCircle2, Clock } from "lucide-react";
import { format, parseISO, isToday, isPast, isFuture } from "date-fns";
import { useTasks, isOverdue, isDueToday } from "@/store/tasks";
import type { Priority, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  folderFilter?: string;
  scope?: "all" | "today" | "upcoming";
}

const priorityBar: Record<string, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

const priorityBadge: Record<string, string> = {
  high: "bg-priority-high/10 text-priority-high",
  medium: "bg-priority-medium/10 text-priority-medium",
  low: "bg-priority-low/10 text-priority-low",
};

export function AllTasks({ folderFilter, scope = "all" }: Props) {
  const allTasks = useTasks((s) => s.tasks);
  const folders = useTasks((s) => s.folders);
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [folderSel, setFolderSel] = useState<string>(folderFilter ?? "all");

  const tasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (folderSel !== "all" && t.folder !== folderSel) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (q) {
        const v = q.toLowerCase();
        if (!t.title.toLowerCase().includes(v) && !t.tags.some((tag) => tag.includes(v))) return false;
      }
      if (scope === "today") return isOverdue(t) || isDueToday(t);
      if (scope === "upcoming") return t.dueDate && isFuture(parseISO(t.dueDate)) && !isDueToday(t);
      return true;
    });
  }, [allTasks, q, priority, folderSel, scope]);

  const sections = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const someday: Task[] = [];
    tasks.forEach((t) => {
      if (t.status === "done") return;
      if (isOverdue(t)) overdue.push(t);
      else if (isDueToday(t)) today.push(t);
      else if (t.dueDate && isFuture(parseISO(t.dueDate))) upcoming.push(t);
      else someday.push(t);
    });
    return { overdue, today, upcoming, someday };
  }, [tasks]);

  const folder = folders.find((f) => f.id === folderFilter);
  const activeCount = tasks.filter((t) => t.status !== "done").length;

  const title = scope === "today" ? "Today" : scope === "upcoming" ? "Upcoming" : folder ? folder.name : "All Tasks";
  const subtitle = scope === "today"
    ? `${activeCount} task${activeCount === 1 ? "" : "s"} due today or overdue.`
    : scope === "upcoming"
    ? `${activeCount} upcoming task${activeCount === 1 ? "" : "s"}.`
    : `Reviewing ${activeCount} active task${activeCount === 1 ? "" : "s"}${folder ? " in this folder" : " across all folders"}.`;

  return (
    <div className="space-y-6 max-w-[1200px]">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] leading-tight font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <FilterChip
            icon={FolderIcon}
            label={`Folder: ${folderSel === "all" ? "All" : folders.find((f) => f.id === folderSel)?.name ?? "All"}`}
            options={[{ id: "all", label: "All" }, ...folders.map((f) => ({ id: f.id, label: f.name }))]}
            value={folderSel}
            onChange={setFolderSel}
            disabled={!!folderFilter}
          />
          <FilterChip
            icon={Flag}
            label={`Priority: ${priority === "all" ? "All" : priority}`}
            options={[
              { id: "all", label: "All" },
              { id: "high", label: "High" },
              { id: "medium", label: "Medium" },
              { id: "low", label: "Low" },
            ]}
            value={priority}
            onChange={(v) => setPriority(v as any)}
          />
        </div>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks…"
          className="w-full pl-9 pr-3 py-2 rounded-md bg-card border border-border text-[13px] outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      <div className="rounded-xl bg-card border border-border shadow-card p-5 space-y-6">
        {sections.overdue.length > 0 && (
          <SectionGroup title="Overdue" tone="danger" tasks={sections.overdue} />
        )}
        {sections.today.length > 0 && (
          <SectionGroup title="Today" tone="accent" tasks={sections.today} />
        )}
        {sections.upcoming.length > 0 && (
          <SectionGroup title="Upcoming" tone="muted" tasks={sections.upcoming} />
        )}
        {sections.someday.length > 0 && scope === "all" && (
          <SectionGroup title="No Date" tone="muted" tasks={sections.someday} />
        )}
        {tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-5 py-16 text-center text-sm text-muted-foreground">
            No tasks found.
          </div>
        )}
      </div>
    </div>
  );
}

function SectionGroup({ title, tone, tasks }: { title: string; tone: "danger" | "accent" | "muted"; tasks: Task[] }) {
  const toneClass =
    tone === "danger" ? "text-priority-high" :
    tone === "accent" ? "text-priority-medium" :
    "text-muted-foreground";
  return (
    <section className="animate-fade-in">
      <div className={cn("text-[10px] font-bold tracking-[0.18em] uppercase mb-2 px-1", toneClass)}>
        {title}
      </div>
      <div className="space-y-1.5">
        {tasks.map((t) => <ListRow key={t.id} task={t} tone={tone} />)}
      </div>
    </section>
  );
}

function ListRow({ task, tone }: { task: Task; tone: "danger" | "accent" | "muted" }) {
  const selectTask = useTasks((s) => s.selectTask);
  const toggleDone = useTasks((s) => s.toggleDone);
  const folders = useTasks((s) => s.folders);
  const folder = folders.find((f) => f.id === task.folder);
  const isDone = task.status === "done";
  const overdue = isOverdue(task);
  const dueIsToday = task.dueDate && isToday(parseISO(task.dueDate));

  const sideBar = tone === "danger" ? "bg-priority-high" : tone === "accent" ? "bg-priority-medium" : "bg-border";

  return (
    <div
      onClick={() => selectTask(task.id)}
      className="group relative flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-md hover:bg-secondary/60 cursor-pointer overflow-hidden border border-transparent hover:border-border transition-all"
    >
      <div className={cn("absolute left-0 top-2 bottom-2 w-[2px] rounded-full", sideBar)} />
      <button
        onClick={(e) => { e.stopPropagation(); toggleDone(task.id); }}
        className="text-muted-foreground/60 hover:text-status-done transition-colors shrink-0"
      >
        {isDone ? <CheckCircle2 className="h-4 w-4 text-status-done" /> : <Circle className="h-4 w-4" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={cn("text-[13px] font-medium", isDone && "line-through text-muted-foreground")}>{task.title}</div>
        <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-muted-foreground">
          {task.dueDate && (
            <span className={cn("inline-flex items-center gap-1", overdue ? "text-priority-high" : dueIsToday ? "text-accent" : "")}>
              <Clock className="h-3 w-3" />
              {dueIsToday ? format(parseISO(task.dueDate), "h:mm a") : overdue ? "Yesterday" : format(parseISO(task.dueDate), "EEE, MMM d")}
            </span>
          )}
          {folder && (
            <span className="inline-flex items-center gap-1">
              <FolderIcon className="h-3 w-3" /> {folder.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={cn(
          "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
          priorityBadge[task.priority]
        )}>
          {task.priority === "medium" ? "MED" : task.priority}
        </span>
        {task.tags.slice(0, 1).map((t) => (
          <span key={t} className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  icon: Icon, label, options, value, onChange, disabled,
}: {
  icon: any; label: string;
  options: { id: string; label: string }[];
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs font-medium hover:bg-secondary transition-colors",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-lg border border-border bg-popover shadow-elev p-1 animate-fade-in">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => { onChange(o.id); setOpen(false); }}
              className={cn(
                "w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-secondary",
                value === o.id && "bg-secondary font-semibold"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
