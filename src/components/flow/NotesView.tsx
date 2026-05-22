import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, FileText, Sunrise, Link as LinkIcon, X } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";
import { NotesEditor } from "./NotesEditor";

export function NotesView() {
  const notes = useTasks((s) => s.notes);
  const tasks = useTasks((s) => s.tasks);
  const selectedNoteId = useTasks((s) => s.selectedNoteId);
  const selectNote = useTasks((s) => s.selectNote);
  const addNote = useTasks((s) => s.addNote);
  const updateNote = useTasks((s) => s.updateNote);
  const deleteNote = useTasks((s) => s.deleteNote);
  const getOrCreateDailyLog = useTasks((s) => s.getOrCreateDailyLog);
  const projects = useTasks((s) => s.projects);
  const selectTask = useTasks((s) => s.selectTask);
  const linkTaskNote = useTasks((s) => s.linkTaskNote);
  const unlinkTaskNote = useTasks((s) => s.unlinkTaskNote);
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>("all");

  const [q, setQ] = useState("");
  const [taskPicker, setTaskPicker] = useState(false);
  const [taskPickerQ, setTaskPickerQ] = useState("");

  const wsNotes = useMemo(
    () =>
      notes
        .filter((n) => {
          // Search query filter
          const matchesSearch = !q || n.title.toLowerCase().includes(q.toLowerCase()) || n.content.toLowerCase().includes(q.toLowerCase());
          if (!matchesSearch) return false;

          // Project filter
          if (selectedProjectIdFilter === "general") {
            return !n.projectId;
          }
          if (selectedProjectIdFilter !== "all") {
            return n.projectId === selectedProjectIdFilter;
          }
          return true;
        })
        .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1)),
    [notes, q, selectedProjectIdFilter]
  );

  useEffect(() => {
    if (!selectedNoteId && wsNotes[0]) selectNote(wsNotes[0].id);
  }, [selectedNoteId, wsNotes, selectNote]);

  const note = notes.find((n) => n.id === selectedNoteId) ?? null;
  const linkedTasks = note ? tasks.filter((t) => note.linkedTaskIds.includes(t.id)) : [];
  const availableTasks = note
    ? tasks.filter((t) =>
        !note.linkedTaskIds.includes(t.id) &&
        (!taskPickerQ || t.title.toLowerCase().includes(taskPickerQ.toLowerCase()))
      ).slice(0, 8)
    : [];

  return (
    <div className="h-full flex gap-4">
      {/* List */}
      <aside className="w-[300px] shrink-0 flex flex-col rounded-xl border border-border bg-card/60 overflow-hidden">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight">Notes</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const n = getOrCreateDailyLog();
                  selectNote(n.id);
                }}
                title="Open today's daily log"
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-secondary hover:bg-secondary/70 text-[11.5px] font-medium text-foreground"
              >
                <Sunrise className="h-3 w-3" /> Daily
              </button>
              <button
                onClick={() => {
                  const activeProjId = (selectedProjectIdFilter !== "all" && selectedProjectIdFilter !== "general") ? selectedProjectIdFilter : undefined;
                  const n = addNote({ projectId: activeProjId });
                  selectNote(n.id);
                }}
                title="New note"
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-foreground text-background text-[11.5px] font-medium"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
          </div>
          {/* Project selector dropdown */}
          <div className="relative">
            <select
              value={selectedProjectIdFilter}
              onChange={(e) => setSelectedProjectIdFilter(e.target.value)}
              className="w-full text-[11px] bg-secondary border border-border/80 rounded-md px-2.5 py-1.5 outline-none font-semibold text-sidebar-foreground"
            >
              <option value="all">📁 All Notes</option>
              <option value="general">📄 General Notes</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  ⚙️ Project: {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 h-8 px-2 rounded-md bg-secondary">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notes…"
              className="flex-1 bg-transparent outline-none text-[12.5px] placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-1.5 space-y-0.5">
          {wsNotes.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              No notes yet.<br />Click <strong className="text-foreground">New</strong> to start.
            </div>
          ) : (
            wsNotes.map((n) => {
              const active = n.id === selectedNoteId;
              const preview = n.content.replace(/[#`*\-]/g, "").trim().slice(0, 60);
              return (
                <button
                  key={n.id}
                  onClick={() => selectNote(n.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-2.5 py-2 transition-colors",
                    active ? "bg-secondary" : "hover:bg-secondary/60"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {n.kind === "daily" ? (
                      <Sunrise className="h-3 w-3 text-primary shrink-0" />
                    ) : (
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 text-[12.5px] font-semibold truncate">{n.title}</div>
                    {n.projectId && (
                      <span className="text-[9px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={projects.find((p) => p.id === n.projectId)?.name || "Project"}>
                        {projects.find((p) => p.id === n.projectId)?.name || "project"}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 ml-4 text-[11px] text-muted-foreground truncate">
                    {preview || "Empty note"}
                  </div>
                  <div className="mt-1 ml-4 text-[10px] text-muted-foreground/80">
                    {formatDistanceToNow(parseISO(n.updatedAt), { addSuffix: true })}
                    {n.linkedTaskIds.length > 0 && <span className="ml-2">· {n.linkedTaskIds.length} linked</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Editor */}
      <section className="flex-1 min-w-0 rounded-xl border border-border bg-card/60 flex flex-col overflow-hidden">
        {!note ? (
          <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
            Select or create a note.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-border">
              <input
                value={note.title}
                onChange={(e) => updateNote(note.id, { title: e.target.value })}
                placeholder="Untitled note"
                className="flex-1 bg-transparent text-[18px] font-bold tracking-tight outline-none placeholder:text-muted-foreground"
              />
              <div className="relative shrink-0 mr-1">
                <select
                  value={note.projectId || ""}
                  onChange={(e) => updateNote(note.id, { projectId: e.target.value || undefined })}
                  className="text-[11px] bg-secondary border border-border/85 rounded-md px-2 py-1.5 outline-none font-medium text-foreground max-w-[140px] truncate cursor-pointer"
                >
                  <option value="">📁 General (No Project)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      ⚙️ {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>Edited {formatDistanceToNow(parseISO(note.updatedAt), { addSuffix: true })}</span>
                <button
                  onClick={() => { if (confirm("Delete this note?")) deleteNote(note.id); }}
                  className="ml-2 h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
              <NotesEditor
                value={note.content}
                onChange={(v) => updateNote(note.id, { content: v })}
                placeholder="Start writing… (supports headings #, - bullets, `inline code`, ``` code blocks)"
                minRows={14}
              />

              {/* Linked tasks */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" /> Linked tasks
                    {linkedTasks.length > 0 && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{linkedTasks.length}</span>
                    )}
                  </span>
                  <button
                    onClick={() => setTaskPicker((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-secondary"
                  >
                    <Plus className="h-3 w-3" /> Link task
                  </button>
                </div>
                <div className="space-y-1.5">
                  {linkedTasks.map((t) => (
                    <div key={t.id} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        t.status === "done" ? "bg-status-done" : t.status === "doing" ? "bg-primary" : "bg-muted-foreground/50"
                      )} />
                      <button
                        onClick={() => selectTask(t.id)}
                        className="flex-1 text-left text-[12.5px] font-medium truncate hover:text-primary"
                      >
                        {t.title}
                      </button>
                      <button
                        onClick={() => unlinkTaskNote(t.id, note.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-6 w-6 grid place-items-center rounded"
                        aria-label="Unlink"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {taskPicker && (
                    <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-2 space-y-1.5">
                      <input
                        autoFocus
                        value={taskPickerQ}
                        onChange={(e) => setTaskPickerQ(e.target.value)}
                        placeholder="Search tasks…"
                        className="w-full text-[12.5px] bg-card border border-border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="max-h-40 overflow-y-auto scrollbar-thin space-y-0.5">
                        {availableTasks.length === 0 ? (
                          <div className="text-[11.5px] text-muted-foreground px-2 py-1">No matches.</div>
                        ) : (
                          availableTasks.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => { linkTaskNote(t.id, note.id); setTaskPickerQ(""); }}
                              className="w-full flex items-center gap-2 text-left text-[12px] px-2 py-1.5 rounded hover:bg-secondary"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                              <span className="flex-1 truncate">{t.title}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}