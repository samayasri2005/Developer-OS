import { useState, useMemo } from "react";
import { useTasks } from "@/store/tasks";
import { 
  Clipboard, CheckCircle2, ListTodo, Flame, Calendar, Sparkles, 
  Copy, Check, FileText, Clock, ChevronRight, RefreshCw, BarChart2 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, subDays, parseISO } from "date-fns";

type TimeRange = "today" | "yesterday" | "week";

export function StandupGenerator() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [copied, setCopied] = useState(false);

  const tasks = useTasks((s) => s.tasks);
  const notes = useTasks((s) => s.notes);
  const projects = useTasks((s) => s.projects);

  // Filter tasks based on time range
  const filterDateMatch = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const date = parseISO(dateStr);
      if (timeRange === "today") {
        return isToday(date);
      } else if (timeRange === "yesterday") {
        return isYesterday(date);
      } else if (timeRange === "week") {
        const sevenDaysAgo = subDays(new Date(), 7);
        return date >= sevenDaysAgo;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  // 1. Completed Tasks
  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "done" && filterDateMatch(t.completedAt || t.createdAt));
  }, [tasks, timeRange]);

  // 2. Pending Tasks
  const pendingTasks = useMemo(() => {
    // Show active tasks (not done) that are high priority or in progress ("doing")
    return tasks.filter((t) => t.status !== "done" && (t.status === "doing" || t.priority === "high"));
  }, [tasks]);

  // 3. Notes created/updated
  const activeNotes = useMemo(() => {
    return notes.filter((n) => filterDateMatch(n.updatedAt || n.createdAt));
  }, [notes, timeRange]);

  // 4. Pomodoro focus sessions from localStorage
  const focusData = useMemo(() => {
    try {
      const logsStr = localStorage.getItem("dev_os_focus_logs") || "[]";
      const logs = JSON.parse(logsStr);
      
      const filtered = logs.filter((log: any) => {
        if (!log.timestamp) return false;
        try {
          const date = new Date(log.timestamp);
          if (timeRange === "today") {
            return isToday(date);
          } else if (timeRange === "yesterday") {
            return isYesterday(date);
          } else if (timeRange === "week") {
            const sevenDaysAgo = subDays(new Date(), 7);
            return date >= sevenDaysAgo;
          }
        } catch {
          return false;
        }
        return false;
      });

      const totalCycles = filtered.length;
      const totalMinutes = filtered.reduce((acc: number, log: any) => acc + (log.durationMinutes || 25), 0);
      return { totalCycles, totalMinutes };
    } catch {
      return { totalCycles: 0, totalMinutes: 0 };
    }
  }, [timeRange]);

  // Generate markdown output
  const markdownText = useMemo(() => {
    const dateStr = new Date().toLocaleDateString(undefined, { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });

    const rangeLabel = timeRange === "today" ? "Today" : timeRange === "yesterday" ? "Yesterday" : "Last 7 Days";

    let md = `## 🚀 Developer Activity Digest (${rangeLabel}) - ${dateStr}\n\n`;

    md += `### ⏱️ Focus Time & Productivity\n`;
    md += `- Completed **${focusData.totalCycles}** Pomodoro focus cycle(s) (${focusData.totalMinutes} minutes of deep focus).\n\n`;

    md += `### 🟢 Completed Work\n`;
    if (completedTasks.length === 0) {
      md += `- *No tasks completed in this period.*\n`;
    } else {
      completedTasks.forEach((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        const projLabel = proj ? ` [${proj.name}]` : "";
        md += `- [x] ${t.title}${projLabel}\n`;
      });
    }
    md += `\n`;

    md += `### 🟡 Active / In Progress\n`;
    if (pendingTasks.length === 0) {
      md += `- *No active tasks pending currently.*\n`;
    } else {
      pendingTasks.forEach((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        const projLabel = proj ? ` [${proj.name}]` : "";
        md += `- [ ] ${t.title}${projLabel} (${t.status})\n`;
      });
    }
    md += `\n`;

    md += `### 📝 Captured Notes & Knowledge\n`;
    if (activeNotes.length === 0) {
      md += `- *No notes captured in this period.*\n`;
    } else {
      activeNotes.forEach((n) => {
        const proj = projects.find((p) => p.id === n.projectId);
        const projLabel = proj ? ` [${proj.name}]` : "";
        md += `- **${n.title || "Untitled Note"}**${projLabel}\n`;
      });
    }

    return md;
  }, [timeRange, completedTasks, pendingTasks, activeNotes, focusData, projects]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(markdownText);
    setCopied(true);
    toast.success("Copied Activity Digest to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1280px] pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Activity Digest</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aggregate your completed tasks, deep focus sessions, and captured notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-muted/30 border border-border p-1 rounded-lg">
            {(["today", "yesterday", "week"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all",
                  timeRange === r
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-xs font-semibold hover:opacity-90 transition-all shadow-glow"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy Standup Markdown
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Card */}
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 shadow-card space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Metrics Snapshot</h2>
            </div>
            
            <div className="space-y-4">
              {/* Focus Time metric */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/35 border border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Deep Focus</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{focusData.totalMinutes} mins</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">{focusData.totalCycles} cycles</span>
                </div>
              </div>

              {/* Tasks completed metric */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/35 border border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tasks Done</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{completedTasks.length} tasks</p>
                  </div>
                </div>
              </div>

              {/* Notes created metric */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/35 border border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes Created</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{activeNotes.length} notes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5 justify-center">
            <Clock className="h-3 w-3" />
            <span>Updated in real-time from workspace data.</span>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Activity Log Breakdown</h2>
          </div>

          <div className="space-y-6">
            {/* Completed Section */}
            <div>
              <h3 className="text-xs font-semibold text-green-500 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed Tasks
              </h3>
              {completedTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-5">No tasks completed in this timeframe.</p>
              ) : (
                <ul className="space-y-1.5 pl-5 list-disc text-xs text-foreground/90">
                  {completedTasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <li key={t.id}>
                        <span>{t.title}</span>
                        {proj && (
                          <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono ml-2 border border-border/60">
                            {proj.name}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Pending Section */}
            <div>
              <h3 className="text-xs font-semibold text-amber-500 flex items-center gap-1.5 mb-2">
                <ListTodo className="h-3.5 w-3.5" /> Active Tasks
              </h3>
              {pendingTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-5">No pending active tasks found.</p>
              ) : (
                <ul className="space-y-1.5 pl-5 list-disc text-xs text-foreground/90">
                  {pendingTasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <li key={t.id}>
                        <span>{t.title}</span>
                        {proj && (
                          <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono ml-2 border border-border/60">
                            {proj.name}
                          </span>
                        )}
                        <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-mono ml-2 capitalize">
                          {t.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Notes Section */}
            <div>
              <h3 className="text-xs font-semibold text-cyan-500 flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5" /> Knowledge & Notes Captured
              </h3>
              {activeNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-5">No notes modified in this timeframe.</p>
              ) : (
                <ul className="space-y-1.5 pl-5 list-disc text-xs text-foreground/90">
                  {activeNotes.map((n) => {
                    const proj = projects.find((p) => p.id === n.projectId);
                    return (
                      <li key={n.id}>
                        <span className="font-medium">{n.title || "Untitled Note"}</span>
                        {proj && (
                          <span className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono ml-2 border border-border/60">
                            {proj.name}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
