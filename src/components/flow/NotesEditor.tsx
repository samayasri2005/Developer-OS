import { useEffect, useRef, useState } from "react";
import { Eye, Pencil, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  autoFocus?: boolean;
  compact?: boolean;
}

/**
 * Hybrid markdown editor: switch between Write (textarea) and Preview (rendered).
 * Inline, no save button — autosaves via onChange.
 */
export function NotesEditor({ value, onChange, placeholder, minRows = 5, autoFocus, compact }: Props) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el || mode !== "write") return;
    el.style.height = "auto";
    el.style.height = Math.max(el.scrollHeight, minRows * 22) + "px";
  }, [value, mode, minRows]);

  const insertCode = () => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end);
    const block = "\n```\n" + (sel || "code") + "\n```\n";
    const next = value.slice(0, start) + block + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + block.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className={cn("rounded-lg border border-border bg-secondary/40 overflow-hidden", compact && "bg-transparent border-dashed")}>
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/70 bg-card/60">
        <div className="flex items-center gap-0.5">
          <TabBtn active={mode === "write"} onClick={() => setMode("write")} icon={Pencil} label="Write" />
          <TabBtn active={mode === "preview"} onClick={() => setMode("preview")} icon={Eye} label="Preview" />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={insertCode}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-secondary"
            title="Insert code block"
          >
            <Code2 className="h-3 w-3" /> Code
          </button>
        </div>
      </div>
      {mode === "write" ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Add notes, logs, or references…"}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-[13.5px] leading-relaxed outline-none placeholder:text-muted-foreground font-sans"
          style={{ minHeight: minRows * 22 }}
        />
      ) : (
        <div
          className="prose-notes px-3 py-2.5 text-[13.5px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: value.trim() ? renderMarkdown(value) : `<p class="text-muted-foreground">${placeholder ?? "Nothing to preview yet."}</p>` }}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}