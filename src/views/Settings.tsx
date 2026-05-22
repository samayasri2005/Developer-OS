import { useMemo, useState } from "react";
import { Bell, Code2, LogOut, Mail, Shield, Folder as FolderIcon, Plus, Trash2, Pencil, Check, ArrowUp, ArrowDown, PlusCircle, Layers, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/store/tasks";
import {
  APP_ID,
  DEFAULT_SENDER_EMAIL,
  updateAppNotificationPreferences,
} from "@/lib/userProfile";
import { sendNotificationTestEmail } from "@/lib/emailNotifications";
import type { ProjectEnvironment } from "@/lib/types";

const Settings = () => {
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const [testingEmail, setTestingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<"account" | "folders" | "projects" | "notifications">("account");

  const folders = useTasks((s) => s.folders);
  const addFolder = useTasks((s) => s.addFolder);
  const deleteFolder = useTasks((s) => s.deleteFolder);
  const renameFolder = useTasks((s) => s.renameFolder);
  const tasks = useTasks((s) => s.tasks);
  
  const projects = useTasks((s) => s.projects);
  const updateProject = useTasks((s) => s.updateProject);
  const addProject = useTasks((s) => s.addProject);
  const deleteProject = useTasks((s) => s.deleteProject);

  const [selectedProjId, setSelectedProjId] = useState<string | null>(null);
  
  // Custom Field Form state
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  
  // Custom Stage Form state
  const [newStageName, setNewStageName] = useState("");

  // Project Create Form state
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const notificationPrefs = useMemo(
    () => userProfile?.notificationPreferences?.apps?.[APP_ID],
    [userProfile],
  );

  const saveNotifications = async (updates: {
    enabled?: boolean;
    recipientEmail?: string;
    triggers?: Record<string, boolean>;
  }) => {
    if (!user) return;

    try {
      await updateAppNotificationPreferences(user.uid, updates);
      await refreshProfile();
      toast.success("Notification settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save notification settings");
    }
  };

  const runTestEmail = async () => {
    if (!notificationPrefs?.recipientEmail) {
      toast.error("Set a recipient email first");
      return;
    }

    setTestingEmail(true);
    try {
      await sendNotificationTestEmail({
        appId: APP_ID,
        appName: "Developer OS",
        recipientEmail: notificationPrefs.recipientEmail,
      });
      toast.success("Test email request sent");
    } catch {
      toast.error("Email testing will work after Firebase Functions Gmail credentials are configured");
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1280px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your account, folders, projects, and notifications.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["account", "folders", "projects", "notifications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "folders" 
                ? "Workspace/Folders" 
                : tab === "projects" 
                ? "Projects & UI" 
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Account tab */}
        {activeTab === "account" && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Account</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Display name" value={userProfile?.displayName || user?.displayName || ""} readOnly />
              <Field label="User ID" value={user?.uid || ""} readOnly />
            </div>
            <button
              onClick={() => void signOut()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </section>
        )}

        {/* Folders tab */}
        {activeTab === "folders" && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                <FolderIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Workspace/Folders</h2>
                <p className="text-sm text-muted-foreground">Organise your tasks into folders.</p>
              </div>
            </div>

            {/* Add folder */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newFolderName.trim()) {
                  addFolder(newFolderName.trim());
                  setNewFolderName("");
                }
              }}
              className="flex gap-2 mb-5"
            >
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="New folder name…"
                className="flex-1 text-sm rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30"
              />
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </form>

            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No folders yet.</p>
            ) : (
              <div className="space-y-2">
                {folders.map((f) => {
                  const taskCount = tasks.filter((t) => t.folder === f.id).length;
                  const isEditing = editingId === f.id;
                  return (
                    <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-2.5">
                      <FolderIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { renameFolder(f.id, editName); setEditingId(null); }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 text-sm bg-transparent outline-none border-b border-primary"
                        />
                      ) : (
                        <span className="flex-1 text-sm font-medium">{f.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground tabular-nums">{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
                      {isEditing ? (
                        <button
                          onClick={() => { renameFolder(f.id, editName); setEditingId(null); }}
                          className="p-1.5 rounded-lg hover:bg-secondary text-green-500"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => { setEditingId(f.id); setEditName(f.name); }}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (taskCount > 0 && !confirm(`"${f.name}" has ${taskCount} task(s). Delete anyway?`)) return;
                          deleteFolder(f.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Projects tab */}
        {activeTab === "projects" && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Projects & UI Configuration</h2>
                <p className="text-sm text-muted-foreground">Manage dynamic metadata fields, environments, and general details for your projects.</p>
              </div>
            </div>

            {/* Select active project */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">Select Project to Configure</label>
              {projects.length === 0 ? (
                <div className="text-sm text-muted-foreground border border-dashed border-border rounded-2xl p-6 text-center">
                  No projects created yet. Create a project in the sidebar, or use the form below.
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedProjId || ""}
                    onChange={(e) => setSelectedProjId(e.target.value || null)}
                    className="flex-1 text-sm bg-background border border-border rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="">-- Choose a Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Inline create project if needed */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newProjName.trim()) {
                  const p = addProject(newProjName.trim(), newProjDesc.trim());
                  setSelectedProjId(p.id);
                  setNewProjName("");
                  setNewProjDesc("");
                  toast.success("Project created!");
                }
              }}
              className="border border-border rounded-2xl p-4 bg-background/50 space-y-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" /> Create New Project
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Project Name (e.g. My Website)"
                  className="text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none"
                />
                <input
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Short Description (optional)"
                  className="text-xs rounded-xl border border-border bg-background px-3 py-2 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!newProjName.trim()}
                className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 disabled:opacity-50 transition"
              >
                Create Project
              </button>
            </form>

            {/* Project configurator details form */}
            {(() => {
              const currentProj = projects.find((p) => p.id === selectedProjId);
              if (!currentProj) return null;

              // Ensure fields exist
              const stages = currentProj.stages || [
                { id: "development", name: "Development", enabled: true },
                { id: "staging", name: "Staging", enabled: true },
                { id: "production", name: "Production", enabled: true },
              ];
              const customFields = currentProj.customFields || [];

              const moveStage = (index: number, direction: "up" | "down") => {
                const targetIdx = direction === "up" ? index - 1 : index + 1;
                if (targetIdx < 0 || targetIdx >= stages.length) return;
                const newStages = [...stages];
                const temp = newStages[index];
                newStages[index] = newStages[targetIdx];
                newStages[targetIdx] = temp;
                updateProject(currentProj.id, { stages: newStages });
              };

              const addCustomField = (e: React.FormEvent) => {
                e.preventDefault();
                if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
                const newFields = [
                  ...customFields,
                  { id: Math.random().toString(36).slice(2, 10), label: newFieldLabel.trim(), value: newFieldValue.trim() }
                ];
                updateProject(currentProj.id, { customFields: newFields });
                setNewFieldLabel("");
                setNewFieldValue("");
                toast.success("Custom field added");
              };

              const deleteCustomField = (fieldId: string) => {
                const newFields = customFields.filter(f => f.id !== fieldId);
                updateProject(currentProj.id, { customFields: newFields });
                toast.success("Custom field removed");
              };

              const updateCustomField = (fieldId: string, updatedVal: string) => {
                const newFields = customFields.map(f => f.id === fieldId ? { ...f, value: updatedVal } : f);
                updateProject(currentProj.id, { customFields: newFields });
              };

              const addCustomStage = (e: React.FormEvent) => {
                e.preventDefault();
                if (!newStageName.trim()) return;
                const cleanId = newStageName.toLowerCase().replace(/[^a-z0-9]/g, "-") || Math.random().toString(36).slice(2, 10);
                if (stages.some(s => s.id === cleanId)) {
                  toast.error("A stage with this name already exists");
                  return;
                }
                const newStages = [...stages, { id: cleanId, name: newStageName.trim(), enabled: true }];
                const newEnvs = {
                  ...currentProj.environments,
                  [cleanId]: { deployUrl: "", firebaseProject: "", vercelProject: "", notes: "", commands: "" }
                };
                updateProject(currentProj.id, { stages: newStages, environments: newEnvs });
                setNewStageName("");
                toast.success("Custom stage added");
              };

              const toggleStage = (stageId: string, enabled: boolean) => {
                const newStages = stages.map(s => s.id === stageId ? { ...s, enabled } : s);
                updateProject(currentProj.id, { stages: newStages });
              };

              const renameStage = (stageId: string, updatedName: string) => {
                const newStages = stages.map(s => s.id === stageId ? { ...s, name: updatedName } : s);
                updateProject(currentProj.id, { stages: newStages });
              };

              const deleteStage = (stageId: string) => {
                const newStages = stages.filter(s => s.id !== stageId);
                updateProject(currentProj.id, { stages: newStages });
                toast.success("Stage removed");
              };

              return (
                <div className="space-y-6 pt-4 border-t border-border/60 animate-in fade-in duration-200">
                  {/* General Config */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Project General Info</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field
                        label="Project Name"
                        value={currentProj.name}
                        onChange={(val) => updateProject(currentProj.id, { name: val })}
                      />
                      <Field
                        label="Project Description"
                        value={currentProj.description || ""}
                        onChange={(val) => updateProject(currentProj.id, { description: val })}
                      />
                    </div>
                  </div>

                  {/* Core Fields Config */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Core Integration Fields</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field
                        label="GitHub Repository URL"
                        value={currentProj.githubRepo || ""}
                        onChange={(val) => updateProject(currentProj.id, { githubRepo: val })}
                      />
                      <Field
                        label="Vercel Project Name"
                        value={currentProj.vercelProject || ""}
                        onChange={(val) => updateProject(currentProj.id, { vercelProject: val })}
                      />
                      <Field
                        label="Firebase Project ID"
                        value={currentProj.firebaseProject || ""}
                        onChange={(val) => updateProject(currentProj.id, { firebaseProject: val })}
                      />
                    </div>
                  </div>

                  {/* Custom Metadata Fields */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Custom UI Fields</h3>
                    <div className="space-y-2">
                      {customFields.map((field) => (
                        <div key={field.id} className="flex gap-2 items-center bg-background border border-border p-2 rounded-xl">
                          <span className="text-xs font-semibold px-2 min-w-[120px] text-muted-foreground truncate">{field.label}:</span>
                          <input
                            value={field.value}
                            onChange={(e) => updateCustomField(field.id, e.target.value)}
                            className="flex-1 text-xs bg-secondary border border-border rounded-lg px-2.5 py-1.5 outline-none"
                            placeholder="Value"
                          />
                          <button
                            onClick={() => deleteCustomField(field.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add Custom Field Form */}
                      <form onSubmit={addCustomField} className="flex gap-2 items-end pt-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">Field Label (e.g. Wiki Link)</label>
                          <input
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            placeholder="e.g. Wiki URL"
                            className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none"
                          />
                        </div>
                        <div className="flex-[2] space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">Field Value</label>
                          <input
                            value={newFieldValue}
                            onChange={(e) => setNewFieldValue(e.target.value)}
                            placeholder="Value or Link URL"
                            className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                          className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition"
                        >
                          Add Field
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Infrastructure Stages Configurator */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Infrastructure Stages & Environments</h3>
                      <form onSubmit={addCustomStage} className="flex gap-2">
                        <input
                          value={newStageName}
                          onChange={(e) => setNewStageName(e.target.value)}
                          placeholder="e.g. QA, Sandbox"
                          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!newStageName.trim()}
                          className="px-2.5 py-1 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition"
                        >
                          Add Stage
                        </button>
                      </form>
                    </div>

                    <div className="space-y-3">
                      {stages.map((stage, idx) => {
                        const envData = currentProj.environments[stage.id] || {};
                        const updateEnvField = (field: keyof ProjectEnvironment, val: string) => {
                          const updatedEnvs = {
                            ...currentProj.environments,
                            [stage.id]: { ...envData, [field]: val }
                          };
                          updateProject(currentProj.id, { environments: updatedEnvs });
                        };

                        return (
                          <div key={stage.id} className="border border-border rounded-2xl p-4 bg-background/40 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveStage(idx, "up")}
                                  disabled={idx === 0}
                                  className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveStage(idx, "down")}
                                  disabled={idx === stages.length - 1}
                                  className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  value={stage.name}
                                  onChange={(e) => renameStage(stage.id, e.target.value)}
                                  className="text-xs font-semibold bg-transparent border-b border-border/40 focus:border-primary outline-none px-1 text-foreground"
                                />
                                <span className="text-[10px] text-muted-foreground font-mono">({stage.id})</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={stage.enabled}
                                    onChange={(e) => toggleStage(stage.id, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded text-primary border-border focus:ring-0 cursor-pointer accent-primary"
                                  />
                                  <span className="text-xs text-muted-foreground">Enabled</span>
                                </label>

                                {stage.id !== "development" && stage.id !== "staging" && stage.id !== "production" && (
                                  <button
                                    onClick={() => deleteStage(stage.id)}
                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {stage.enabled && (
                              <div className="grid gap-3 md:grid-cols-2 pt-1">
                                <Field
                                  label="Deploy URL"
                                  value={envData.deployUrl || ""}
                                  onChange={(val) => updateEnvField("deployUrl", val)}
                                  placeholder="https://..."
                                />
                                <Field
                                  label="Local Run / Deploy Command"
                                  value={envData.commands || ""}
                                  onChange={(val) => updateEnvField("commands", val)}
                                  placeholder="npm run dev"
                                />
                                <Field
                                  label="Firebase Project ID"
                                  value={envData.firebaseProject || ""}
                                  onChange={(val) => updateEnvField("firebaseProject", val)}
                                  placeholder="project-id"
                                />
                                <Field
                                  label="Vercel Project Name"
                                  value={envData.vercelProject || ""}
                                  onChange={(val) => updateEnvField("vercelProject", val)}
                                  placeholder="vercel-slug"
                                />
                                <div className="md:col-span-2">
                                  <label className="text-[10px] font-semibold text-muted-foreground font-sans block">Environment Notes</label>
                                  <textarea
                                    value={envData.notes || ""}
                                    onChange={(e) => updateEnvField("notes", e.target.value)}
                                    placeholder="Enter connection parameters, credentials links, or infrastructure configurations..."
                                    className="w-full text-xs bg-background border border-border rounded-xl px-3 py-2 mt-1.5 outline-none h-16 resize-none focus:ring-2 focus:ring-ring/30"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Danger zone delete project */}
                  <div className="pt-4 border-t border-destructive/20 space-y-3">
                    <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                    <div className="flex items-center justify-between border border-destructive/20 rounded-2xl p-4 bg-destructive/5">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Delete this Project</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Delete this project, its Linked Tasks, Notes, and Environments. This cannot be undone.</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete project "${currentProj.name}"? This cannot be undone.`)) {
                            deleteProject(currentProj.id);
                            setSelectedProjId(null);
                            window.dispatchEvent(new CustomEvent("flow:navigate", { detail: "today" }));
                            toast.success("Project deleted");
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-destructive/20 bg-card hover:bg-destructive hover:text-white text-xs font-semibold text-destructive transition-all"
                      >
                        Delete Project
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* Notifications tab */}
        {activeTab === "notifications" && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Email Notifications</h2>
                <p className="text-sm text-muted-foreground">Shared cross-app preferences stored in your Firebase user profile.</p>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleRow
                label="Enable email notifications"
                description="Master switch for Developer OS emails."
                checked={notificationPrefs?.enabled ?? true}
                onChange={(value) => void saveNotifications({ enabled: value })}
              />
              <ToggleRow
                label="Task reminders"
                description="Notify when high-priority tasks are due."
                checked={notificationPrefs?.triggers?.taskReminders ?? true}
                onChange={(value) => void saveNotifications({ triggers: { taskReminders: value } })}
              />
              <ToggleRow
                label="Build alerts"
                description="Notify when build or deploy workflows fail."
                checked={notificationPrefs?.triggers?.buildAlerts ?? true}
                onChange={(value) => void saveNotifications({ triggers: { buildAlerts: value } })}
              />
              <ToggleRow
                label="Notes digest"
                description="Daily summary of captured notes."
                checked={notificationPrefs?.triggers?.notesDigest ?? false}
                onChange={(value) => void saveNotifications({ triggers: { notesDigest: value } })}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Sender email" value={userProfile?.notificationPreferences?.senderEmail || DEFAULT_SENDER_EMAIL} readOnly />
              <Field
                label="Recipient email"
                value={notificationPrefs?.recipientEmail || ""}
                onChange={(value) => { void saveNotifications({ recipientEmail: value }); }}
                type="email"
              />
            </div>

            <button
              onClick={() => void runTestEmail()}
              disabled={testingEmail}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Bell className="h-4 w-4" />
              {testingEmail ? "Sending..." : "Send test email"}
            </button>
          </section>
        )}

      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: string;
  placeholder?: string;
}) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
    />
  </label>
);

const ToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3">
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-accent" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  </div>
);

export default Settings;
