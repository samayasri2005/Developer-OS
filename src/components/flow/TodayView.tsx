import { useMemo, useState, useEffect } from "react";
import { format, isSameDay, parseISO, isToday as isDateToday } from "date-fns";
import {
  CheckCircle2, Circle, FileText, Link2, Timer, ChevronLeft, ChevronRight, Plus,
  StickyNote, Cpu, Terminal, Globe, ExternalLink, Sparkles, Activity, Trash2, Copy, Check, X
} from "lucide-react";
import { isDueToday, isOverdue, useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";
import { toast } from "sonner";
import { TaskRow } from "./TaskRow";

const priorityPill: Record<Priority, string> = {
  high: "bg-priority-high/10 text-priority-high border-priority-high/20",
  medium: "bg-priority-medium/10 text-priority-medium border-priority-medium/20",
  low: "bg-status-done/10 text-status-done border-status-done/20",
};

const tileTints = ["bg-tile-pink", "bg-tile-sky", "bg-tile-peach", "bg-tile-mint"];

interface SessionState {
  lastActiveProjectId?: string | null;
  lastEditedNoteId?: string | null;
  lastCopiedCommand?: string | null;
  lastViewedWorkspace?: string | null;
}

interface PinnedShortcut {
  id: string;
  title: string;
  url: string;
}

export function TodayView() {
  const tasks = useTasks((s) => s.tasks);
  const addTask = useTasks((s) => s.addTask);
  const toggleDone = useTasks((s) => s.toggleDone);
  const selectTask = useTasks((s) => s.selectTask);
  const projects = useTasks((s) => s.projects);
  const selectProject = useTasks((s) => s.selectProject);
  const notes = useTasks((s) => s.notes);
  const selectNote = useTasks((s) => s.selectNote);
  const activities = useTasks((s) => s.activities);
  const registerCopiedCommand = useTasks((s) => s.registerCopiedCommand);

  // States
  const [taskInput, setTaskInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [quickNotes, setQuickNotes] = useState<{ id: string; text: string }[]>([
    { id: "n1", text: "Idea: script to automate staging environment health checks" },
    { id: "n2", text: "Review database indexes for task linking queries" },
    { id: "n3", text: "Configure Vite proxy config for local API dev" },
  ]);

  const [session, setSession] = useState<SessionState>({});
  const [shortcuts, setShortcuts] = useState<PinnedShortcut[]>([]);
  const [shortcutTitle, setShortcutTitle] = useState("");
  const [shortcutUrl, setShortcutUrl] = useState("");
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [copiedShortcutId, setCopiedShortcutId] = useState<string | null>(null);

  // Load Session & Shortcuts
  useEffect(() => {
    const loadSession = () => {
      try {
        const data = localStorage.getItem("dev_os_session");
        if (data) setSession(JSON.parse(data));
      } catch (e) {
        console.error("Failed to load session", e);
      }
    };

    const loadShortcuts = () => {
      try {
        const data = localStorage.getItem("dev_os_shortcuts");
        if (data) {
          setShortcuts(JSON.parse(data));
        } else {
          // Default shortcuts
          const defaults = [
            { id: "s1", title: "GitHub Console", url: "https://github.com" },
            { id: "s2", title: "Vercel Deployments", url: "https://vercel.com" },
            { id: "s3", title: "Firebase Console", url: "https://console.firebase.google.com" },
          ];
          setShortcuts(defaults);
          localStorage.setItem("dev_os_shortcuts", JSON.stringify(defaults));
        }
      } catch (e) {
        console.error(e);
      }
    };

    loadSession();
    loadShortcuts();

    // Listen for custom navigation event to refresh session data
    window.addEventListener("focus", loadSession);
    return () => window.removeEventListener("focus", loadSession);
  }, []);

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcutUrl.trim() || !shortcutTitle.trim()) return;

    let formattedUrl = shortcutUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    const newShortcut: PinnedShortcut = {
      id: Math.random().toString(36).slice(2, 9),
      title: shortcutTitle.trim(),
      url: formattedUrl,
    };

    const updated = [...shortcuts, newShortcut];
    setShortcuts(updated);
    localStorage.setItem("dev_os_shortcuts", JSON.stringify(updated));
    setShortcutTitle("");
    setShortcutUrl("");
    setShowAddShortcut(false);
    toast.success("Shortcut pinned successfully");
  };

  const handleDeleteShortcut = (id: string) => {
    const updated = shortcuts.filter((s) => s.id !== id);
    setShortcuts(updated);
    localStorage.setItem("dev_os_shortcuts", JSON.stringify(updated));
    toast.success("Shortcut unpinned");
  };

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    registerCopiedCommand(text);
    setCopiedShortcutId("last-cmd");
    toast.success("CLI command copied");
    setTimeout(() => setCopiedShortcutId(null), 1500);
  };

  // Navigations
  const handleNavProject = (id: string) => {
    selectProject(id);
    window.dispatchEvent(new CustomEvent("flow:navigate", { detail: `project:${id}` }));
  };

  const handleNavNote = (id: string) => {
    selectNote(id);
    window.dispatchEvent(new CustomEvent("flow:navigate", { detail: "notes" }));
  };

  const handleNavWorkspace = (ws: string) => {
    if (ws.startsWith("project:")) {
      const id = ws.split(":")[1];
      selectProject(id);
    }
    window.dispatchEvent(new CustomEvent("flow:navigate", { detail: ws }));
  };

  // Filter lists
  const todays = useMemo(() => {
    return tasks.filter((t) => isDueToday(t) || isOverdue(t) || (!t.dueDate && t.status !== "done")).slice(0, 6);
  }, [tasks]);

  const completedToday = todays.filter((t) => t.status === "done").length;
  const totalActive = tasks.filter((t) => t.status !== "done").length;
  const overdueTasksCount = tasks.filter((t) => isOverdue(t)).length;

  const recentDeploys = useMemo(() => {
    return activities.filter((a) => a.type === "deployment_opened" || a.message.toLowerCase().includes("deploy")).length;
  }, [activities]);

  const lastActiveProject = useMemo(() => {
    if (!session.lastActiveProjectId) return null;
    return projects.find((p) => p.id === session.lastActiveProjectId);
  }, [projects, session.lastActiveProjectId]);

  const lastActiveNote = useMemo(() => {
    if (!session.lastEditedNoteId) return null;
    return notes.find((n) => n.id === session.lastEditedNoteId);
  }, [notes, session.lastEditedNoteId]);



  const stats = [
    { label: "Active Projects", value: projects.length, icon: Cpu, color: "tile-purple" as const },
    { label: "Pending Tasks", value: totalActive, icon: FileText, color: "tile-blue" as const },
    { label: "Overdue Tasks", value: overdueTasksCount, icon: Timer, color: "tile-orange" as const },
    { label: "Logged Deploys", value: recentDeploys, icon: Globe, color: "tile-green" as const },
  ];

  return (
    <div className="space-y-6 pb-10 max-w-[1280px]">
      {/* Welcome Heading */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Workstation Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A developer's command center connecting execution status, active projects, and shortcuts.
          </p>
        </div>
        <div className="text-[11px] font-mono bg-secondary px-2.5 py-1 rounded border border-border/80 text-muted-foreground">
          SYS TIME: {new Date().toLocaleDateString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Resume Work Session Banner */}
      {(lastActiveProject || lastActiveNote || session.lastCopiedCommand || session.lastViewedWorkspace) && (
        <section className="rounded-xl border border-cyan-500/20 bg-cyan-950/5 dark:bg-cyan-950/10 p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            <Sparkles className="h-4 w-4 text-cyan-500" />
            <span>Resume Work Session</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Merged Active Work Workspace */}
            {lastActiveProject && session.lastViewedWorkspace === `project:${lastActiveProject.id}` && (
              <div
                className="bg-card border border-border/50 hover:border-cyan-500/30 p-3 rounded-lg hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">Active Work Workspace</span>
                  <span className="text-xs font-semibold text-foreground truncate mt-1 block">{lastActiveProject.name}</span>
                  <p className="text-[10px] text-muted-foreground truncate mt-1">{lastActiveProject.description || "Active engineering workspace."}</p>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleNavProject(lastActiveProject.id)}
                    className="text-[10px] text-primary hover:underline font-semibold text-left"
                  >
                    Open Workspace &rarr;
                  </button>
                  <span className="text-[10px] text-muted-foreground">|</span>
                  <button
                    onClick={() => handleNavWorkspace(session.lastViewedWorkspace!)}
                    className="text-[10px] text-primary hover:underline font-semibold text-left"
                  >
                    Go to View
                  </button>
                </div>
              </div>
            )}

            {/* Active Project (Unmerged) */}
            {lastActiveProject && session.lastViewedWorkspace !== `project:${lastActiveProject.id}` && (
              <div
                onClick={() => handleNavProject(lastActiveProject.id)}
                className="bg-card border border-border/50 hover:border-cyan-500/30 p-3 rounded-lg cursor-pointer hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Current Project</span>
                  <span className="text-xs font-semibold text-foreground truncate mt-1 block">{lastActiveProject.name}</span>
                </div>
                <span className="text-[10px] text-primary hover:underline mt-2 inline-flex items-center gap-0.5">
                  Open Workspace &rarr;
                </span>
              </div>
            )}

            {/* Active Note */}
            {lastActiveNote && (
              <div
                onClick={() => handleNavNote(lastActiveNote.id)}
                className="bg-card border border-border/50 hover:border-cyan-500/30 p-3 rounded-lg cursor-pointer hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Recent Note</span>
                  <span className="text-xs font-semibold text-foreground truncate mt-1 block">{lastActiveNote.title}</span>
                </div>
                <span className="text-[10px] text-primary hover:underline mt-2 inline-flex items-center gap-0.5">
                  Open Editor &rarr;
                </span>
              </div>
            )}

            {/* Last Command */}
            {session.lastCopiedCommand && (
              <div className="bg-card border border-border/50 p-3 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Last Copied Command</span>
                  <code className="text-[11px] font-mono text-cyan-500 truncate mt-1 block">
                    {session.lastCopiedCommand}
                  </code>
                </div>
                <button
                  onClick={() => handleCopyCommand(session.lastCopiedCommand!)}
                  className="text-[10px] text-cyan-500 hover:text-cyan-600 mt-2 flex items-center gap-1 font-semibold"
                >
                  {copiedShortcutId === "last-cmd" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  Copy command again
                </button>
              </div>
            )}

            {/* Last Workspace (Unmerged) */}
            {session.lastViewedWorkspace && (!lastActiveProject || session.lastViewedWorkspace !== `project:${lastActiveProject.id}`) && (
              <div
                onClick={() => handleNavWorkspace(session.lastViewedWorkspace!)}
                className="bg-card border border-border/50 hover:border-cyan-500/30 p-3 rounded-lg cursor-pointer hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Last Workspace</span>
                  <span className="text-xs font-semibold text-foreground truncate mt-1 block capitalize">
                    {session.lastViewedWorkspace.replace("project:", "Project: ")}
                  </span>
                </div>
                <span className="text-[10px] text-primary hover:underline mt-2 inline-flex items-center gap-0.5">
                  Go to view &rarr;
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Workspace Status Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 hover:border-foreground/10 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="text-[28px] font-bold tracking-tight text-foreground mt-4 leading-none">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main Workspace Panels Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Tasks & Pinned Shortcuts */}
        <div className="lg:col-span-8 space-y-4">
          {/* Today's Tasks */}
          <section className="rounded-xl bg-card border border-border shadow-card p-5 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">Today's Active Tasks</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {completedToday}/{todays.length} completed today
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (taskInput.trim()) {
                  addTask({ title: taskInput.trim(), dueDate: new Date().toISOString() });
                  setTaskInput("");
                  toast.success("Task added to schedule");
                }
              }}
              className="flex items-center gap-2 mb-3"
            >
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a task for today and press Enter…"
                className="flex-1 text-[13px] bg-secondary border border-transparent rounded-md px-3 py-2 outline-none focus:bg-background focus:border-primary/40 placeholder:text-muted-foreground transition-colors"
              />
              <button
                type="submit"
                className="h-8 w-8 grid place-items-center rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>

            <div className="space-y-1 content-start">
              {todays.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-10">
                  No tasks scheduled for today. Add one above!
                </div>
              ) : (
                todays.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))
              )}
            </div>
          </section>

          {/* Pinned Operational Shortcuts */}
          <section className="rounded-xl bg-card border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">Pinned Shortcuts</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Quick access to infrastructure logs, repositories, and consoles.</p>
              </div>
              <button
                onClick={() => setShowAddShortcut(!showAddShortcut)}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                {showAddShortcut ? "Cancel" : "Add Shortcut"}
              </button>
            </div>

            {showAddShortcut && (
              <form onSubmit={handleAddShortcut} className="mb-4 p-3 border border-border/50 rounded-lg bg-secondary/30 flex gap-2 items-center flex-wrap">
                <input
                  value={shortcutTitle}
                  onChange={(e) => setShortcutTitle(e.target.value)}
                  placeholder="Title (e.g., Staging Logs)"
                  required
                  className="text-xs bg-card border border-border rounded px-2.5 py-1.5 outline-none flex-1 min-w-[120px]"
                />
                <input
                  value={shortcutUrl}
                  onChange={(e) => setShortcutUrl(e.target.value)}
                  placeholder="URL"
                  required
                  className="text-xs bg-card border border-border rounded px-2.5 py-1.5 outline-none flex-2 min-w-[180px]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-foreground text-background text-xs font-semibold rounded hover:opacity-90 transition-opacity"
                >
                  Pin Link
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {shortcuts.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/50 bg-secondary/10 hover:bg-secondary/40 transition-colors"
                >
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-0 flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    <span className="truncate">{s.title}</span>
                  </a>
                  <button
                    onClick={() => handleDeleteShortcut(s.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label="Remove shortcut"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Recent Activity & Quick Notes / Calendar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Global Activity stream logs */}
          <section className="rounded-xl bg-card border border-border shadow-card p-5 flex flex-col">
            <div className="flex items-center gap-1.5 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-[14px] font-semibold tracking-tight">Recent Activity Stream</h3>
            </div>

            <div className="space-y-4 relative pl-3 border-l border-border/50 ml-1.5 flex-1 content-start py-1">
              {activities.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-8 border border-dashed border-border/65 rounded-lg">
                  No workstation logs captured. Complete tasks or copy commands to generate logs!
                </div>
              ) : (
                activities.slice(0, 6).map((log) => {
                  return (
                    <div key={log.id} className="relative flex gap-2.5 items-start">
                      {/* Node point */}
                      <span className="absolute -left-[16.5px] top-1.5 h-2 w-2 rounded-full bg-primary border border-background shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-foreground leading-normal">{log.message}</p>
                        <span className="text-[9px] text-muted-foreground font-mono mt-0.5 block">
                          {format(parseISO(log.timestamp), "HH:mm:ss · MMM dd")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Quick Notes */}
          <section className="rounded-xl bg-card border border-border shadow-card p-5 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold tracking-tight">Rapid Ideas</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{quickNotes.length} ideas cached</p>
              </div>
              <StickyNote className="h-4 w-4 text-muted-foreground" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (noteInput.trim()) {
                  setQuickNotes([{ id: Math.random().toString(36).slice(2), text: noteInput.trim() }, ...quickNotes]);
                  setNoteInput("");
                  toast.success("Idea cached");
                }
              }}
              className="flex items-center gap-2 mb-3"
            >
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Cache a project idea..."
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
              {quickNotes.map((n, i) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-lg p-3 text-[12px] leading-snug text-foreground/80 border border-border/60 hover:shadow-card transition-all cursor-default relative group",
                    tileTints[i % tileTints.length]
                  )}
                >
                  <span>{n.text}</span>
                  <button
                    onClick={() => setQuickNotes(quickNotes.filter((x) => x.id !== n.id))}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-background transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>


        </div>
      </div>
    </div>
  );
}
