import { useEffect, useMemo, useRef, useState } from "react";
import { Search, LayoutDashboard, KanbanSquare, ListChecks, CalendarDays, Plus, CornerDownLeft, ArrowUp, ArrowDown, NotebookPen, Sunrise, FileText, Terminal, Settings, StickyNote } from "lucide-react";
import { useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";

export type CommandView = "today" | "upcoming" | "board" | "all" | "notes" | "commands" | "settings" | "scratchpad" | string;

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (v: CommandView) => void;
}

export function CommandPalette({ open, onClose, onNavigate }: Props) {
  const tasks = useTasks((s) => s.tasks);
  const notes = useTasks((s) => s.notes);
  const selectTask = useTasks((s) => s.selectTask);
  const selectNote = useTasks((s) => s.selectNote);
  const addNote = useTasks((s) => s.addNote);
  const getOrCreateDailyLog = useTasks((s) => s.getOrCreateDailyLog);
  const setQuickAddOpen = useTasks((s) => s.setQuickAddOpen);

  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo(() => {
    const navItems = [
      { id: "nav-today", type: "nav" as const, label: "Go to Dashboard", icon: LayoutDashboard, action: () => { onNavigate("today"); onClose(); } },
      { id: "nav-board", type: "nav" as const, label: "Go to Board", icon: KanbanSquare, action: () => { onNavigate("board"); onClose(); } },
      { id: "nav-all", type: "nav" as const, label: "Go to Tasks", icon: ListChecks, action: () => { onNavigate("all"); onClose(); } },
      { id: "nav-upcoming", type: "nav" as const, label: "Go to Upcoming", icon: CalendarDays, action: () => { onNavigate("upcoming"); onClose(); } },
      { id: "nav-notes", type: "nav" as const, label: "Go to Notes", icon: NotebookPen, action: () => { onNavigate("notes"); onClose(); } },
      { id: "nav-commands", type: "nav" as const, label: "Go to Commands", icon: Terminal, action: () => { onNavigate("commands"); onClose(); } },
      { id: "nav-scratchpad", type: "nav" as const, label: "Go to Scratchpad", icon: StickyNote, action: () => { onNavigate("scratchpad"); onClose(); } },
      { id: "nav-settings", type: "nav" as const, label: "Go to Settings", icon: Settings, action: () => { onNavigate("settings"); onClose(); } },
      { id: "create", type: "action" as const, label: "Create new task…", icon: Plus, action: () => { onClose(); setQuickAddOpen(true); } },
      { id: "create-note", type: "action" as const, label: "Create new note", icon: FileText, action: () => { const n = addNote({}); selectNote(n.id); onNavigate("notes"); onClose(); } },
      { id: "daily-log", type: "action" as const, label: "Open today's Daily Log", icon: Sunrise, action: () => { const n = getOrCreateDailyLog(); selectNote(n.id); onNavigate("notes"); onClose(); } },
    ];
    const matchesNav = navItems.filter((n) => !q || n.label.toLowerCase().includes(q.toLowerCase()));
    const taskMatches = q
      ? tasks
          .filter((t) => (t.title.toLowerCase().includes(q.toLowerCase()) || t.tags.some((tag) => tag.includes(q.toLowerCase()))))
          .slice(0, 5)
          .map((t) => ({
            id: `task-${t.id}`,
            type: "task" as const,
            label: t.title,
            icon: ListChecks,
            action: () => { selectTask(t.id); onClose(); },
            hint: t.status,
          }))
      : [];
    const noteMatches = q
      ? notes
          .filter((n) => (n.title.toLowerCase().includes(q.toLowerCase()) || n.content.toLowerCase().includes(q.toLowerCase())))
          .slice(0, 5)
          .map((n) => ({
            id: `note-${n.id}`,
            type: "note" as const,
            label: n.title,
            icon: FileText,
            action: () => { selectNote(n.id); onNavigate("notes"); onClose(); },
            hint: n.kind === "daily" ? "daily" : "note",
          }))
      : [];
    return [...matchesNav, ...taskMatches, ...noteMatches];
  }, [q, tasks, notes, onClose, onNavigate, selectTask, selectNote, addNote, getOrCreateDailyLog, setQuickAddOpen]);

  useEffect(() => { setIdx(0); }, [q]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); items[idx]?.action(); }
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-popover border border-border shadow-elev overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tasks or jump to…"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border bg-secondary text-muted-foreground">ESC</kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto scrollbar-thin py-1.5">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No results.</div>
          ) : (
            items.map((it, i) => {
              const Icon = it.icon;
              const active = i === idx;
              return (
                <button
                  key={it.id}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => it.action()}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 mx-1.5 rounded-lg text-left text-[13px] transition-colors",
                    active ? "bg-secondary text-foreground" : "text-foreground/80 hover:bg-secondary/60"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 truncate">{it.label}</span>
                  {"hint" in it && it.hint && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                      {it.hint}
                    </span>
                  )}
                  {active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
            <span className="inline-flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> select</span>
          </div>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}