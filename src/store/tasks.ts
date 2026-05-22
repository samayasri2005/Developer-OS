/**
 * Developer OS — Task, Note, Folder & Command store backed by Firebase Firestore.
 * No workspace concept — all data belongs to the signed-in user directly.
 *
 * All data stored under users/{uid}/ sub-collections.
 * Call initStore(uid) on sign-in, clearStore() on sign-out.
 */

import { create } from "zustand";
import { isToday, isPast, parseISO, startOfDay } from "date-fns";
import type { Folder, LinkRef, Note, Priority, Recurrence, Status, Subtask, Task, Command } from "@/lib/types";
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
}

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
  addNote: (input?: { title?: string; content?: string; kind?: "note" | "daily"; dayKey?: string }) => Note;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  linkTaskNote: (taskId: string, noteId: string) => void;
  unlinkTaskNote: (taskId: string, noteId: string) => void;

  getOrCreateDailyLog: () => Note;

  // Commands
  commands: Command[];
  addCommand: (input: Omit<Command, "id" | "createdAt">) => void;
  deleteCommand: (id: string) => void;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

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
};

export const useTasks = create<State>()((set, get) => ({
  ...emptyState,

  // ── Init / teardown ──────────────────────────────────────────────────────

  initStore: async (userUid: string) => {
    set({ loading: true, currentUid: userUid });
    try {
      const [folders, tasks, notes, commands] = await Promise.all([
        fetchFolders(userUid),
        fetchTasks(userUid),
        fetchNotes(userUid),
        fetchCommands(userUid),
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
        set({ folders: defaultFolders, tasks: defaultTasks, notes: [], commands: [], loading: false });
        return;
      }

      set({ folders, tasks, notes, commands, loading: false });
    } catch (err) {
      console.error("Failed to load store from Firestore:", err);
      set({ loading: false });
    }
  },

  clearStore: () => set({ ...emptyState }),

  // ── Tasks ────────────────────────────────────────────────────────────────

  setQuickAddOpen: (v) => set({ quickAddOpen: v }),
  selectTask: (id) => set({ selectedTaskId: id }),

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
  selectNote: (id) => set({ selectedNoteId: id }),

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
    };
    set({ notes: [n, ...get().notes], selectedNoteId: n.id });
    const { currentUid } = get();
    if (currentUid) saveNote(currentUid, n).catch(console.error);
    return n;
  },

  updateNote: (id, patch) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
    );
    set({ notes });
    const { currentUid } = get();
    if (currentUid) fsUpdateNote(currentUid, id, { ...patch, updatedAt: new Date().toISOString() }).catch(console.error);
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
}));

export const isOverdue = (t: Task) =>
  !!t.dueDate && t.status !== "done" && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate));

export const isDueToday = (t: Task) =>
  !!t.dueDate && isToday(parseISO(t.dueDate));
