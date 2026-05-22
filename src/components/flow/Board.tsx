import { useMemo, useState } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, CircleDashed, CircleDot, CheckCircle2 } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { useTasks } from "@/store/tasks";
import type { Status, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const columns: { id: Status; label: string; dot: string; icon: any }[] = [
  { id: "todo", label: "TODO", dot: "bg-status-todo", icon: CircleDashed },
  { id: "doing", label: "DOING", dot: "bg-status-doing", icon: CircleDot },
  { id: "done", label: "DONE", dot: "bg-status-done", icon: CheckCircle2 },
];

export function Board() {
  const tasks = useTasks((s) => s.tasks);
  const moveTask = useTasks((s) => s.moveTask);
  const reorder = useTasks((s) => s.reorderInColumn);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const grouped = useMemo(() => {
    const g: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
    tasks.forEach((t) => g[t.status].push(t));
    (Object.keys(g) as Status[]).forEach((k) => g[k].sort((a, b) => a.order - b.order));
    return g;
  }, [tasks]);

  const findContainer = (id: string): Status | null => {
    if (["todo", "doing", "done"].includes(id)) return id as Status;
    const t = tasks.find((x) => x.id === id);
    return t?.status ?? null;
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      const ids = grouped[activeContainer].map((t) => t.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex !== newIndex && newIndex >= 0) {
        const reordered = arrayMove(ids, oldIndex, newIndex);
        reorder(activeContainer, reordered);
      }
    } else {
      moveTask(String(active.id), overContainer);
    }
  };

  const active = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] leading-tight font-semibold tracking-tight">
            Kanban Board
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag and drop tasks across columns to update their status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-card border border-border">
            <span className="h-1.5 w-1.5 rounded-full bg-status-done animate-pulse" />
            Synced
          </span>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <Column key={col.id} id={col.id} label={col.label} dot={col.dot} icon={col.icon} tasks={grouped[col.id]} />
          ))}
        </div>
        <DragOverlay>{active ? <TaskCard task={active} dragging /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ id, label, dot, icon: Icon, tasks }: { id: Status; label: string; dot: string; icon: any; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const addTask = useTasks((s) => s.addTask);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title.trim()) { setAdding(false); return; }
    addTask({ title: title.trim(), status: id });
    setTitle("");
    setAdding(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl bg-card border border-border shadow-card min-h-[520px] transition-colors",
        isOver && "border-primary/40 bg-primary/[0.02]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
          <span className="text-[11px] font-semibold tracking-[0.10em] text-foreground/70 uppercase">{label}</span>
          <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
            {tasks.length}
          </span>
        </div>
        <button className="h-6 w-6 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground transition-colors">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2.5 space-y-2 overflow-y-auto scrollbar-thin">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => <SortableCard key={t.id} task={t} />)}
        </SortableContext>

        {/* Inline add */}
        {adding ? (
          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="rounded-lg border border-primary/40 bg-card p-3 ring-1 ring-primary/10"
          >
            <textarea
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                if (e.key === "Escape") { setAdding(false); setTitle(""); }
              }}
              onBlur={submit}
              placeholder="What needs to be done?"
              rows={2}
              className="w-full resize-none bg-transparent outline-none text-[13px] placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">↵ save · Esc cancel</span>
              <button type="submit" className="text-[10px] font-semibold px-2 py-1 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors">
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-md text-[12px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add task
          </button>
        )}
      </div>
    </div>
  );
}

function SortableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}
