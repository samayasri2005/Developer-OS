import { useState, useMemo, useEffect } from "react";
import {
  Terminal, Plus, Copy, Check, Trash2, Search, Tag, ChevronLeft, Sparkles, Code
} from "lucide-react";
import { useTasks } from "@/store/tasks";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_CATEGORIES = ["dev", "deploy", "db", "test", "git", "playbook", "other"];

const categoryColors: Record<string, string> = {
  dev:      "bg-blue-500/10 text-blue-500 border-blue-500/20",
  deploy:   "bg-purple-500/10 text-purple-500 border-purple-500/20",
  db:       "bg-amber-500/10 text-amber-500 border-amber-500/20",
  test:     "bg-green-500/10 text-green-500 border-green-500/20",
  git:      "bg-orange-500/10 text-orange-500 border-orange-500/20",
  playbook: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  other:    "bg-muted text-muted-foreground border-border",
};

const catColor = (cat: string) =>
  categoryColors[cat.toLowerCase()] ?? categoryColors.other;

interface Playbook {
  id: string;
  label: string;
  command: string;
  category: string;
  isBuiltIn?: boolean;
}

const BUILT_IN_PLAYBOOKS: Playbook[] = [
  {
    id: "git-repo-init",
    label: "Git Repository Initialization",
    category: "git",
    isBuiltIn: true,
    command: `# 1. Go into your project folder
cd your-project-folder

# 2. Initialize git
git init

# 3. Add all files
git add .

# 4. Commit files
git commit -m "Initial commit"

# 5. Rename branch to main
git branch -M main

# 6. Connect your new GitHub repo
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# 7. Push to GitHub
git push -u origin main`
  },
  {
    id: "docker-node-compose",
    label: "Dockerized Node.js Service Setup",
    category: "dev",
    isBuiltIn: true,
    command: `# 1. Build the docker image
docker build -t {{image_name}}:{{tag}} .

# 2. Run the container in detached mode
docker run -d --name {{container_name}} -p {{host_port}}:{{container_port}} -e NODE_ENV={{env}} {{image_name}}:{{tag}}`
  },
  {
    id: "npm-package-release",
    label: "NPM Package Publish Workflow",
    category: "deploy",
    isBuiltIn: true,
    command: `# 1. Checkout to release branch and pull latest
git checkout {{branch}}
git pull origin {{branch}}

# 2. Clean install dependencies
npm ci

# 3. Run production build
npm run build

# 4. Bump package version and commit tag
npm version {{version_bump}} -m "bump version to %s"

# 5. Push changes and tags to git origin
git push origin {{branch}} --tags

# 6. Publish package to registry
npm publish --access {{npm_access}}`
  }
];

// Helper functions for templates
function parseGitUrl(url: string) {
  url = url.trim();
  if (!url) return null;
  
  let path = url;
  if (path.includes("@")) {
    path = path.split("@")[1];
  }
  path = path.replace(":", "/");
  path = path.replace(/^(https?|git):\/\//, "");
  
  if (path.endsWith(".git")) {
    path = path.slice(0, -4);
  }
  
  const parts = path.split("/");
  if (parts.length >= 3) {
    const host = parts[0];
    const repo = parts[parts.length - 1];
    const username = parts.slice(1, parts.length - 1).join("/");
    return {
      host,
      username,
      repo,
    };
  }
  
  return null;
}

function getPlaceholders(text: string): string[] {
  const placeholders = new Set<string>();
  
  const doubleCurlyRegex = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = doubleCurlyRegex.exec(text)) !== null) {
    placeholders.add(match[1].trim());
  }
  
  const squareBracketRegex = /\[([A-Z0-9_-]+)\]/g;
  while ((match = squareBracketRegex.exec(text)) !== null) {
    placeholders.add(match[1]);
  }

  if (text.includes("your-project-folder")) {
    placeholders.add("your-project-folder");
  }
  if (text.includes("USERNAME")) {
    placeholders.add("USERNAME");
  }
  if (text.includes("REPO-NAME")) {
    placeholders.add("REPO-NAME");
  }

  return Array.from(placeholders);
}

function renderTemplate(text: string, values: Record<string, string>): string {
  let result = text;
  
  for (const [key, val] of Object.entries(values)) {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    result = result.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g'), val);
    result = result.replace(new RegExp(`\\[\\s*${escapedKey}\\s*\\]`, 'g'), val);
    if (key === "your-project-folder" || key === "USERNAME" || key === "REPO-NAME") {
      result = result.replaceAll(key, val);
    }
  }
  
  return result;
}

