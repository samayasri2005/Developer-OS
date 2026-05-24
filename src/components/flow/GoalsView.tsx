import { useState } from "react";
import { Plus, Target, CheckCircle2, Circle, MoreVertical, Trash2 } from "lucide-react";
import { useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["week", "month", "quarter", "year"] as const;

export function GoalsView() {
  const goals = useTasks((s) => s.goals);
  const addGoal = useTasks((s) => s.addGoal);
  const updateGoal = useTasks((s) => s.updateGoal);
  const deleteGoal = useTasks((s) => s.deleteGoal);

  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = (timeframe: typeof TIMEFRAMES[number]) => {
    if (!newTitle.trim()) return;
    addGoal(newTitle.trim(), timeframe);
    setNewTitle("");
    setAdding(null);
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Goals & OKRs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track high-level objectives across different timeframes.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pb-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {TIMEFRAMES.map((tf) => {
          const tfGoals = goals.filter((g) => g.timeframe === tf);
          const completedCount = tfGoals.filter((g) => g.status === "done").length;
          const progress = tfGoals.length === 0 ? 0 : Math.round((completedCount / tfGoals.length) * 100);

          return (
            <div key={tf} className="rounded-xl border border-border bg-card/40 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60 bg-secondary/20 flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold tracking-tight uppercase text-foreground">
                    {tf}ly Goals
                  </h3>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {completedCount} / {tfGoals.length} completed
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <button
                    onClick={() => setAdding(tf)}
                    className="h-6 w-6 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 flex flex-col gap-2 bg-card min-h-[120px]">
                {tfGoals.map((g) => (
                  <div key={g.id} className="group relative flex gap-3 px-3 py-2.5 rounded-lg border border-border bg-background shadow-sm hover:border-primary/40 transition-colors">
                    <button
                      onClick={() => updateGoal(g.id, { status: g.status === "done" ? "todo" : "done" })}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {g.status === "done" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <input
                        value={g.title}
                        onChange={(e) => updateGoal(g.id, { title: e.target.value })}
                        className={cn(
                          "w-full bg-transparent text-[13px] font-medium outline-none",
                          g.status === "done" && "text-muted-foreground line-through"
                        )}
                      />
                      <input
                        value={g.description || ""}
                        onChange={(e) => updateGoal(g.id, { description: e.target.value })}
                        placeholder="Add key results or description..."
                        className="w-full bg-transparent text-[11px] text-muted-foreground outline-none mt-1 placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="absolute right-2 top-2 h-6 w-6 grid place-items-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                
                {adding === tf && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleAdd(tf); }}
                    className="flex gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/50 bg-primary/5"
                  >
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => { if (!newTitle) setAdding(null); }}
                      placeholder={`New ${tf}ly goal...`}
                      className="flex-1 bg-transparent text-[13px] outline-none"
                    />
                  </form>
                )}

                {tfGoals.length === 0 && adding !== tf && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No goals set for this {tf}.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
