import { useEffect, useRef, useState } from "react";
import { Sparkles, CornerDownLeft, X } from "lucide-react";
import { parseQuickInput } from "@/lib/parser";
import { useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";

export function QuickAdd() {
  const open = useTasks((s) => s.quickAddOpen);
  const setOpen = useTasks((s) => s.setQuickAddOpen);
  const addTask = useTasks((s) => s.addTask);
  const addFolder = useTasks((s) => s.addFolder);
  const folders = useTasks((s) => s.folders);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!open) return null;

  const parsed = value ? parseQuickInput(value) : null;

  const submit = () => {
    if (!parsed?.title) return;
    let folder = parsed.folder;
    if (folder && !folders.find((f) => f.id === folder || f.name.toLowerCase() === folder)) {
      addFolder(folder);
    } else if (folder) {
      const found = folders.find((f) => f.id === folder || f.name.toLowerCase() === folder);
      if (found) folder = found.id;
    }
    addTask({
      title: parsed.title,
      tags: parsed.tags,
      priority: parsed.priority,
      recurrence: parsed.recurrence,
      folder: folder ?? folders[0]?.id,
      dueDate: parsed.dueDate,
    });
    setValue("");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl glass-strong rounded-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="h-7 w-7 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder='e.g. "Read 15 mins /daily #self p2"'
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            {parsed?.title ? (
              <>
                <Pill label="Title" value={parsed.title} />
                <Pill label="Priority" value={parsed.priority} accent={priorityClass(parsed.priority)} />
                {parsed.recurrence !== "none" && <Pill label="Repeat" value={parsed.recurrence} />}
                {parsed.folder && <Pill label="Folder" value={parsed.folder} />}
                {parsed.dueDate && <Pill label="Due" value={new Date(parsed.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />}
                {parsed.tags.map((t) => <Pill key={t} label="Tag" value={`#${t}`} />)}
              </>
            ) : (
              <span>
                Use <code className="text-foreground/80">#tag</code>, <code className="text-foreground/80">@folder</code>, <code className="text-foreground/80">/daily</code>, <code className="text-foreground/80">today/tomorrow</code>, <code className="text-foreground/80">p1/p2/p3</code>
              </span>
            )}
          </div>
          <button
            onClick={submit}
            disabled={!parsed?.title}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
              "bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-50 disabled:shadow-none"
            )}
          >
            Add <CornerDownLeft className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-1.5 py-0.5", accent)}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-foreground/90">{value}</span>
    </span>
  );
}

function priorityClass(p: string) {
  if (p === "high") return "ring-1 ring-priority-high/40 text-priority-high";
  if (p === "medium") return "ring-1 ring-priority-medium/40 text-priority-medium";
  return "ring-1 ring-priority-low/40 text-priority-low";
}
