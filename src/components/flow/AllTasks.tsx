import { useMemo, useState } from "react";
import { Search, Folder as FolderIcon, Flag, CalendarDays, ChevronDown, Circle, CheckCircle2, Clock, Plus, CornerDownLeft, ListChecks } from "lucide-react";
import { format, parseISO, isToday, isPast, isFuture } from "date-fns";
import { useTasks, isOverdue, isDueToday } from "@/store/tasks";
import type { Priority, Task } from "@/lib/types";
import { parseQuickInput } from "@/lib/parser";
import { cn } from "@/lib/utils";
import { TaskRow } from "./TaskRow";

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
    <div className="space-y-6 w-full">
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
        
        <div className="pt-2">
          <InlineQuickAdd defaultFolder={folderFilter} defaultScope={scope} />
        </div>
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
        {tasks.map((t) => <TaskRow key={t.id} task={t} tone={tone} />)}
      </div>
    </section>
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

function InlineQuickAdd({ defaultFolder, defaultScope }: { defaultFolder?: string; defaultScope?: string }) {
  const addTask = useTasks((s) => s.addTask);
  const folders = useTasks((s) => s.folders);
  const addFolder = useTasks((s) => s.addFolder);
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    
    const parsed = parseQuickInput(value);
    if (!parsed?.title) return;

    let folderId = parsed.folder;
    if (folderId && !folders.find((f) => f.id === folderId || f.name.toLowerCase() === folderId)) {
      addFolder(folderId);
    } else if (folderId) {
      const found = folders.find((f) => f.id === folderId || f.name.toLowerCase() === folderId);
      if (found) folderId = found.id;
    }

    if (!folderId && defaultFolder) {
      folderId = defaultFolder;
    }

    let dueDate = parsed.dueDate;
    if (!dueDate && defaultScope === "today") {
      dueDate = new Date().toISOString();
    }

    addTask({
      title: parsed.title,
      tags: parsed.tags,
      priority: parsed.priority,
      recurrence: parsed.recurrence,
      folder: folderId ?? folders[0]?.id,
      dueDate: dueDate,
    });
    
    setValue("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
      >
        <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground group-hover:border-primary flex items-center justify-center transition-colors">
          <Plus className="h-3 w-3" />
        </div>
        <span className="text-[13px] font-medium">Add task...</span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="relative mt-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { if (!value.trim()) setIsOpen(false); }}
        placeholder='e.g. "Read 15 mins /daily #self p2"'
        className="w-full text-[13px] font-medium bg-secondary/50 border border-border rounded-lg px-3 py-2.5 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        {value.trim() && (
          <button
            type="submit"
            className="h-6 px-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-1"
          >
            Add <CornerDownLeft className="h-3 w-3" />
          </button>
        )}
      </div>
    </form>
  );
}
