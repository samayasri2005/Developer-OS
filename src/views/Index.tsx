import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Bell, Moon, Sun, Settings } from "lucide-react";
import { FlowSidebar, type View } from "@/components/flow/Sidebar";
import { TodayView } from "@/components/flow/TodayView";
import { Board } from "@/components/flow/Board";
import { AllTasks } from "@/components/flow/AllTasks";
import { QuickAdd } from "@/components/flow/QuickAdd";
import { TaskDetail } from "@/components/flow/TaskDetail";
import { CommandPalette, type CommandView } from "@/components/flow/CommandPalette";
import { NotesView } from "@/components/flow/NotesView";
import { CommandsView } from "@/components/flow/CommandsView";
import { GoalsView } from "@/components/flow/GoalsView";
import SettingsView from "@/views/Settings";
import { ScratchpadView } from "@/components/flow/ScratchpadView";
import { ProjectWorkspace } from "@/components/flow/ProjectWorkspace";
import { CalendarView } from "@/components/flow/CalendarView";
import { PomodoroWidget } from "@/components/flow/PomodoroWidget";
import { StandupGenerator } from "@/components/flow/StandupGenerator";
import { useTasks } from "@/store/tasks";

interface Props {
  initialView?: View;
}

const Index = ({ initialView = "today" }: Props) => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>(initialView);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const searchRef = useRef<HTMLButtonElement>(null);
  const setQuickAddOpen = useTasks((s) => s.setQuickAddOpen);
  const reset = useTasks((s) => s.resetRecurringIfNeeded);
  const selectedTaskId = useTasks((s) => s.selectedTaskId);
  const selectTask = useTasks((s) => s.selectTask);
  const toggleDone = useTasks((s) => s.toggleDone);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => { reset(); }, [reset]);

  useEffect(() => {
    const onNav = (e: Event) => {
      const v = (e as CustomEvent).detail as View;
      if (v) setView(v);
    };
    const onBidiNav = (e: Event) => {
      const targetName = (e as CustomEvent).detail as string;
      const state = useTasks.getState();
      const proj = state.projects.find((p) => p.name.toLowerCase() === targetName.toLowerCase());
      if (proj) {
        setView(`project:${proj.id}`);
        return;
      }
      const note = state.notes.find((n) => n.title.toLowerCase() === targetName.toLowerCase());
      if (note) {
        setView("notes");
        state.selectNote(note.id);
        return;
      }
      // If nothing found, just console.warn for now
      console.warn(`Bidirectional link target "${targetName}" not found.`);
    };
    window.addEventListener("flow:navigate", onNav);
    window.addEventListener("flow:navigate-bidi", onBidiNav);
    return () => {
      window.removeEventListener("flow:navigate", onNav);
      window.removeEventListener("flow:navigate-bidi", onBidiNav);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      // ⌘K / Ctrl+K — always works
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (inField) return;
      if (e.key === "/") { e.preventDefault(); setPaletteOpen(true); }
      if (e.key.toLowerCase() === "c") { e.preventDefault(); setQuickAddOpen(true); }
      if (e.key.toLowerCase() === "d" && selectedTaskId) { e.preventDefault(); toggleDone(selectedTaskId); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setQuickAddOpen, selectedTaskId, toggleDone]);

  const renderView = () => {
    if (view === "today") return <TodayView />;
    if (view === "calendar") return <CalendarView />;
    if (view === "upcoming") return <AllTasks scope="upcoming" />;
    if (view === "board") return <Board />;
    if (view === "all") return <AllTasks scope="all" />;
    if (view === "notes") return <NotesView />;
    if (view === "commands") return <CommandsView />;
    if (view === "goals") return <GoalsView />;
    if (view === "settings") return <SettingsView />;
    if (view === "digest") return <StandupGenerator />;
    if (view === "scratchpad") return <ScratchpadView />;
    if (typeof view === "string" && view.startsWith("project:")) {
      return <ProjectWorkspace projectId={view.split(":")[1]} />;
    }
    if (typeof view === "string" && view.startsWith("folder:")) return <AllTasks folderFilter={view.split(":")[1]} />;
    return <TodayView />;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <FlowSidebar
        view={view}
        onChange={(v) => {
          setView(v);
          selectTask(null);
          if (v === "commands") {
            navigate("/commands");
          } else if (v === "calendar") {
            navigate("/calendar");
          } else if (v === "settings") {
            navigate("/settings");
          } else if (v === "digest") {
            navigate("/digest");
          } else {
            navigate("/");
          }
        }}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-8 pt-6 pb-4 border-b border-border/50">
          <button
            ref={searchRef}
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2.5 w-[360px] px-3.5 py-2 rounded-lg bg-card border border-border/70 hover:border-border transition-colors text-sm text-muted-foreground"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left text-[13px]">Search or jump to…</span>
            <kbd className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border bg-secondary text-muted-foreground">⌘K</kbd>
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New task
          </button>
          <div className="h-6 w-px bg-border mx-1" />
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <button onClick={() => { setView("settings"); navigate("/settings"); }} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin px-8 pb-10 pt-6">
            {renderView()}
          </div>
          {selectedTaskId && (
            <div className="hidden lg:block w-[400px] shrink-0 h-full overflow-y-auto bg-card">
              <TaskDetail isInline />
            </div>
          )}
        </div>
      </main>

      <QuickAdd />
      <div className="lg:hidden">
        <TaskDetail />
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(v: CommandView) => {
          setView(v);
          selectTask(null);
          if (v === "commands") {
            navigate("/commands");
          } else if (v === "calendar") {
            navigate("/calendar");
          } else if (v === "settings") {
            navigate("/settings");
          } else if (v === "digest") {
            navigate("/digest");
          } else {
            navigate("/");
          }
        }}
      />

      <button
        onClick={() => setQuickAddOpen(true)}
        className="fixed bottom-6 right-6 sm:hidden h-12 w-12 rounded-full bg-gradient-primary shadow-glow grid place-items-center text-primary-foreground z-40"
        aria-label="Create task"
      >
        <Plus className="h-5 w-5" />
      </button>
      
      <PomodoroWidget />
    </div>
  );
};

export default Index;
