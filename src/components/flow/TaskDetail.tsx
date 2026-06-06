import { X, Trash2, Calendar as CalIcon, Tag, Repeat, Folder, Flag, Save, History, ChevronDown, Plus, Check, StickyNote, Link as LinkIcon, FileText, CornerDownLeft } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";
import type { Priority, Recurrence, Status } from "@/lib/types";
import { useEffect, useState } from "react";
import { NotesEditor } from "./NotesEditor";
import { LinkCard } from "./LinkCard";

const statuses: { id: Status; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];
const priorities: Priority[] = ["low", "medium", "high"];
const recurrences: { id: Recurrence; label: string }[] = [
  { id: "none", label: "Does not repeat" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
];

const priorityDot: Record<Priority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

const statusPill: Record<Status, string> = {
  todo: "bg-secondary text-foreground border-border",
  doing: "bg-primary/10 text-primary border-primary/30",
  done: "bg-status-done/10 text-status-done border-status-done/30",
};

export function TaskDetail({ isInline }: { isInline?: boolean }) {
  const id = useTasks((s) => s.selectedTaskId);
  const tasks = useTasks((s) => s.tasks);
  const folders = useTasks((s) => s.folders);
  const update = useTasks((s) => s.updateTask);
  const del = useTasks((s) => s.deleteTask);
  const addSubtask = useTasks((s) => s.addSubtask);
  const toggleSubtask = useTasks((s) => s.toggleSubtask);
  const deleteSubtask = useTasks((s) => s.deleteSubtask);
  const updateTaskNotes = useTasks((s) => s.updateTaskNotes);
  const addTaskLink = useTasks((s) => s.addTaskLink);
  const removeTaskLink = useTasks((s) => s.removeTaskLink);
  const notes = useTasks((s) => s.notes);
  const addNote = useTasks((s) => s.addNote);
  const linkTaskNote = useTasks((s) => s.linkTaskNote);
  const unlinkTaskNote = useTasks((s) => s.unlinkTaskNote);
  const selectNote = useTasks((s) => s.selectNote);
  const close = () => useTasks.getState().selectTask(null);

  const task = tasks.find((t) => t.id === id);
  const [tagInput, setTagInput] = useState("");
  const [subInput, setSubInput] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [notePicker, setNotePicker] = useState(false);
  const [notePickerQ, setNotePickerQ] = useState("");

  useEffect(() => {
    setTagInput(""); setSubInput(""); setLinkInput(""); setLinkTitle("");
    setShowLinkForm(false); setNotePicker(false); setNotePickerQ("");
  }, [id]);

  if (!task) return null;

  const taskFolders = folders;
  const folder = folders.find((f) => f.id === task.folder);
  const linkedNotes = (task.linkedNoteIds ?? [])
    .map((nid) => notes.find((n) => n.id === nid))
    .filter(Boolean) as typeof notes;
  const availableNotes = notes.filter(
    (n) => !(task.linkedNoteIds ?? []).includes(n.id)
      && (!notePickerQ || n.title.toLowerCase().includes(notePickerQ.toLowerCase()))
  );

  return (
    <>
      {!isInline && (
        <div className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px] animate-fade-in" onClick={close} />
      )}
      <aside
        className={cn(
          "bg-card flex flex-col",
          isInline
            ? "h-full w-full border-l border-border"
            : "fixed right-0 top-0 z-50 h-full w-full max-w-[440px] border-l border-border shadow-elev animate-slide-in-right"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="text-[13px] font-semibold tracking-tight text-muted-foreground">Task details</div>
          <button onClick={close} className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 space-y-5">
          {/* Title */}
          <textarea
            value={task.title}
            onChange={(e) => update(task.id, { title: e.target.value })}
            rows={2}
            className="w-full resize-none bg-transparent text-xl font-bold tracking-tight outline-none placeholder:text-muted-foreground leading-tight"
            placeholder="Task title"
          />

          {/* Status pill + created */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground -mt-2">
            <StatusPicker task={task} />
            <span>·</span>
            <History className="h-3 w-3" />
            <span>Created {formatDistanceToNow(parseISO(task.createdAt), { addSuffix: true })}</span>
          </div>

          {/* Field rows */}
          <div className="space-y-1 pt-1">
            <FieldRow icon={Flag} label="Priority">
              <div className="flex gap-1">
                {priorities.map((p) => (
                  <button
                    key={p}
                    onClick={() => update(task.id, { priority: p })}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all capitalize",
                      task.priority === p
                        ? "border-foreground/20 bg-secondary text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", priorityDot[p])} />
                    {p}
                  </button>
                ))}
              </div>
            </FieldRow>

            <FieldRow icon={CalIcon} label="Due Date">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={task.dueDate ? format(parseISO(task.dueDate), "yyyy-MM-dd") : ""}
                  onChange={(e) => update(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="bg-secondary border border-border rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
                {task.dueDate && (
                  <button onClick={() => update(task.id, { dueDate: undefined })} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </FieldRow>

            <FieldRow icon={Folder} label="Folder">
              <div className="relative">
                <select
                  value={task.folder}
                  onChange={(e) => update(task.id, { folder: e.target.value })}
                  className="appearance-none bg-transparent text-sm font-medium pr-6 py-1 outline-none cursor-pointer"
                >
                  {taskFolders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </FieldRow>

            <FieldRow icon={Repeat} label="Repeat">
              <div className="relative">
                <select
                  value={task.recurrence}
                  onChange={(e) => update(task.id, { recurrence: e.target.value as Recurrence })}
                  className="appearance-none bg-transparent text-sm font-medium pr-6 py-1 outline-none cursor-pointer"
                >
                  {recurrences.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </FieldRow>
          </div>

          <div className="h-px bg-border" />

          {/* Tags */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Tags
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {task.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                  #{t}
                  <button onClick={() => update(task.id, { tags: task.tags.filter((x) => x !== t) })} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary border border-dashed border-border">
                <Plus className="h-3 w-3 text-muted-foreground" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      const v = tagInput.trim().toLowerCase().replace(/^#/, "");
                      if (!task.tags.includes(v)) update(task.id, { tags: [...task.tags, v] });
                      setTagInput("");
                    }
                  }}
                  placeholder="Add Tag"
                  className="text-xs bg-transparent outline-none placeholder:text-muted-foreground w-16"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <span className="inline-block h-3 w-0.5 bg-muted-foreground" /> Description
            </div>
            <textarea
              value={task.description ?? ""}
              onChange={(e) => update(task.id, { description: e.target.value })}
              rows={5}
              placeholder="Add a description…"
              className="w-full text-sm bg-secondary/60 border border-border rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground leading-relaxed"
            />
          </div>

          {/* Notes (markdown) */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5 text-muted-foreground" /> Notes
            </div>
            <NotesEditor
              value={task.notes ?? ""}
              onChange={(v) => updateTaskNotes(task.id, v)}
              placeholder="Add notes, logs, or references…  (supports **bold**, `code`, ``` blocks, - bullets)"
              minRows={4}
            />
          </div>

          {/* Links */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" /> Links
                {(task.links?.length ?? 0) > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{task.links!.length}</span>
                )}
              </span>
              <button
                onClick={() => setShowLinkForm((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-secondary"
              >
                <Plus className="h-3 w-3" /> Add link
              </button>
            </div>
            <div className="space-y-1.5">
              {(task.links ?? []).map((l) => (
                <LinkCard key={l.id} link={l} onRemove={() => removeTaskLink(task.id, l.id)} />
              ))}
              {showLinkForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const url = linkInput.trim();
                    if (!url) return;
                    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                    addTaskLink(task.id, normalized, linkTitle.trim() || undefined);
                    setLinkInput(""); setLinkTitle(""); setShowLinkForm(false);
                  }}
                  className="rounded-lg border border-dashed border-border bg-secondary/40 p-2 space-y-1.5"
                >
                  <input
                    autoFocus
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="Paste URL (github.com/… , docs, PR…)"
                    className="w-full text-[12.5px] bg-card border border-border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Optional label"
                      className="flex-1 text-[12px] bg-card border border-border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1.5 rounded-md bg-foreground text-background"
                    >
                      <CornerDownLeft className="h-3 w-3" /> Add
                    </button>
                  </div>
                </form>
              )}
              {!showLinkForm && (task.links?.length ?? 0) === 0 && (
                <button
                  onClick={() => setShowLinkForm(true)}
                  className="w-full text-left text-[12px] text-muted-foreground px-2.5 py-2 rounded-lg border border-dashed border-border hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  + Attach a URL (GitHub PR, docs, reference…)
                </button>
              )}
            </div>
          </div>

          {/* Linked notes */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Linked notes
                {linkedNotes.length > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{linkedNotes.length}</span>
                )}
              </span>
              <button
                onClick={() => setNotePicker((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-secondary"
              >
                <Plus className="h-3 w-3" /> Link note
              </button>
            </div>
            <div className="space-y-1.5">
              {linkedNotes.map((n) => (
                <div key={n.id} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <button
                    onClick={() => {
                      selectNote(n.id);
                      close();
                      window.dispatchEvent(new CustomEvent("flow:navigate", { detail: "notes" }));
                    }}
                    className="flex-1 text-left text-[12.5px] font-medium truncate hover:text-primary"
                  >
                    {n.title}
                  </button>
                  <button
                    onClick={() => unlinkTaskNote(task.id, n.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-6 w-6 grid place-items-center rounded"
                    aria-label="Unlink"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {notePicker && (
                <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-2 space-y-1.5">
                  <input
                    autoFocus
                    value={notePickerQ}
                    onChange={(e) => setNotePickerQ(e.target.value)}
                    placeholder="Search notes…"
                    className="w-full text-[12.5px] bg-card border border-border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="max-h-40 overflow-y-auto scrollbar-thin space-y-0.5">
                    {availableNotes.length === 0 ? (
                      <div className="text-[11.5px] text-muted-foreground px-2 py-1">No matches.</div>
                    ) : (
                      availableNotes.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { linkTaskNote(task.id, n.id); setNotePickerQ(""); }}
                          className="w-full flex items-center gap-2 text-left text-[12px] px-2 py-1.5 rounded hover:bg-secondary"
                        >
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="flex-1 truncate">{n.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const n = addNote({});
                      linkTaskNote(task.id, n.id);
                      setNotePicker(false);
                    }}
                    className="w-full text-[11.5px] font-medium px-2 py-1.5 rounded-md bg-foreground text-background inline-flex items-center justify-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Create & link new note
                  </button>
                </div>
              )}
              {!notePicker && linkedNotes.length === 0 && (
                <button
                  onClick={() => setNotePicker(true)}
                  className="w-full text-left text-[12px] text-muted-foreground px-2.5 py-2 rounded-lg border border-dashed border-border hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  + Link an existing note or create a new one
                </button>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
              <span>Subtasks</span>
              {task.subtasks.length > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {task.subtasks.map((s) => (
                <div key={s.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/60">
                  <button
                    onClick={() => toggleSubtask(task.id, s.id)}
                    className={cn(
                      "h-4 w-4 rounded border grid place-items-center transition-colors shrink-0",
                      s.done ? "bg-status-done border-status-done text-white" : "border-border hover:border-primary"
                    )}
                  >
                    {s.done && <Check className="h-3 w-3" />}
                  </button>
                  <span className={cn("flex-1 text-sm", s.done && "line-through text-muted-foreground")}>{s.title}</span>
                  <button
                    onClick={() => deleteSubtask(task.id, s.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (subInput.trim()) {
                    addSubtask(task.id, subInput.trim());
                    setSubInput("");
                  }
                }}
                className="flex items-center gap-2 px-2 py-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={subInput}
                  onChange={(e) => setSubInput(e.target.value)}
                  placeholder="Add subtask"
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-card">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { del(task.id); close(); }}
              className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={close}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-foreground text-background text-[12px] font-medium hover:bg-foreground/90 transition-colors"
          >
            <Save className="h-3.5 w-3.5" /> Done
          </button>
        </div>
      </aside>
    </>
  );
}

function FieldRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex items-center gap-2 w-28 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function StatusPicker({ task }: { task: { id: string; status: Status } }) {
  const update = useTasks((s) => s.updateTask);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold capitalize",
          statusPill[task.status]
        )}
      >
        <Repeat className="h-2.5 w-2.5" /> {task.status === "doing" ? "Doing" : task.status === "todo" ? "Todo" : "Done"}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 rounded-md border border-border bg-popover shadow-elev p-1 animate-fade-in">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                update(task.id, { status: s.id, completedAt: s.id === "done" ? new Date().toISOString() : undefined });
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1 text-xs rounded hover:bg-secondary whitespace-nowrap"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
