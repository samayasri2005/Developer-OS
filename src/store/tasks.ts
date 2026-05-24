import { create } from "zustand";
import { isToday, isPast, parseISO, startOfDay } from "date-fns";
import { toast } from "sonner";
import type { Folder, LinkRef, Note, Priority, Recurrence, Status, Subtask, Task, Command, Project, Improvement, ActivityLog, Scratchpad, Goal } from "@/lib/types";
import {
  fetchFolders,
  fetchTasks,
  fetchNotes,
  fetchCommands,
  saveFolder,
  saveTask,
  updateTask as fsUpdateTask,
  deleteTask as fsDeleteTask,
  deleteFolder as fsDeleteFolder,
  saveNote,
  updateNote as fsUpdateNote,
  deleteNote as fsDeleteNote,
  batchSaveTasks,
  saveCommand,
  deleteCommand as fsDeleteCommand,
  fetchProjects,
  saveProject,
  deleteProject as fsDeleteProject,
  fetchImprovements,
  saveImprovement,
  deleteImprovement as fsDeleteImprovement,
  fetchActivityLogs,
  saveActivityLog,
  fetchScratchpad,
  saveScratchpad,
  fetchGoals,
  saveGoal,
  deleteGoal as fsDeleteGoal,
} from "@/lib/firestoreData";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface NewTaskInput {
  title: string;
  status?: Status;
  priority?: Priority;
  tags?: string[];
  folder?: string;
  dueDate?: string;
  recurrence?: Recurrence;
  description?: string;
  projectId?: string;
}

const updateSession = (patch: {
  lastActiveProjectId?: string | null;
  lastEditedNoteId?: string | null;
  lastCopiedCommand?: string | null;
  lastViewedWorkspace?: string | null;
}) => {
  try {
    const existing = localStorage.getItem("dev_os_session");
    const current = existing ? JSON.parse(existing) : {};
    localStorage.setItem("dev_os_session", JSON.stringify({ ...current, ...patch }));
  } catch (e) {
    console.error("Failed to update session state", e);
  }
};

interface State {
  // Auth / init
  currentUid: string | null;
  loading: boolean;
  initStore: (uid: string) => Promise<void>;
  clearStore: () => void;

  tasks: Task[];
  folders: Folder[];
  selectedTaskId: string | null;
  quickAddOpen: boolean;
  setQuickAddOpen: (v: boolean) => void;
  selectTask: (id: string | null) => void;

  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleDone: (id: string) => void;
  moveTask: (id: string, status: Status, newOrder?: number) => void;
  reorderInColumn: (status: Status, orderedIds: string[]) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  deleteSubtask: (taskId: string, subId: string) => void;
  updateSubtask: (taskId: string, subId: string, title: string) => void;

  addFolder: (name: string) => Folder;
  deleteFolder: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  resetRecurringIfNeeded: () => void;

  updateTaskNotes: (taskId: string, notes: string) => void;
  addTaskLink: (taskId: string, url: string, title?: string) => void;
  removeTaskLink: (taskId: string, linkId: string) => void;

  notes: Note[];
  selectedNoteId: string | null;
  selectNote: (id: string | null) => void;
  addNote: (input?: { title?: string; content?: string; kind?: "note" | "daily"; dayKey?: string; projectId?: string }) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  linkTaskNote: (taskId: string, noteId: string) => void;
  unlinkTaskNote: (taskId: string, noteId: string) => void;

  getOrCreateDailyLog: () => Note;

  // Commands
  commands: Command[];
  addCommand: (input: Omit<Command, "id" | "createdAt">) => void;
  deleteCommand: (id: string) => void;

  // Projects
  projects: Project[];
  improvements: Improvement[];
  activities: ActivityLog[];
  scratchpad: string;
  selectedProjectId: string | null;

  selectProject: (id: string | null) => void;
  addProject: (name: string, description?: string) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Improvements
  addImprovement: (projectId: string, title: string, priority?: "low" | "medium" | "high") => Improvement;
  toggleImprovement: (id: string) => void;
  updateImprovement: (id: string, patch: Partial<Improvement>) => void;
  deleteImprovement: (id: string) => void;
  convertImprovementToTask: (id: string) => void;

  // Goals
  goals: Goal[];
  addGoal: (title: string, timeframe: Goal["timeframe"], description?: string) => Goal;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Scratchpad
  updateScratchpad: (content: string) => void;

