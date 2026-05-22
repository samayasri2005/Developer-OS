import { useState, useMemo } from "react";
import { useTasks } from "@/store/tasks";
import {
  Cpu, Terminal, Notebook, CheckSquare, Plus, Trash2,
  ExternalLink, Copy, Check, FileText, Globe, GitBranch,
  PlayCircle, Edit3, Save, X, ArrowUpRight, Link2, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ProjectEnvironment, Priority, LinkRef } from "@/lib/types";

interface Props {
  projectId: string;
}

export function ProjectWorkspace({ projectId }: Props) {
  const projects = useTasks((s) => s.projects);
  const updateProject = useTasks((s) => s.updateProject);
  const deleteProject = useTasks((s) => s.deleteProject);
  const selectProject = useTasks((s) => s.selectProject);

  const tasks = useTasks((s) => s.tasks);
  const addTask = useTasks((s) => s.addTask);
  const toggleDone = useTasks((s) => s.toggleDone);
  const selectTask = useTasks((s) => s.selectTask);

  const improvements = useTasks((s) => s.improvements);
  const addImprovement = useTasks((s) => s.addImprovement);
  const toggleImprovement = useTasks((s) => s.toggleImprovement);
  const deleteImprovement = useTasks((s) => s.deleteImprovement);
  const convertImprovementToTask = useTasks((s) => s.convertImprovementToTask);

  const notes = useTasks((s) => s.notes);
  const addNote = useTasks((s) => s.addNote);
  const selectNote = useTasks((s) => s.selectNote);

  const commands = useTasks((s) => s.commands);
  const addCommand = useTasks((s) => s.addCommand);
  const deleteCommand = useTasks((s) => s.deleteCommand);
  const registerCopiedCommand = useTasks((s) => s.registerCopiedCommand);

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);

  const [activeTab, setActiveTab] = useState<"environments" | "tasks" | "improvements" | "notes" | "links" | "commands">("environments");

  // Local state for inline forms
  const [editingEnv, setEditingEnv] = useState<string | null>(null);
  const [envForm, setEnvForm] = useState<ProjectEnvironment>({});

  // Local state for modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    githubRepo: "",
    vercelProject: "",
    firebaseProject: "",
    customFields: [] as { id: string; label: string; value: string }[],
  });

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");

  // Inline adds
  const [taskTitle, setTaskTitle] = useState("");
  const [impTitle, setImpTitle] = useState("");
  const [impPriority, setImpPriority] = useState<Priority>("medium");
  const [cmdLabel, setCmdLabel] = useState("");
  const [cmdText, setCmdText] = useState("");
  const [cmdCat, setCmdCat] = useState("Setup");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Cpu className="h-10 w-10 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">Project not found</h3>
        <p className="text-sm text-muted-foreground mt-1">Please select another project from the sidebar.</p>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    registerCopiedCommand(text);
    setCopiedId(id);
    toast.success("Command copied to clipboard");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleStartEditEnv = (env: string) => {
    setEditingEnv(env);
    setEnvForm({ ...project.environments[env] });
  };

  const handleSaveEnv = (env: string) => {
    const updatedEnvs = {
      ...project.environments,
      [env]: envForm,
    };
    updateProject(project.id, { environments: updatedEnvs });
    setEditingEnv(null);
    toast.success(`Saved ${env} environment settings`);
  };

  const handleOpenConfigModal = () => {
    setConfigForm({
      githubRepo: project.githubRepo || "",
      vercelProject: project.vercelProject || "",
      firebaseProject: project.firebaseProject || "",
      customFields: project.customFields ? [...project.customFields] : [],
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = () => {
    updateProject(project.id, {
      githubRepo: configForm.githubRepo,
      vercelProject: configForm.vercelProject,
      firebaseProject: configForm.firebaseProject,
      customFields: configForm.customFields,
    });
    setIsConfigModalOpen(false);
    toast.success("Project settings updated");
  };

  const handleOpenNoteModal = () => {
    setNewNoteTitle("");
    setIsNoteModalOpen(true);
  };

  const handleCreateNote = () => {
    const title = newNoteTitle.trim() || "Untitled Note";
    const n = addNote({ title, projectId: project.id });
    selectNote(n.id);
    setIsNoteModalOpen(false);
    window.dispatchEvent(new CustomEvent("flow:navigate", { detail: "notes" }));
    toast.success("Note created inside project");
  };

  const stages = useMemo(() => {
    return project.stages || [
      { id: "development", name: "Development", enabled: true },
      { id: "staging", name: "Staging", enabled: true },
      { id: "production", name: "Production", enabled: true },
    ];
  }, [project.stages]);

  const enabledStages = useMemo(() => {
    return stages.filter((s) => s.enabled);
  }, [stages]);

  const handleDeleteProject = () => {
    if (confirm(`Are you sure you want to delete project "${project.name}"? This cannot be undone.`)) {
      deleteProject(project.id);
      selectProject(null);
      window.dispatchEvent(new CustomEvent("flow:navigate", { detail: "today" }));
      toast.success("Project deleted");
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    const newLink: LinkRef = {
      id: Math.random().toString(36).slice(2, 10),
      url: formattedUrl,
      title: linkTitle.trim() || formattedUrl,
      createdAt: new Date().toISOString(),
    };

    const currentLinks = project.links || [];
    updateProject(project.id, {
      links: [...currentLinks, newLink],
    });

    setLinkTitle("");
    setLinkUrl("");
    toast.success("Link added successfully");
  };

  const handleDeleteLink = (linkId: string) => {
    const currentLinks = project.links || [];
    updateProject(project.id, {
      links: currentLinks.filter((l) => l.id !== linkId),
    });
    toast.success("Link removed");
  };

  // Filters for project-linked entities
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectImprovements = improvements.filter((imp) => imp.projectId === project.id);
  const projectNotes = notes.filter((n) => n.projectId === project.id);
  const projectCommands = commands.filter((c) => c.projectId === project.id);

  return (
    <div className="space-y-6 pb-10 max-w-[1280px]">
      {/* Project Header Card */}
      <div className="rounded-xl border border-border bg-card shadow-card p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 grid place-items-center text-cyan-500">
              <Cpu className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground max-w-2xl">{project.description}</p>
          )}

          {/* Core Repositories / Integration URLs */}
          <div className="flex items-center gap-4 flex-wrap pt-2 text-xs">
            {project.githubRepo && (
              <a
                href={project.githubRepo}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>Repository</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
            {project.vercelProject && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="font-semibold text-foreground/80">Vercel:</span>
                <span>{project.vercelProject}</span>
              </div>
            )}
            {project.firebaseProject && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="font-semibold text-foreground/80">Firebase:</span>
                <span>{project.firebaseProject}</span>
              </div>
            )}
            {project.customFields && project.customFields.map((field) => {
              const isUrl = /^https?:\/\//i.test(field.value);
              return (
                <div key={field.id} className="flex items-center gap-1 text-muted-foreground border-l border-border/40 pl-3 first:border-0 first:pl-0">
                  <span className="font-semibold text-foreground/80">{field.label}:</span>
                  {isUrl ? (
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span className="truncate max-w-[150px]">{field.value}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="truncate max-w-[150px]">{field.value}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
          <button
            onClick={handleOpenConfigModal}
            className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground transition-colors"
          >
            Configure Info
          </button>
          <button
            onClick={handleDeleteProject}
            className="p-1.5 rounded-lg border border-destructive/20 hover:border-destructive/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
            title="Delete Project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-px">
        {([
          { id: "environments", label: "Infrastructure & Envs", icon: Globe },
          { id: "tasks", label: `Tasks (${projectTasks.filter((t) => t.status !== "done").length})`, icon: CheckSquare },
          { id: "improvements", label: `Improvements (${projectImprovements.filter((i) => !i.done).length})`, icon: Sparkles },
          { id: "notes", label: `Notes (${projectNotes.length})`, icon: Notebook },
          { id: "links", label: `Links (${(project.links || []).length})`, icon: Link2 },
          { id: "commands", label: `CLI Snippets (${projectCommands.length})`, icon: Terminal },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all no-tap-highlight",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* TAB 1: Environments */}
        {activeTab === "environments" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledStages.length === 0 ? (
              <div className="col-span-full text-center py-12 border border-dashed border-border rounded-2xl text-xs text-muted-foreground bg-card">
                No environment stages enabled. Enable them in the Projects & UI settings!
              </div>
            ) : (
              enabledStages.map((stage) => {
                const env = stage.id;
                const data = project.environments[env] || {};
                const isEditing = editingEnv === env;
                return (
                  <div key={env} className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:shadow-card transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={cn(
                          "text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded",
                          env === "development" && "bg-cyan-500/10 text-cyan-500",
                          env === "staging" && "bg-amber-500/10 text-amber-500",
                          env === "production" && "bg-green-500/10 text-green-500",
                          !["development", "staging", "production"].includes(env) && "bg-purple-500/10 text-purple-500"
                        )}>
                          {stage.name}
                        </span>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSaveEnv(env)}
                              className="p-1 rounded bg-foreground text-background hover:opacity-90"
                              aria-label="Save"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingEnv(null)}
                              className="p-1 rounded border border-border hover:bg-secondary text-muted-foreground"
                              aria-label="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditEnv(env)}
                            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 pt-1">
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground">Deploy URL</label>
                            <input
                              type="text"
                              value={envForm.deployUrl || ""}
                              onChange={(e) => setEnvForm({ ...envForm, deployUrl: e.target.value })}
                              placeholder="https://..."
                              className="w-full text-xs bg-secondary border border-border rounded px-2 py-1 mt-1 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground">Firebase Project</label>
                            <input
                              type="text"
                              value={envForm.firebaseProject || ""}
                              onChange={(e) => setEnvForm({ ...envForm, firebaseProject: e.target.value })}
                              placeholder="project-id"
                              className="w-full text-xs bg-secondary border border-border rounded px-2 py-1 mt-1 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground">Vercel Project Name</label>
                            <input
                              type="text"
                              value={envForm.vercelProject || ""}
                              onChange={(e) => setEnvForm({ ...envForm, vercelProject: e.target.value })}
                              placeholder="vercel-slug"
                              className="w-full text-xs bg-secondary border border-border rounded px-2 py-1 mt-1 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground">Local / Run Command</label>
                            <input
                              type="text"
                              value={envForm.commands || ""}
                              onChange={(e) => setEnvForm({ ...envForm, commands: e.target.value })}
                              placeholder="npm run dev"
                              className="w-full text-xs font-mono bg-secondary border border-border rounded px-2 py-1 mt-1 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground">Environment Notes</label>
                            <textarea
                              value={envForm.notes || ""}
                              onChange={(e) => setEnvForm({ ...envForm, notes: e.target.value })}
                              placeholder="Configuration details..."
                              className="w-full text-xs bg-secondary border border-border rounded px-2 py-1 mt-1 outline-none h-16 resize-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-1">
                          <div>
                            <div className="text-[10px] font-medium text-muted-foreground">Deploy Endpoint</div>
                            {data.deployUrl ? (
                              <a
                                href={data.deployUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 mt-1"
                              >
                                <span className="truncate max-w-[200px]">{data.deployUrl}</span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground italic mt-1 block">Not deployed</span>
                            )}
                          </div>

                          {data.commands && (
                            <div>
                              <div className="text-[10px] font-medium text-muted-foreground">Run Command</div>
                              <div className="flex items-center justify-between gap-2 bg-secondary/80 border border-border/40 rounded px-2 py-1 mt-1">
                                <code className="text-xs font-mono truncate text-cyan-500">{data.commands}</code>
                                <button
                                  onClick={() => handleCopy(data.commands!, `${env}-cmd`)}
                                  className="text-muted-foreground hover:text-foreground shrink-0 p-0.5 rounded hover:bg-secondary"
                                >
                                  {copiedId === `${env}-cmd` ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] font-medium text-muted-foreground block">Firebase ID</span>
                              <span className="truncate block mt-0.5 font-mono">{data.firebaseProject || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium text-muted-foreground block">Vercel Config</span>
                              <span className="truncate block mt-0.5 font-mono">{data.vercelProject || "—"}</span>
                            </div>
                          </div>

                          {data.notes && (
                            <div className="pt-2 border-t border-border/40">
                              <span className="text-[10px] font-medium text-muted-foreground block">Notes</span>
                              <p className="text-xs text-foreground/80 mt-1 whitespace-pre-wrap leading-relaxed">
                                {data.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!isEditing && data.deployUrl && (
                      <a
                        href={data.deployUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Launch Instance
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: Project Tasks */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (taskTitle.trim()) {
                  addTask({ title: taskTitle.trim(), projectId: project.id });
                  setTaskTitle("");
                  toast.success("Task added to project");
                }
              }}
              className="flex gap-2"
            >
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a task for this project..."
                className="flex-1 text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Task
              </button>
            </form>

            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 content-start">
              {projectTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No tasks linked to this project yet. Add one above!
                </div>
              ) : (
                projectTasks.map((t) => {
                  const isDone = t.status === "done";
                  return (
                    <div
                      key={t.id}
                      onClick={() => selectTask(t.id)}
                      className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleDone(t.id);
                        }}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-0 cursor-pointer accent-primary shrink-0"
                      />
                      <span className={cn(
                        "flex-1 text-xs truncate",
                        isDone && "line-through text-muted-foreground"
                      )}>
                        {t.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded capitalize shrink-0">
                        {t.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Improvements Checklist */}
        {activeTab === "improvements" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (impTitle.trim()) {
                  addImprovement(project.id, impTitle.trim(), impPriority);
                  setImpTitle("");
                  toast.success("Improvement idea added");
                }
              }}
              className="flex gap-2 flex-wrap items-center"
            >
              <input
                value={impTitle}
                onChange={(e) => setImpTitle(e.target.value)}
                placeholder="Have a quick improvement idea?"
                className="flex-1 min-w-[200px] text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={impPriority}
                onChange={(e) => setImpPriority(e.target.value as Priority)}
                className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Track Idea
              </button>
            </form>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              {projectImprovements.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No improvement ideas captured yet. Save quick workstation notes here!
                </div>
              ) : (
                projectImprovements.map((imp) => {
                  return (
                    <div
                      key={imp.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-secondary/30 hover:bg-secondary/70 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={imp.done}
                        onChange={() => toggleImprovement(imp.id)}
                        className="h-4 w-4 rounded text-primary border-border focus:ring-0 cursor-pointer accent-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-xs block truncate font-medium",
                          imp.done && "line-through text-muted-foreground"
                        )}>
                          {imp.title}
                        </span>
                      </div>

                      {/* Info Badge */}
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0",
                        imp.priority === "high" && "bg-red-500/10 text-red-500",
                        imp.priority === "medium" && "bg-amber-500/10 text-amber-500",
                        imp.priority === "low" && "bg-green-500/10 text-green-500"
                      )}>
                        {imp.priority || "medium"}
                      </span>

                      {/* Convert to task */}
                      {!imp.done && (
                        <button
                          onClick={() => {
                            convertImprovementToTask(imp.id);
                            toast.success("Converted idea to active task");
                          }}
                          className="px-2 py-1 rounded border border-border bg-card hover:bg-secondary text-[10px] font-semibold text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        >
                          Convert to Task
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => {
                          deleteImprovement(imp.id);
                          toast.success("Idea removed");
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Project Notes */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Keep architectural logs and tech specs connected.</span>
              <button
                onClick={handleOpenNoteModal}
                className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> New Note
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projectNotes.length === 0 ? (
                <div className="col-span-2 text-center py-10 border border-border/50 rounded-xl text-xs text-muted-foreground bg-card">
                  No notes linked to this project yet. Write documentation above!
                </div>
              ) : (
                projectNotes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      selectNote(n.id);
                      window.dispatchEvent(new CustomEvent("flow:navigate", { detail: "notes" }));
                    }}
                    className="group border border-border hover:border-foreground/20 rounded-xl bg-card p-4 hover:shadow-card transition-all cursor-pointer flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate group-hover:text-primary transition-colors">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {n.content ? n.content.replace(/[#*`]/g, "").slice(0, 100) : "Empty note content..."}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Project Links (Missing Resource Linking Feature) */}
        {activeTab === "links" && (
          <div className="space-y-4">
            <form onSubmit={handleAddLink} className="flex gap-2 flex-wrap items-center">
              <input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Link Title (e.g., API Reference)"
                className="flex-1 min-w-[180px] text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="URL (e.g., https://api.example.com/docs)"
                required
                className="flex-[2] min-w-[240px] text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Save Link
              </button>
            </form>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              {!(project.links && project.links.length > 0) ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No resource links saved for this project yet. Add one above!
                </div>
              ) : (
                project.links.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border/40 bg-secondary/20 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-medium text-foreground block truncate">{link.title}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-muted-foreground hover:underline truncate block"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: Commands */}
        {activeTab === "commands" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (cmdLabel.trim() && cmdText.trim()) {
                  addCommand({
                    label: cmdLabel.trim(),
                    command: cmdText.trim(),
                    category: cmdCat,
                    projectId: project.id,
                  });
                  setCmdLabel("");
                  setCmdText("");
                  setCmdCat("Setup");
                  toast.success("Command snippet registered");
                }
              }}
              className="flex gap-2 flex-wrap items-end border border-border bg-card p-4 rounded-xl"
            >
              <div className="flex-1 min-w-[140px] space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Label</label>
                <input
                  value={cmdLabel}
                  onChange={(e) => setCmdLabel(e.target.value)}
                  placeholder="e.g. Deploy Production"
                  className="w-full text-xs bg-secondary border border-border rounded px-2.5 py-1.5 outline-none"
                />
              </div>
              <div className="flex-[2] min-w-[200px] space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Command Snippet</label>
                <input
                  value={cmdText}
                  onChange={(e) => setCmdText(e.target.value)}
                  placeholder="e.g. firebase deploy --only hosting"
                  className="w-full text-xs font-mono bg-secondary border border-border rounded px-2.5 py-1.5 outline-none"
                />
              </div>
              <div className="w-[120px] space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Category</label>
                <select
                  value={cmdCat}
                  onChange={(e) => setCmdCat(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="Setup">Setup</option>
                  <option value="Run">Run</option>
                  <option value="Build">Build</option>
                  <option value="Deploy">Deploy</option>
                  <option value="Utils">Utils</option>
                </select>
              </div>
              <button
                type="submit"
                className="h-8 px-4 rounded bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Add Snippet
              </button>
            </form>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              {projectCommands.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No CLI command snippets registered for this project yet. Add one above!
                </div>
              ) : (
                projectCommands.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border/40 bg-secondary/35"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{c.label}</span>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 rounded">
                          {c.category}
                        </span>
                      </div>
                      <code className="text-[11px] font-mono text-cyan-500 block truncate mt-1">{c.command}</code>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(c.command, `${c.id}-copy`)}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy Command"
                      >
                        {copiedId === `${c.id}-copy` ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          deleteCommand(c.id);
                          toast.success("Snippet removed");
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        title="Remove Snippet"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Configure Project Info Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in scale-in duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-500" />
                <h3 className="font-semibold text-lg text-foreground">Configure Project Info</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">GitHub Repository URL</label>
                <input
                  type="text"
                  value={configForm.githubRepo}
                  onChange={(e) => setConfigForm({ ...configForm, githubRepo: e.target.value })}
                  placeholder="https://github.com/username/repo"
                  className="w-full text-xs bg-secondary border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Vercel Project Name</label>
                <input
                  type="text"
                  value={configForm.vercelProject}
                  onChange={(e) => setConfigForm({ ...configForm, vercelProject: e.target.value })}
                  placeholder="vercel-project-name"
                  className="w-full text-xs bg-secondary border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Firebase Project ID</label>
                <input
                  type="text"
                  value={configForm.firebaseProject}
                  onChange={(e) => setConfigForm({ ...configForm, firebaseProject: e.target.value })}
                  placeholder="firebase-project-id"
                  className="w-full text-xs bg-secondary border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              {configForm.customFields.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <h4 className="text-xs font-semibold text-foreground">Custom Metadata Fields</h4>
                  {configForm.customFields.map((field, idx) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => {
                          const updated = [...configForm.customFields];
                          updated[idx] = { ...updated[idx], value: e.target.value };
                          setConfigForm({ ...configForm, customFields: updated });
                        }}
                        className="w-full text-xs bg-secondary border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateNote();
            }}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in scale-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Notebook className="h-5 w-5 text-cyan-500" />
                <h3 className="font-semibold text-lg text-foreground">Create New Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Note Title</label>
              <input
                type="text"
                autoFocus
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="e.g. System Architecture Design"
                className="w-full text-xs bg-secondary border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-muted-foreground transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition"
              >
                Create Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
