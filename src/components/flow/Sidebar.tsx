import { useState } from "react";
import {
  KanbanSquare, ListChecks, Folder as FolderIcon,
  Plus, CalendarDays, LayoutDashboard,
  Settings, NotebookPen, Terminal, Code2,
  Cpu, StickyNote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasks } from "@/store/tasks";
import { useAuth } from "@/contexts/AuthContext";

export type View = "today" | "upcoming" | "board" | "all" | "notes" | "commands" | "settings" | "scratchpad" | string;

interface Props {
  view: View;
  onChange: (v: View) => void;
}

export function FlowSidebar({ view, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [addingProject, setAddingProject] = useState(false);
  const [projName, setProjName] = useState("");

  const folders = useTasks((s) => s.folders);
  const addFolder = useTasks((s) => s.addFolder);
  const projects = useTasks((s) => s.projects);
  const addProject = useTasks((s) => s.addProject);
  const selectProject = useTasks((s) => s.selectProject);
  const tasks = useTasks((s) => s.tasks);
  const { user } = useAuth();

  const NavItem = ({
    id, label, icon: Icon, count,
  }: { id: View; label: string; icon: any; count?: number }) => {
    const isActive = view === id;
    return (
      <button
        onClick={() => {
          if (typeof id === "string" && id.startsWith("project:")) {
            selectProject(id.split(":")[1]);
          } else {
            selectProject(null);
          }
          onChange(id);
        }}
        className={cn(
          "group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors no-tap-highlight",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
        <span className="flex-1 text-left truncate">{label}</span>
        {typeof count === "number" && count > 0 && (
          <span className={cn(
            "text-[10px] tabular-nums px-1.5 py-0.5 rounded font-semibold",
            isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
          )}>{count}</span>
        )}
      </button>
    );
  };

  const SectionLabel = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="pt-4 pb-1.5 px-2 flex items-center justify-between">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/70">{children}</span>
      {action}
    </div>
  );

  const overdueCount = tasks.filter((t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date(new Date().toDateString())).length;
  const todayCount = tasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== "done").length;

  return (
    <aside className="relative flex flex-col h-full w-[244px] shrink-0 px-3 py-5 bg-sidebar border-r border-sidebar-border">
      {/* App header */}
      <div className="px-2 mb-2 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-md bg-gradient-primary grid place-items-center text-primary-foreground shrink-0">
          <Code2 className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight">Developer OS</div>
          <div className="text-[10px] text-muted-foreground">Personal workspace</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin mt-2">
        <SectionLabel>Overview</SectionLabel>
        <div className="space-y-0.5">
          <NavItem id="today" label="Dashboard" icon={LayoutDashboard} />
          <NavItem id="board" label="Board" icon={KanbanSquare} />
          <NavItem id="all" label="Tasks" icon={ListChecks} count={tasks.filter((t) => !t.projectId && t.status !== "done").length} />
          <NavItem id="upcoming" label="Upcoming" icon={CalendarDays} count={todayCount + overdueCount} />
          <NavItem id="notes" label="Notes" icon={NotebookPen} />
          <NavItem id="commands" label="Commands" icon={Terminal} />
          <NavItem id="scratchpad" label="Scratchpad" icon={StickyNote} />
        </div>

        <SectionLabel
          action={
            <button
              onClick={() => setAddingProject((v) => !v)}
              className="h-5 w-5 grid place-items-center rounded-md hover:bg-sidebar-accent text-muted-foreground"
              aria-label="Add project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          }
        >
          Projects
        </SectionLabel>

        {addingProject && (
          <form
            className="px-2 pb-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (projName.trim()) {
                addProject(projName.trim());
                setProjName("");
                setAddingProject(false);
              }
            }}
          >
            <input
              autoFocus
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              placeholder="Project name"
              className="w-full text-xs bg-secondary border border-border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
            />
          </form>
        )}

        <div className="space-y-0.5">
          {projects.length === 0 ? (
            <div className="px-3 py-1.5 text-[11px] text-muted-foreground">No projects yet</div>
          ) : (
            projects.map((p) => (
              <NavItem
                key={p.id}
                id={`project:${p.id}`}
                label={p.name}
                icon={Cpu}
                count={tasks.filter((t) => t.projectId === p.id && t.status !== "done").length}
              />
            ))
          )}
        </div>

        <SectionLabel
          action={
            <button
              onClick={() => setAdding((v) => !v)}
              className="h-5 w-5 grid place-items-center rounded-md hover:bg-sidebar-accent text-muted-foreground"
              aria-label="Add folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          }
        >
          Folders
        </SectionLabel>

        {adding && (
          <form
            className="px-2 pb-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) { addFolder(name.trim()); setName(""); setAdding(false); }
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              className="w-full text-xs bg-secondary border border-border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
            />
          </form>
        )}

        <div className="space-y-0.5">
          {folders.length === 0 ? (
            <div className="px-3 py-1.5 text-[11px] text-muted-foreground">No folders yet</div>
          ) : (
            folders.map((f) => (
              <NavItem
                key={f.id}
                id={`folder:${f.id}`}
                label={f.name}
                icon={FolderIcon}
                count={tasks.filter((t) => t.folder === f.id && t.status !== "done").length}
              />
            ))
          )}
        </div>
      </nav>

      {/* Profile / footer */}
      <div className="mt-3 pt-3 border-t border-sidebar-border px-1">
        <button
          onClick={() => {
            selectProject(null);
            onChange("settings");
          }}
          className={cn(
            "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left",
            view === "settings" && "bg-sidebar-accent"
          )}
        >
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-primary-foreground text-[11px] font-bold shrink-0">
            {(user?.displayName || user?.email || "D").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-[12px] font-semibold tracking-tight truncate">{user?.displayName || "Developer"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</div>
          </div>
          <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </div>
    </aside>
  );
}
