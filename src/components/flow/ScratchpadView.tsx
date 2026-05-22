import { useEffect, useState, useRef } from "react";
import { useTasks } from "@/store/tasks";
import { Eye, Edit3, Columns, Check, Copy, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ScratchpadView() {
  const storeScratchpad = useTasks((s) => s.scratchpad);
  const updateScratchpad = useTasks((s) => s.updateScratchpad);

  const [content, setContent] = useState(storeScratchpad);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const [fontStyle, setFontStyle] = useState<"sans" | "mono">("mono");
  const [copied, setCopied] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync from store if it changes elsewhere (e.g. on init)
  useEffect(() => {
    setContent(storeScratchpad);
  }, [storeScratchpad]);

  // Debounced auto-save
  useEffect(() => {
    if (content === storeScratchpad) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      updateScratchpad(content);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content, storeScratchpad, updateScratchpad]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Scratchpad content copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStats = () => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split("\n").length;
    return { chars, words, lines };
  };

  const { chars, words, lines } = getStats();

  // Simple Markdown parser for premium raw HTML rendering inside preview pane
  const parseMarkdown = (raw: string) => {
    if (!raw.trim()) {
      return `<p class="text-muted-foreground italic">Nothing written yet. Start typing on the left...</p>`;
    }

    let html = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-foreground mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-foreground border-b border-border/50 pb-1 mt-5 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-foreground mt-6 mb-3">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Code blocks & inline code
    html = html.replace(/`([^`]+)`/g, '<code class="font-mono bg-secondary px-1.5 py-0.5 rounded text-sm text-cyan-500">$1</code>');

    // Task list check / uncheck
    html = html.replace(/^\s*-\s*\[x\]\s*(.*$)/gim, '<div class="flex items-center gap-2 text-muted-foreground my-1.5"><input type="checkbox" checked disabled class="accent-primary h-3.5 w-3.5" /> <span class="line-through">$1</span></div>');
    html = html.replace(/^\s*-\s*\[\s*\]\s*(.*$)/gim, '<div class="flex items-center gap-2 my-1.5"><input type="checkbox" disabled class="h-3.5 w-3.5" /> <span>$1</span></div>');

    // Bullet Lists
    html = html.replace(/^\s*-\s*(?!\[[ x]\])(.*$)/gim, '<li class="list-disc ml-5 my-1 text-foreground/80">$1</li>');

    // Blockquotes
    html = html.replace(/^\s*>\s*(.*$)/gim, '<blockquote class="border-l-4 border-primary/50 pl-4 py-1 italic text-muted-foreground bg-secondary/30 my-3 rounded-r-lg">$1</blockquote>');

    // Line breaks
    html = html.split("\n").map(line => {
      if (line.startsWith("<h") || line.startsWith("<li") || line.startsWith("<div") || line.startsWith("<block")) {
        return line;
      }
      return line.trim() ? `<p class="my-2 leading-relaxed text-foreground/90">${line}</p>` : "";
    }).join("");

    return html;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-[1280px] space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Global Scratchpad</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A distraction-free zone for quick thoughts, scratch files, and raw notes. Auto-saves to cloud.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Font selection */}
          <div className="flex items-center border border-border rounded-lg bg-card p-0.5 text-xs">
            <button
              onClick={() => setFontStyle("sans")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                fontStyle === "sans" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sans
            </button>
            <button
              onClick={() => setFontStyle("mono")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                fontStyle === "mono" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mono
            </button>
          </div>

          {/* Mode switch */}
          <div className="flex items-center border border-border rounded-lg bg-card p-0.5">
            <button
              onClick={() => setMode("edit")}
              className={cn(
                "p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors",
                mode === "edit" && "bg-secondary text-foreground"
              )}
              title="Edit Mode"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMode("split")}
              className={cn(
                "p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors",
                mode === "split" && "bg-secondary text-foreground"
              )}
              title="Split View"
            >
              <Columns className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMode("preview")}
              className={cn(
                "p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors",
                mode === "preview" && "bg-secondary text-foreground"
              )}
              title="Preview Mode"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-[12px] font-medium text-foreground transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </button>
        </div>
      </div>

      {/* Main editor / preview frame */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
        {/* Editor Area */}
        {(mode === "edit" || mode === "split") && (
          <div
            className={cn(
              "rounded-xl border border-border bg-card shadow-card flex flex-col min-h-0",
              mode === "edit" ? "lg:col-span-12" : "lg:col-span-6"
            )}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
              <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Editor</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                Markdown Enabled
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Scratchpad&#10;&#10;Use this space for copying logs, drafting configuration steps, or planning command structures.&#10;&#10;- [ ] Try writing lists...&#10;- [x] Supports bold/code rendering.&#10;&#10;`npm run deploy`"
              className={cn(
                "flex-1 w-full p-6 bg-transparent outline-none resize-none border-none text-[13px] leading-relaxed placeholder:text-muted-foreground/50",
                fontStyle === "mono" ? "font-mono" : "font-sans text-sm"
              )}
            />
          </div>
        )}

        {/* Preview Area */}
        {(mode === "preview" || mode === "split") && (
          <div
            className={cn(
              "rounded-xl border border-border bg-card shadow-card flex flex-col min-h-0",
              mode === "preview" ? "lg:col-span-12" : "lg:col-span-6"
            )}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">Preview</span>
              </div>
              {content !== storeScratchpad && (
                <span className="text-[10px] text-amber-500 font-medium animate-pulse">Saving...</span>
              )}
            </div>
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin select-text">
              <article
                className="text-sm font-sans max-w-none text-foreground/80"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom stats status bar */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 px-2 py-1 bg-secondary/30 rounded-lg border border-border/40">
        <div className="flex items-center gap-3">
          <span>
            Characters: <strong className="font-semibold text-foreground">{chars}</strong>
          </span>
          <span>
            Words: <strong className="font-semibold text-foreground">{words}</strong>
          </span>
          <span>
            Lines: <strong className="font-semibold text-foreground">{lines}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-cyan-500" />
          <span>Auto-saved to cloud</span>
        </div>
      </div>
    </div>
  );
}