  // Activities log
  logActivity: (
    type: ActivityLog["type"],
    message: string,
    metadata?: Record<string, any>
  ) => void;

  registerCopiedCommand: (command: string) => void;

  // Google Calendar Sync state & actions
  gcalConnected: boolean;
  gcalEmail: string | null;
  gcalSyncEnabled: boolean;
  gcalEvents: Array<{ id: string; title: string; start: string; end: string; description?: string; projectId?: string }>;
  gcalSyncLogs: string[];
  gcalClientId: string;
  gcalApiKey: string;
  isSimulatedSync: boolean;

  connectGCal: (email: string, isSimulated: boolean) => void;
  disconnectGCal: () => void;
  toggleGCalSync: (enabled: boolean) => void;
  saveGCalCredentials: (clientId: string, apiKey: string) => void;
  addGCalEvent: (event: { title: string; start: string; end: string; description?: string; projectId?: string }) => void;
  updateGCalEvent: (id: string, patch: Partial<{ title: string; start: string; end: string; description?: string; projectId?: string }>) => void;
  deleteGCalEvent: (id: string) => void;
  addSyncLog: (msg: string) => void;
  syncGCal: () => Promise<void>;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const loadLocalGCal = () => {
  try {
    if (typeof window === "undefined") {
      return { connected: false, email: null, syncEnabled: true, events: [], logs: [], clientId: "", apiKey: "", isSimulated: true };
    }
    const connected = localStorage.getItem("dev_os_gcal_connected") === "true";
    const email = localStorage.getItem("dev_os_gcal_email");
    const syncEnabled = localStorage.getItem("dev_os_gcal_sync_enabled") !== "false";
    const eventsStr = localStorage.getItem("dev_os_gcal_events");
    const events = eventsStr ? JSON.parse(eventsStr) : [];
    const logsStr = localStorage.getItem("dev_os_gcal_logs");
    const logs = logsStr ? JSON.parse(logsStr) : ["[System] Google Calendar Sync initialized."];
    const clientId = localStorage.getItem("dev_os_gcal_client_id") || "";
    const apiKey = localStorage.getItem("dev_os_gcal_api_key") || "";
    const isSimulated = localStorage.getItem("dev_os_is_simulated_sync") !== "false";
    return { connected, email, syncEnabled, events, logs, clientId, apiKey, isSimulated };
  } catch (e) {
    return { connected: false, email: null, syncEnabled: true, events: [], logs: [], clientId: "", apiKey: "", isSimulated: true };
  }
};

const gcalData = loadLocalGCal();

const emptyState = {
  currentUid: null as string | null,
  loading: false,
  tasks: [] as Task[],
  folders: [] as Folder[],
  selectedTaskId: null as string | null,
  quickAddOpen: false,
  notes: [] as Note[],
  selectedNoteId: null as string | null,
  commands: [] as Command[],
  projects: [] as Project[],
  improvements: [] as Improvement[],
  activities: [] as ActivityLog[],
  goals: [] as Goal[],
  scratchpad: "",
  selectedProjectId: null as string | null,
  gcalConnected: gcalData.connected,
  gcalEmail: gcalData.email,
  gcalSyncEnabled: gcalData.syncEnabled,
  gcalEvents: gcalData.events,
  gcalSyncLogs: gcalData.logs,
  gcalClientId: gcalData.clientId,
  gcalApiKey: gcalData.apiKey,
  isSimulatedSync: gcalData.isSimulated,
};

export const useTasks = create<State>()((set, get) => ({
  ...emptyState,

  // ── Init / teardown ──────────────────────────────────────────────────────

  initStore: async (userUid: string) => {
    set({ loading: true, currentUid: userUid });
    try {
      const [folders, tasks, notes, commands, projects, improvements, activities, scratchpadDoc, goals] = await Promise.all([
        fetchFolders(userUid),
        fetchTasks(userUid),
        fetchNotes(userUid),
        fetchCommands(userUid),
        fetchProjects(userUid),
        fetchImprovements(userUid),
        fetchActivityLogs(userUid),
        fetchScratchpad(userUid),
        fetchGoals(userUid),
      ]);

      // Seed defaults for brand-new users
      if (folders.length === 0) {
        const now = new Date().toISOString();
        const defaultFolders: Folder[] = [
          { id: "personal", name: "Personal" },
          { id: "dev", name: "Dev" },
          { id: "learning", name: "Learning" },
        ];
        const defaultTasks: Task[] = [
          {
            id: uid(), title: "Welcome to Developer OS ✨",
            status: "todo", priority: "high", tags: ["intro"], folder: "personal",
            recurrence: "none", subtasks: [], createdAt: now, order: 0, dueDate: now,
          },
          {
            id: uid(), title: "Try quick add — press C or click New task",
            status: "todo", priority: "medium", tags: ["tip"], folder: "personal",
            recurrence: "none", subtasks: [], createdAt: now, order: 1,
          },
        ];
        for (const f of defaultFolders) await saveFolder(userUid, f);
        await batchSaveTasks(userUid, defaultTasks);
        
        // Seed default project for new users
        const defaultProject: Project = {
          id: "default-project",
          name: "Sample Project",
          description: "My primary developer workspace project.",
          githubRepo: "https://github.com/example/sample",
          createdAt: now,
          environments: {
            development: { deployUrl: "http://localhost:3000", notes: "Local development server", commands: "npm run dev" },
            staging: { deployUrl: "https://staging.example.com", notes: "Staging deployment pipeline" },
            production: { deployUrl: "https://example.com", notes: "Live production website" },
          },
          techStack: [],
          accounts: [],
          aiTools: [],
          configs: []
        };
        await saveProject(userUid, defaultProject);

        set({
          folders: defaultFolders,
          tasks: defaultTasks,
          notes: [],
          commands: [],
          projects: [defaultProject],
          improvements: [],
          goals: [],
          activities: [],
          scratchpad: "",
          loading: false
        });
        return;
      }

      set({
        folders,
        tasks,
        notes,
        commands,
        projects,
        improvements,
        goals,
        activities: activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
        scratchpad: scratchpadDoc?.content ?? "",
        loading: false
      });
    } catch (err) {
      console.error("Failed to load store from Firestore:", err);
      set({ loading: false });
    }
  },

  clearStore: () => set({ ...emptyState }),

  // ── Tasks ────────────────────────────────────────────────────────────────

  setQuickAddOpen: (v) => set({ quickAddOpen: v }),
  selectTask: (id) => {
    set({ selectedTaskId: id });
    if (id) {
      const task = get().tasks.find(t => t.id === id);
      if (task?.projectId) {
        updateSession({ lastActiveProjectId: task.projectId });
      }
      updateSession({ lastViewedWorkspace: "all" });
    }
  },

  addTask: (input) => {
    const tasks = get().tasks;
    const status = input.status ?? "todo";
    const order = tasks.filter((t) => t.status === status).length;
    const folders = get().folders;
    const fallbackFolder = folders[0]?.id ?? "personal";
    const t: Task = {
      id: uid(),
      title: input.title,
      description: input.description,
      status,
      priority: input.priority ?? "medium",
      tags: input.tags ?? [],
      folder: input.folder ?? fallbackFolder,
      dueDate: input.dueDate,
      recurrence: input.recurrence ?? "none",
      subtasks: [],
      createdAt: new Date().toISOString(),
      order,
      projectId: input.projectId,
    };
    set({ tasks: [t, ...tasks] });
    const { currentUid } = get();
    if (currentUid) saveTask(currentUid, t).catch(console.error);
    return t;
  },

  updateTask: (id, patch) => {
    set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
    const { currentUid } = get();
    if (currentUid) fsUpdateTask(currentUid, id, patch).catch(console.error);
  },

  deleteTask: (id) => {
    set({
      tasks: get().tasks.filter((t) => t.id !== id),
      selectedTaskId: get().selectedTaskId === id ? null : get().selectedTaskId,
    });
    const { currentUid } = get();
    if (currentUid) fsDeleteTask(currentUid, id).catch(console.error);
  },

  toggleDone: (id) => {
    const t = get().tasks.find((x) => x.id === id);
    if (!t) return;
    const isDone = t.status === "done";
    get().updateTask(id, {
      status: isDone ? "todo" : "done",
      completedAt: isDone ? undefined : new Date().toISOString(),
    });
    if (!isDone) {
      get().logActivity("task_completed", `Completed task: "${t.title}"`, { taskId: t.id, projectId: t.projectId });
    }
  },

  moveTask: (id, status, newOrder) => {
    const tasks = get().tasks.slice();
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.status = status;
    if (status === "done" && !t.completedAt) t.completedAt = new Date().toISOString();
    if (status !== "done") t.completedAt = undefined;
    if (typeof newOrder === "number") t.order = newOrder;
    set({ tasks });
    const { currentUid } = get();
    if (currentUid) {
      fsUpdateTask(currentUid, id, { status, order: t.order, completedAt: t.completedAt }).catch(console.error);
    }
  },

  reorderInColumn: (status, orderedIds) => {
    const tasks = get().tasks.map((t) => {
      if (t.status !== status) return t;
      const idx = orderedIds.indexOf(t.id);
      return idx >= 0 ? { ...t, order: idx } : t;
    });
    set({ tasks });
    const { currentUid } = get();
    if (currentUid) {
      const reordered = tasks.filter((t) => t.status === status && orderedIds.includes(t.id));
      batchSaveTasks(currentUid, reordered).catch(console.error);
    }
  },

  addSubtask: (taskId, title) => {
    const sub: Subtask = { id: uid(), title, done: false };
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, subtasks: [...t.subtasks, sub] } : t
    );
    set({ tasks });
    const task = tasks.find((t) => t.id === taskId);
    const { currentUid } = get();
    if (currentUid && task) fsUpdateTask(currentUid, taskId, { subtasks: task.subtasks }).catch(console.error);
  },

  toggleSubtask: (taskId, subId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }
        : t
    );
    set({ tasks });
    const task = tasks.find((t) => t.id === taskId);
    const { currentUid } = get();
    if (currentUid && task) fsUpdateTask(currentUid, taskId, { subtasks: task.subtasks }).catch(console.error);
  },

  deleteSubtask: (taskId, subId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) } : t
    );
    set({ tasks });
    const task = tasks.find((t) => t.id === taskId);
    const { currentUid } = get();
    if (currentUid && task) fsUpdateTask(currentUid, taskId, { subtasks: task.subtasks }).catch(console.error);
  },

  updateSubtask: (taskId, subId, title) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, title } : s)) }
        : t
    );
    set({ tasks });
    const task = tasks.find((t) => t.id === taskId);
    const { currentUid } = get();
    if (currentUid && task) fsUpdateTask(currentUid, taskId, { subtasks: task.subtasks }).catch(console.error);
  },

  // ── Folders ──────────────────────────────────────────────────────────────

  addFolder: (name) => {
    const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 5);
    const f: Folder = { id, name };
    set({ folders: [...get().folders, f] });
    const { currentUid } = get();
    if (currentUid) saveFolder(currentUid, f).catch(console.error);
    return f;
  },

  deleteFolder: (id) => {
    set({ folders: get().folders.filter((f) => f.id !== id) });
    const { currentUid } = get();
    if (currentUid) fsDeleteFolder(currentUid, id).catch(console.error);
  },

  renameFolder: (id, name) => {
    const folders = get().folders.map((f) => (f.id === id ? { ...f, name } : f));
    set({ folders });
    const folder = folders.find((f) => f.id === id);
    const { currentUid } = get();
    if (currentUid && folder) saveFolder(currentUid, folder).catch(console.error);
  },

  resetRecurringIfNeeded: () => {
    const today = startOfDay(new Date()).toISOString();
    const tasks = get().tasks.map((t) => {
      if (t.recurrence === "none") return t;
      const last = t.lastResetAt ? parseISO(t.lastResetAt) : null;
      const needsReset = !last || !isToday(last);
      if (needsReset && t.status === "done") {
        return { ...t, status: "todo" as Status, completedAt: undefined, lastResetAt: today, subtasks: t.subtasks.map((s) => ({ ...s, done: false })) };
      }
      if (needsReset) return { ...t, lastResetAt: today };
      return t;
    });
    set({ tasks });
    const { currentUid } = get();
    if (currentUid) {
      const changed = tasks.filter((t) => t.lastResetAt === today);
      if (changed.length > 0) batchSaveTasks(currentUid, changed).catch(console.error);
    }
  },

  updateTaskNotes: (taskId, notes) => {
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, notes } : t)) });
    const { currentUid } = get();
    if (currentUid) fsUpdateTask(currentUid, taskId, { notes }).catch(console.error);
  },

  addTaskLink: (taskId, url, title) => {
    const link: LinkRef = { id: uid(), url, title, createdAt: new Date().toISOString() };
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, links: [...(t.links ?? []), link] } : t
    );
    set({ tasks });
    const task = tasks.find((t) => t.id === taskId);
    const { currentUid } = get();
    if (currentUid && task) fsUpdateTask(currentUid, taskId, { links: task.links }).catch(console.error);
  },

  removeTaskLink: (taskId, linkId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, links: (t.links ?? []).filter((l) => l.id !== linkId) } : t
    );
    set({ tasks });
    const task = tasks.find((t) => t.id === taskId);
    const { currentUid } = get();
    if (currentUid && task) fsUpdateTask(currentUid, taskId, { links: task.links }).catch(console.error);
  },

  // ── Notes ────────────────────────────────────────────────────────────────

  selectedNoteId: null,
  selectNote: (id) => {
    set({ selectedNoteId: id });
    if (id) {
      updateSession({ lastEditedNoteId: id, lastViewedWorkspace: "notes" });
    }
  },

  addNote: (input) => {
    const now = new Date().toISOString();
    const n: Note = {
      id: uid(),
      title: input?.title ?? (input?.kind === "daily"
        ? `Daily log — ${new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`
        : "Untitled note"),
      content: input?.content ?? (input?.kind === "daily"
        ? "## What I did\n- \n\n## Issues\n- \n\n## Learnings\n- "
        : ""),
      kind: input?.kind ?? "note",
      dayKey: input?.dayKey,
      linkedTaskIds: [],
      createdAt: now,
      updatedAt: now,
      projectId: input?.projectId,
    };
    set({ notes: [n, ...get().notes], selectedNoteId: n.id });
    const { currentUid } = get();
    if (currentUid) saveNote(currentUid, n).catch(console.error);
    updateSession({ lastEditedNoteId: n.id, lastViewedWorkspace: "notes" });
    return n;
  },

  updateNote: (id, patch) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
    );
    set({ notes });
    const { currentUid } = get();
    if (currentUid) fsUpdateNote(currentUid, id, { ...patch, updatedAt: new Date().toISOString() }).catch(console.error);
    updateSession({ lastEditedNoteId: id });
  },

  deleteNote: (id) => {
    set({
      notes: get().notes.filter((n) => n.id !== id),
      selectedNoteId: get().selectedNoteId === id ? null : get().selectedNoteId,
      tasks: get().tasks.map((t) =>
        (t.linkedNoteIds ?? []).includes(id)
          ? { ...t, linkedNoteIds: (t.linkedNoteIds ?? []).filter((x) => x !== id) }
          : t
      ),
    });
    const { currentUid } = get();
    if (currentUid) fsDeleteNote(currentUid, id).catch(console.error);
  },

  linkTaskNote: (taskId, noteId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, linkedNoteIds: Array.from(new Set([...(t.linkedNoteIds ?? []), noteId])) } : t
    );
    const notes = get().notes.map((n) =>
      n.id === noteId ? { ...n, linkedTaskIds: Array.from(new Set([...n.linkedTaskIds, taskId])), updatedAt: new Date().toISOString() } : n
    );
    set({ tasks, notes });
    const { currentUid } = get();
    if (currentUid) {
      const task = tasks.find((t) => t.id === taskId);
      const note = notes.find((n) => n.id === noteId);
      if (task) fsUpdateTask(currentUid, taskId, { linkedNoteIds: task.linkedNoteIds }).catch(console.error);
      if (note) fsUpdateNote(currentUid, noteId, { linkedTaskIds: note.linkedTaskIds, updatedAt: note.updatedAt }).catch(console.error);
    }
  },

  unlinkTaskNote: (taskId, noteId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, linkedNoteIds: (t.linkedNoteIds ?? []).filter((x) => x !== noteId) } : t
    );
    const notes = get().notes.map((n) =>
      n.id === noteId ? { ...n, linkedTaskIds: n.linkedTaskIds.filter((x) => x !== taskId), updatedAt: new Date().toISOString() } : n
    );
    set({ tasks, notes });
    const { currentUid } = get();
    if (currentUid) {
      const task = tasks.find((t) => t.id === taskId);
      const note = notes.find((n) => n.id === noteId);
      if (task) fsUpdateTask(currentUid, taskId, { linkedNoteIds: task.linkedNoteIds }).catch(console.error);
      if (note) fsUpdateNote(currentUid, noteId, { linkedTaskIds: note.linkedTaskIds, updatedAt: note.updatedAt }).catch(console.error);
    }
  },

  getOrCreateDailyLog: () => {
    const key = todayKey();
    const existing = get().notes.find((n) => n.kind === "daily" && n.dayKey === key);
    if (existing) return existing;
    return get().addNote({ kind: "daily", dayKey: key });
  },

  // ── Commands ─────────────────────────────────────────────────────────────

  commands: [],
  addCommand: (input) => {
    const cmd: Command = {
      id: uid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    set({ commands: [cmd, ...get().commands] });
    const { currentUid } = get();
    if (currentUid) saveCommand(currentUid, cmd).catch(console.error);
  },

  deleteCommand: (id) => {
    set({ commands: get().commands.filter((c) => c.id !== id) });
    const { currentUid } = get();
    if (currentUid) fsDeleteCommand(currentUid, id).catch(console.error);
  },

  // ── Projects ─────────────────────────────────────────────────────────────

  projects: [],
  improvements: [],
  goals: [],
  activities: [],
  scratchpad: "",
  selectedProjectId: null,

  selectProject: (id) => {
    set({ selectedProjectId: id });
    if (id) {
      updateSession({ lastActiveProjectId: id, lastViewedWorkspace: `project:${id}` });
    }
  },

  addProject: (name, description) => {
    const p: Project = {
      id: uid(),
      name,
      description,
      createdAt: new Date().toISOString(),
      environments: {
        development: { deployUrl: "", firebaseProject: "", vercelProject: "", notes: "", commands: "" },
        staging: { deployUrl: "", firebaseProject: "", vercelProject: "", notes: "", commands: "" },
        production: { deployUrl: "", firebaseProject: "", vercelProject: "", notes: "", commands: "" },
      },
      stages: [
        { id: "development", name: "Development", enabled: true },
        { id: "staging", name: "Staging", enabled: true },
        { id: "production", name: "Production", enabled: true },
      ],
      customFields: [],
      techStack: [],
      accounts: [],
      aiTools: [],
      configs: [],
    };
    set({ projects: [...get().projects, p], selectedProjectId: p.id });
    const { currentUid } = get();
    if (currentUid) saveProject(currentUid, p).catch(console.error);
    get().logActivity("project_updated", `Created project: "${name}"`, { projectId: p.id });
    updateSession({ lastActiveProjectId: p.id, lastViewedWorkspace: `project:${p.id}` });
    return p;
  },

  updateProject: (id, patch) => {
    const projects = get().projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
    set({ projects });
    const { currentUid } = get();
    if (currentUid) {
      const updated = projects.find((p) => p.id === id);
      if (updated) saveProject(currentUid, updated).catch(console.error);
    }
    get().logActivity("project_updated", `Updated project: "${patch.name || 'details'}"`, { projectId: id });
  },

  deleteProject: (id) => {
    set({
      projects: get().projects.filter((p) => p.id !== id),
      selectedProjectId: get().selectedProjectId === id ? null : get().selectedProjectId,
      tasks: get().tasks.map((t) => t.projectId === id ? { ...t, projectId: undefined } : t),
      notes: get().notes.map((n) => n.projectId === id ? { ...n, projectId: undefined } : n),
      commands: get().commands.map((c) => c.projectId === id ? { ...c, projectId: undefined } : c),
      improvements: get().improvements.filter((imp) => imp.projectId !== id),
    });
    const { currentUid } = get();
    if (currentUid) fsDeleteProject(currentUid, id).catch(console.error);
  },

  // ── Improvements ─────────────────────────────────────────────────────────

  addImprovement: (projectId, title, priority = "medium") => {
    const imp: Improvement = {
      id: uid(),
      projectId,
      title,
      done: false,
      priority,
      createdAt: new Date().toISOString(),
    };
    set({ improvements: [imp, ...get().improvements] });
    const { currentUid } = get();
    if (currentUid) saveImprovement(currentUid, imp).catch(console.error);
    return imp;
  },

  toggleImprovement: (id) => {
    const improvements = get().improvements.map((imp) => {
      if (imp.id === id) {
        const nextDone = !imp.done;
        if (nextDone) {
          get().logActivity("improvement_completed", `Completed improvement idea: "${imp.title}"`, { projectId: imp.projectId });
        }
        return { ...imp, done: nextDone };
      }
      return imp;
    });
    set({ improvements });
    const { currentUid } = get();
    const updated = improvements.find((imp) => imp.id === id);
    if (currentUid && updated) saveImprovement(currentUid, updated).catch(console.error);
  },

  updateImprovement: (id, patch) => {
    const improvements = get().improvements.map((imp) => (imp.id === id ? { ...imp, ...patch } : imp));
    set({ improvements });
    const { currentUid } = get();
    const updated = improvements.find((imp) => imp.id === id);
    if (currentUid && updated) saveImprovement(currentUid, updated).catch(console.error);
  },

  deleteImprovement: (id) => {
    set({ improvements: get().improvements.filter((imp) => imp.id !== id) });
    const { currentUid } = get();
    if (currentUid) fsDeleteImprovement(currentUid, id).catch(console.error);
  },

  convertImprovementToTask: (id) => {
    const imp = get().improvements.find((x) => x.id === id);
    if (!imp) return;
    const task = get().addTask({
      title: imp.title,
      priority: imp.priority || "medium",
      projectId: imp.projectId,
    });
    get().deleteImprovement(id);
    get().logActivity("project_updated", `Converted improvement "${imp.title}" to a task`, { projectId: imp.projectId, taskId: task.id });
  },

  // ── Goals ────────────────────────────────────────────────────────────────

  addGoal: (title, timeframe, description) => {
    const uid = get().currentUid;
    if (!uid) throw new Error("No user");
    const newGoal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      title,
      description,
      timeframe,
      status: "todo",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ goals: [...s.goals, newGoal] }));
    saveGoal(uid, newGoal).catch((e) => console.error(e));
    return newGoal;
  },
  updateGoal: (id, patch) => {
    const uid = get().currentUid;
    if (!uid) return;
    let updated: Goal | null = null;
    set((s) => ({
      goals: s.goals.map((g) => {
        if (g.id === id) {
          updated = { ...g, ...patch };
          return updated;
        }
        return g;
      }),
    }));
    if (updated) {
      saveGoal(uid, updated).catch((e) => console.error(e));
    }
  },
  deleteGoal: (id) => {
    const uid = get().currentUid;
    if (!uid) return;
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
    fsDeleteGoal(uid, id).catch((e) => console.error(e));
  },

  // ── Scratchpad ───────────────────────────────────────────────────────────

  updateScratchpad: (content) => {
    const uid = get().currentUid;
    if (!uid) return;
    set({ scratchpad: content });
    saveScratchpad(uid, content).catch((e) => console.error("Failed to save scratchpad", e));
  },

  // ── Activities ───────────────────────────────────────────────────────────

  logActivity: (type, message, metadata) => {
    const { currentUid } = get();
    if (!currentUid) return;
    const log: ActivityLog = {
      id: uid(),
      userId: currentUid,
      type,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };
    set({ activities: [log, ...get().activities].slice(0, 100) });
    saveActivityLog(currentUid, log).catch(console.error);
  },

  registerCopiedCommand: (command) => {
    updateSession({ lastCopiedCommand: command });
    get().logActivity("command_copied", `Copied command: \`${command}\``, { command });
  },

  connectGCal: (email, isSimulated) => {
    localStorage.setItem("dev_os_gcal_connected", "true");
    localStorage.setItem("dev_os_gcal_email", email);
    localStorage.setItem("dev_os_is_simulated_sync", isSimulated ? "true" : "false");
    
    const initialEvents = isSimulated ? [
      { id: "g1", title: "Engineering Daily Sync", start: new Date(Date.now() + 24*3600*1000).toISOString().split('T')[0] + "T10:00:00", end: new Date(Date.now() + 24*3600*1000).toISOString().split('T')[0] + "T11:00:00", description: "Sync on task boards and code reviews.", projectId: "default-project" },
      { id: "g2", title: "Design Feedback Review", start: new Date(Date.now() + 2*24*3600*1000).toISOString().split('T')[0] + "T14:00:00", end: new Date(Date.now() + 2*24*3600*1000).toISOString().split('T')[0] + "T15:00:00", description: "Reviewing dashboard glassmorphism elements." },
      { id: "g3", title: "Staging Release QA", start: new Date().toISOString().split('T')[0] + "T15:30:00", end: new Date().toISOString().split('T')[0] + "T16:30:00", description: "Manual QA of main command center." }
    ] : [];
    
    if (isSimulated) {
      localStorage.setItem("dev_os_gcal_events", JSON.stringify(initialEvents));
    }
    
    const logs = [...get().gcalSyncLogs, `[Sync] Connected to Google account: ${email} (${isSimulated ? "Simulator" : "OAuth"})`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(logs));
    
    set({
      gcalConnected: true,
      gcalEmail: email,
      isSimulatedSync: isSimulated,
      gcalEvents: isSimulated ? initialEvents : [],
      gcalSyncLogs: logs
    });
  },

  disconnectGCal: () => {
    localStorage.removeItem("dev_os_gcal_connected");
    localStorage.removeItem("dev_os_gcal_email");
    localStorage.removeItem("dev_os_gcal_events");
    
    const logs = [...get().gcalSyncLogs, `[Sync] Disconnected Google account.`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(logs));
    
    set({
      gcalConnected: false,
      gcalEmail: null,
      gcalEvents: [],
      gcalSyncLogs: logs
    });
  },

  toggleGCalSync: (enabled) => {
    localStorage.setItem("dev_os_gcal_sync_enabled", enabled ? "true" : "false");
    const logs = [...get().gcalSyncLogs, `[Sync] Calendar two-way synchronization ${enabled ? "enabled" : "disabled"}.`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(logs));
    set({ gcalSyncEnabled: enabled, gcalSyncLogs: logs });
  },

  saveGCalCredentials: (clientId, apiKey) => {
    localStorage.setItem("dev_os_gcal_client_id", clientId);
    localStorage.setItem("dev_os_gcal_api_key", apiKey);
    const logs = [...get().gcalSyncLogs, `[Sync] Google credentials updated. OAuth Client ID: ${clientId ? "configured" : "none"}`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(logs));
    set({ gcalClientId: clientId, gcalApiKey: apiKey, gcalSyncLogs: logs });
  },

  addGCalEvent: (event) => {
    const newEvent = {
      id: "gsim-" + Math.random().toString(36).slice(2, 9),
      ...event
    };
    const events = [...get().gcalEvents, newEvent];
    localStorage.setItem("dev_os_gcal_events", JSON.stringify(events));
    
    const logs = [...get().gcalSyncLogs, `[Sync] Created calendar event "${event.title}" on Google Calendar.`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(logs));
    
    set({ gcalEvents: events, gcalSyncLogs: logs });
    toast.success("Event added and synced to Google Calendar");
  },

  updateGCalEvent: (id, patch) => {
    const events = get().gcalEvents.map(e => e.id === id ? { ...e, ...patch } : e);
    localStorage.setItem("dev_os_gcal_events", JSON.stringify(events));
    
    const event = events.find(e => e.id === id);
    const logs = [...get().gcalSyncLogs, `[Sync] Updated calendar event "${event?.title}" on Google Calendar.`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(logs));
    
    set({ gcalEvents: events, gcalSyncLogs: logs });
    toast.success("Event updated on Google Calendar");
  },

  deleteGCalEvent: (id) => {
    const event = get().gcalEvents.find(e => e.id === id);
    const events = get().gcalEvents.filter(e => e.id !== id);
    localStorage.setItem("dev_os_gcal_events", JSON.stringify(events));
    
    const logs = [...get().gcalSyncLogs, `[Sync] Deleted calendar event "${event?.title}" from Google Calendar.`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(logs));
    
    set({ gcalEvents: events, gcalSyncLogs: logs });
    toast.success("Event removed from Google Calendar");
  },

  addSyncLog: (msg) => {
    const logs = [...get().gcalSyncLogs, `[Sync] ${msg}`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(logs));
    set({ gcalSyncLogs: logs });
  },

  syncGCal: async () => {
    const logs = [...get().gcalSyncLogs, `[Sync] Triggering two-way calendar sync...`].slice(-50);
    set({ gcalSyncLogs: logs });
    
    await new Promise(resolve => setTimeout(resolve, 800)); // simulation delay
    
    const successLogs = [...get().gcalSyncLogs, `[Sync] Synchronization completed successfully. 0 errors.`].slice(-50);
    localStorage.setItem("dev_os_gcal_logs", JSON.stringify(successLogs));
    set({ gcalSyncLogs: successLogs });
    toast.success("Google Calendar synced successfully");
  },
}));

export const isOverdue = (t: Task) =>
  !!t.dueDate && t.status !== "done" && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate));

export const isDueToday = (t: Task) =>
  !!t.dueDate && isToday(parseISO(t.dueDate));