const getPlaceholderDefault = (key: string): string => {
  if (key === "your-project-folder") return "my-project";
  if (key === "USERNAME") return "github-username";
  if (key === "REPO-NAME") return "my-repo";
  if (key.includes("commit_message")) return "Initial commit";
  if (key.includes("branch")) return "main";
  if (key.includes("version_bump")) return "patch";
  if (key.includes("access")) return "public";
  if (key.includes("tag")) return "latest";
  if (key.includes("host_port")) return "3000";
  if (key.includes("container_port")) return "3000";
  if (key.includes("node_version")) return "20";
  if (key.includes("env")) return "production";
  return key;
};

export function CommandsView() {
  const commands = useTasks((s) => s.commands);
  const addCommand = useTasks((s) => s.addCommand);
  const deleteCommand = useTasks((s) => s.deleteCommand);
  const registerCopiedCommand = useTasks((s) => s.registerCopiedCommand);
  const projects = useTasks((s) => s.projects);

  // Layout tabs
  const [activeTab, setActiveTab] = useState<"library" | "playbooks">("library");

  // Filtering / Search for Library
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Adding commands
  const [adding, setAdding] = useState(false);
  const [commandType, setCommandType] = useState<"single" | "playbook">("single");
  const [draft, setDraft] = useState({ label: "", command: "", category: "dev", projectId: "" });

  // Playbooks workspace states
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [gitUrl, setGitUrl] = useState("");
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

  // Filter commands for Quick Commands tab (exclude playbooks)
  const quickCommands = useMemo(() => {
    return commands.filter((c) => c.category !== "playbook");
  }, [commands]);

  // Extract custom playbooks
  const customPlaybooks = useMemo(() => {
    return commands.filter((c) => c.category === "playbook" || c.command.includes("\n") || c.command.includes("{{"));
  }, [commands]);

  // Combine built-in playbooks with custom ones
  const allPlaybooks = useMemo(() => {
    const customList = customPlaybooks.map(c => ({
      id: c.id,
      label: c.label,
      command: c.command,
      category: c.category,
      isBuiltIn: false
    }));
    return [...BUILT_IN_PLAYBOOKS, ...customList];
  }, [customPlaybooks]);

  // Selected active playbook details
  const activePlaybook = useMemo(() => {
    return allPlaybooks.find((p) => p.id === selectedPlaybookId) ?? null;
  }, [allPlaybooks, selectedPlaybookId]);

  // Initialize placeholder values when active playbook changes
  useEffect(() => {
    if (activePlaybook) {
      const placeholders = getPlaceholders(activePlaybook.command);
      const initialValues: Record<string, string> = {};
      placeholders.forEach((p) => {
        initialValues[p] = getPlaceholderDefault(p);
      });
      setPlaceholderValues(initialValues);
      setGitUrl("");
    } else {
      setPlaceholderValues({});
      setGitUrl("");
    }
  }, [activePlaybook]);

  // Autodetect Git URLs and fill fields
  const handleGitUrlChange = (val: string) => {
    setGitUrl(val);
    const parsed = parseGitUrl(val);
    if (parsed) {
      setPlaceholderValues((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(prev)) {
          const lowercaseKey = key.toLowerCase();
          if (key === "your-project-folder") {
            next[key] = parsed.repo;
          } else if (key === "USERNAME") {
            next[key] = parsed.username;
          } else if (key === "REPO-NAME") {
            next[key] = parsed.repo;
          } else if (lowercaseKey.includes("username") || lowercaseKey.includes("owner")) {
            next[key] = parsed.username;
          } else if (lowercaseKey.includes("repo")) {
            next[key] = parsed.repo;
          } else if (lowercaseKey.includes("folder") || lowercaseKey.includes("dir") || lowercaseKey.includes("project")) {
            next[key] = parsed.repo;
          }
        }
        return next;
      });
    }
  };

  const renderedScript = useMemo(() => {
    if (!activePlaybook) return "";
    return renderTemplate(activePlaybook.command, placeholderValues);
  }, [activePlaybook, placeholderValues]);

  const scriptSteps = useMemo(() => {
    if (!renderedScript) return [];
    return renderedScript.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return { id: idx, type: "empty" as const, text: "" };
      if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
        return { id: idx, type: "comment" as const, text: line };
      }
      return { id: idx, type: "command" as const, text: line };
    });
  }, [renderedScript]);

  const categories = useMemo(() => {
    const fromCommands = [...new Set(quickCommands.map((c) => c.category.toLowerCase()))];
    const merged = [...new Set([...DEFAULT_CATEGORIES, ...fromCommands])];
    return merged.filter((c) => c !== "playbook"); // Exclude playbook category from Quick library filter
  }, [quickCommands]);

  const filteredQuickCommands = useMemo(() => {
    return quickCommands.filter((c) => {
      const matchCat = activeCat === "all" || c.category.toLowerCase() === activeCat;
      const matchQ = !q || c.label.toLowerCase().includes(q.toLowerCase()) || c.command.toLowerCase().includes(q.toLowerCase());
      
      let matchProj = true;
      if (selectedProjectIdFilter === "general") {
        matchProj = !c.projectId;
      } else if (selectedProjectIdFilter !== "all") {
        matchProj = c.projectId === selectedProjectIdFilter;
      }
      
      return matchCat && matchQ && matchProj;
    });
  }, [quickCommands, activeCat, q, selectedProjectIdFilter]);

  const groupedQuickCommands = useMemo(() => {
    const map = new Map<string, typeof filteredQuickCommands>();
    for (const cmd of filteredQuickCommands) {
      const cat = cmd.category.toLowerCase();
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(cmd);
    }
    return map;
  }, [filteredQuickCommands]);

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    registerCopiedCommand(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1400);
  };

  const save = () => {
    if (!draft.command.trim()) return;
    addCommand({
      label: draft.label.trim() || draft.command.trim().slice(0, 40),
      command: draft.command.trim(),
      category: commandType === "playbook" ? "playbook" : draft.category,
      projectId: draft.projectId || undefined,
    });
    setDraft({ label: "", command: "", category: "dev", projectId: "" });
    setAdding(false);
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] leading-tight font-semibold tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Commands & Playbooks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save single commands or configure interactive multi-step playbooks.
          </p>
        </div>
        <button
          onClick={() => {
            const activeProjId = (selectedProjectIdFilter !== "all" && selectedProjectIdFilter !== "general") ? selectedProjectIdFilter : "";
            setDraft({ label: "", command: "", category: "dev", projectId: activeProjId });
            setAdding(true);
          }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> New command
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Add new command</h3>
            <div className="flex bg-muted p-0.5 rounded-lg border border-border/50 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setCommandType("single")}
                className={cn(
                  "px-3 py-1.5 rounded-md transition",
                  commandType === "single" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Single Command
              </button>
              <button
                type="button"
                onClick={() => setCommandType("playbook")}
                className={cn(
                  "px-3 py-1.5 rounded-md transition",
                  commandType === "playbook" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Playbook Template
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Label / Name</label>
              <input
                autoFocus
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder={commandType === "single" ? "e.g. Start dev server" : "e.g. Setup Git Repository"}
                className="w-full text-sm rounded-md bg-background border border-border px-3 py-2 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Category</label>
              {commandType === "playbook" ? (
                <div className="w-full text-sm rounded-md bg-muted/50 border border-border px-3 py-2 text-muted-foreground font-medium select-none">
                  playbook
                </div>
              ) : (
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="w-full text-sm rounded-md bg-background border border-border px-3 py-2 outline-none focus:border-primary/50 transition"
                >
                  {DEFAULT_CATEGORIES.filter((c) => c !== "playbook").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Link to Project</label>
              <select
                value={draft.projectId}
                onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}
                className="w-full text-sm rounded-md bg-background border border-border px-3 py-2 outline-none focus:border-primary/50 transition"
              >
                <option value="">📁 General (No Project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {commandType === "single" ? "Command" : "Template Script (Use {{name}} for placeholders)"}
            </label>
            {commandType === "single" ? (
              <input
                value={draft.command}
                onChange={(e) => setDraft({ ...draft, command: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setAdding(false); }}
                placeholder="npm run dev"
                className="w-full font-mono text-sm rounded-md bg-background border border-border px-3 py-2 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
              />
            ) : (
              <Textarea
                value={draft.command}
                onChange={(e) => setDraft({ ...draft, command: e.target.value })}
                placeholder={`# Clone repository\ngit clone https://github.com/{{username}}/{{repo_name}}.git\ncd {{repo_name}}\nnpm install`}
                rows={5}
                className="w-full font-mono text-sm bg-background border border-border px-3 py-2 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
              />
            )}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => { setAdding(false); setDraft({ label: "", command: "", category: "dev", projectId: "" }); }}
              className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!draft.command.trim()}
              className="text-sm px-4 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition font-medium"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-border/80 gap-6">
        <button
          onClick={() => { setActiveTab("library"); setSelectedPlaybookId(null); }}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 -mb-px transition-all relative flex items-center gap-2",
            activeTab === "library"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Code className="h-4 w-4" />
          Quick Commands
          <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-1.5 py-0.5 rounded-md ml-1">
            {quickCommands.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("playbooks")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 -mb-px transition-all relative flex items-center gap-2",
            activeTab === "playbooks"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Playbooks & Templates
          <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-1.5 py-0.5 rounded-md ml-1">
            {allPlaybooks.length}
          </span>
        </button>
      </div>

      {/* LIBRARY TAB CONTENT */}
      {activeTab === "library" && (
        <div className="space-y-6">
          {/* Search + category filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search commands…"
                className="w-full pl-9 pr-3 py-2 rounded-md bg-card border border-border text-[13px] outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={selectedProjectIdFilter}
                onChange={(e) => setSelectedProjectIdFilter(e.target.value)}
                className="text-[12px] bg-card border border-border rounded-md px-3 py-2 outline-none font-semibold text-foreground cursor-pointer"
              >
                <option value="all">📁 All Projects</option>
                <option value="general">📄 General (No Project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    ⚙️ Project: {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border transition",
                    activeCat === cat
                      ? "bg-foreground text-background border-transparent"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {quickCommands.length === 0 && !adding && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-subtle grid place-items-center mb-4">
                <Terminal className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold">No commands yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Save your most-used CLI commands so you never have to remember them again.
              </p>
              <button
                onClick={() => { setAdding(true); setCommandType("single"); }}
                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-foreground text-background font-medium hover:bg-foreground/90 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add your first command
              </button>
            </div>
          )}

          {filteredQuickCommands.length === 0 && quickCommands.length > 0 && (
            <div className="text-sm text-muted-foreground py-10 text-center">No commands match your search.</div>
          )}

          <div className="space-y-6">
            {[...groupedQuickCommands.entries()].map(([cat, cmds]) => (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground">{cat}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">({cmds.length})</span>
                </div>
                <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
                  {cmds.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        {cmd.label && cmd.label !== cmd.command && (
                          <p className="text-[13px] font-medium text-foreground mb-0.5">{cmd.label}</p>
                        )}
                        {cmd.isMultiline || cmd.command.includes('\n') ? (
                          <pre className="text-[12.5px] font-mono text-cyan-500 bg-secondary/30 p-2 rounded block w-full mt-1 overflow-x-auto">
                            <code>{cmd.command}</code>
                          </pre>
                        ) : (
                          <code className="text-[12.5px] font-mono text-foreground/80 break-all">{cmd.command}</code>
                        )}
                      </div>
                      {cmd.projectId && (
                        <span className="shrink-0 text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={projects.find((p) => p.id === cmd.projectId)?.name || "Project"}>
                          {projects.find((p) => p.id === cmd.projectId)?.name || "project"}
                        </span>
                      )}
                      {cmd.language && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-secondary text-muted-foreground">
                          {cmd.language}
                        </span>
                      )}
                      <span className={cn(
                        "shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border",
                        catColor(cmd.category)
                      )}>
                        {cmd.category}
                      </span>
                      <button
                        onClick={() => copy(cmd.id, cmd.command)}
                        className="shrink-0 h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                        aria-label="Copy command"
                      >
                        {copiedId === cmd.id
                          ? <Check className="h-3.5 w-3.5 text-green-500" />
                          : <Copy className="h-3.5 w-3.5" />
                        }
                      </button>
                      <button
                        onClick={() => deleteCommand(cmd.id)}
                        className="shrink-0 h-8 w-8 grid place-items-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition"
                        aria-label="Delete command"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* PLAYBOOKS TAB CONTENT */}
      {activeTab === "playbooks" && (
        <div>
          {!activePlaybook ? (
            /* LIST VIEW OF PLAYBOOKS */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPlaybooks.map((p) => {
                  const steps = p.command.split("\n").filter(l => l.trim() && !l.trim().startsWith("#") && !l.trim().startsWith("//")).length;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlaybookId(p.id)}
                      className="group cursor-pointer rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-card hover:bg-secondary/20 transition duration-200 flex flex-col justify-between h-[160px] relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border",
                            catColor(p.category)
                          )}>
                            {p.category}
                          </span>
                          {p.isBuiltIn && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                              Built-in
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-2 pr-4">
                          {p.label}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-muted-foreground font-medium">
                          {steps} command{steps === 1 ? "" : "s"}
                        </span>
                        <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}

                {/* Empty State / Quick creation card */}
                <div
                  onClick={() => { setAdding(true); setCommandType("playbook"); }}
                  className="cursor-pointer border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center h-[160px] hover:border-primary/40 hover:bg-card transition"
                >
                  <Plus className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold">New Playbook Template</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Create a custom script with variables.</p>
                </div>
              </div>
            </div>
          ) : (
            /* DETAILED WORKSPACE VIEW */
            <div className="space-y-6 animate-fade-in">
              {/* Active Playbook Header */}
              <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-4">
                <button
                  onClick={() => setSelectedPlaybookId(null)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back to playbooks
                </button>
                <div className="flex items-center gap-2">
                  {!activePlaybook.isBuiltIn && (
                    <button
                      onClick={() => {
                        deleteCommand(activePlaybook.id);
                        setSelectedPlaybookId(null);
                      }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition"
                      title="Delete custom template"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Template
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* VARIABLES PANEL */}
                <div className="lg:col-span-5 space-y-5 rounded-xl border border-border bg-card/60 p-5 shadow-card">
                  <div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded border mb-2 inline-block",
                      catColor(activePlaybook.category)
                    )}>
                      {activePlaybook.category}
                    </span>
                    <h2 className="text-lg font-bold text-foreground leading-tight">{activePlaybook.label}</h2>
                    <p className="text-xs text-muted-foreground mt-1">Configure variables to customize the command list below.</p>
                  </div>

                  {/* Git URL Quick Autofill (Only visible if playbook appears related to Git or has standard git placeholders) */}
                  {(activePlaybook.id === "git-repo-init" || 
                    activePlaybook.command.includes("github.com") || 
                    activePlaybook.command.includes("USERNAME")) && (
                    <div className="space-y-1.5 p-3.5 rounded-lg bg-secondary/40 border border-border/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                          Git Repository URL Autofill
                        </label>
                        <span className="text-[9px] text-muted-foreground font-medium">Paste link to auto-fill</span>
                      </div>
                      <input
                        value={gitUrl}
                        onChange={(e) => handleGitUrlChange(e.target.value)}
                        placeholder="https://github.com/username/repo-name"
                        className="w-full text-xs font-mono rounded-md bg-background border border-border px-3 py-2 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                      />
                    </div>
                  )}

                  {/* Individual variables input */}
                  <div className="space-y-3.5">
                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Playbook Variables</h4>
                    {Object.keys(placeholderValues).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No placeholders detected in this playbook.</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(placeholderValues).map(([key, val]) => (
                          <div key={key} className="space-y-1">
                            <label className="text-xs font-mono font-semibold text-foreground/80 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                              {key}
                            </label>
                            <input
                              value={val}
                              onChange={(e) => setPlaceholderValues((prev) => ({ ...prev, [key]: e.target.value }))}
                              placeholder={key}
                              className="w-full text-sm rounded-md bg-background border border-border px-3 py-1.5 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* PREVIEW & ACTIONS PANEL */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Actions Header */}
                  <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3.5 shadow-sm">
                    <span className="text-xs font-semibold text-foreground">Interactive Playbook Steps</span>
                    <button
                      onClick={() => copy("playbook-all", renderedScript)}
                      className="inline-flex items-center gap-1.5 h-8 px-4.5 rounded-lg bg-foreground text-background text-xs font-bold hover:bg-foreground/90 transition-colors shadow-sm"
                    >
                      {copiedId === "playbook-all" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" /> Copied all steps!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy All Steps
                        </>
                      )}
                    </button>
                  </div>

                  {/* Playbook Steps Container */}
                  <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin">
                    {scriptSteps.map((step) => {
                      if (step.type === "empty") {
                        return <div key={step.id} className="h-1" />;
                      }
                      if (step.type === "comment") {
                        return (
                          <div key={step.id} className="text-xs font-semibold text-muted-foreground/90 mt-4 first:mt-0 select-none">
                            {step.text}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={step.id}
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/40 border border-border/80 hover:bg-secondary transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <code className="text-[12.5px] font-mono text-foreground break-all">{step.text}</code>
                          </div>
                          <button
                            onClick={() => copy(`step-${step.id}`, step.text)}
                            className="shrink-0 h-7 w-7 grid place-items-center rounded-md bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                            title="Copy step command"
                          >
                            {copiedId === `step-${step.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
