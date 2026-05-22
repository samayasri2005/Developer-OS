import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Bell,
  Code2,
  LogOut,
  Mail,
  Shield,
  Folder as FolderIcon,
  Plus,
  Trash2,
  Pencil,
  Check,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Layers,
  Settings2,
  X,
  Calendar,
  RefreshCw,
  Terminal,
  Globe,
  Sliders,
  Play,
  Briefcase,
  AlertTriangle,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/store/tasks";
import {
  APP_ID,
  DEFAULT_SENDER_EMAIL,
  updateAppNotificationPreferences,
} from "@/lib/userProfile";
import { sendNotificationTestEmail } from "@/lib/emailNotifications";
import type { Project, ProjectEnvironment } from "@/lib/types";

const Settings = () => {
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const [testingEmail, setTestingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<"account" | "folders" | "projects" | "gcal" | "notifications">("account");

  const folders = useTasks((s) => s.folders);
  const addFolder = useTasks((s) => s.addFolder);
  const deleteFolder = useTasks((s) => s.deleteFolder);
  const renameFolder = useTasks((s) => s.renameFolder);
  const tasks = useTasks((s) => s.tasks);
  
  const projects = useTasks((s) => s.projects);
  const updateProject = useTasks((s) => s.updateProject);
  const addProject = useTasks((s) => s.addProject);
  const deleteProject = useTasks((s) => s.deleteProject);

  // Google Calendar Store state
  const gcalConnected = useTasks((s) => s.gcalConnected);
  const gcalEmail = useTasks((s) => s.gcalEmail);
  const gcalSyncEnabled = useTasks((s) => s.gcalSyncEnabled);
  const gcalSyncLogs = useTasks((s) => s.gcalSyncLogs);
  const gcalClientId = useTasks((s) => s.gcalClientId);
  const gcalApiKey = useTasks((s) => s.gcalApiKey);
  const isSimulatedSync = useTasks((s) => s.isSimulatedSync);

  // GCal store actions
  const connectGCal = useTasks((s) => s.connectGCal);
  const disconnectGCal = useTasks((s) => s.disconnectGCal);
  const toggleGCalSync = useTasks((s) => s.toggleGCalSync);
  const saveGCalCredentials = useTasks((s) => s.saveGCalCredentials);
  const syncGCal = useTasks((s) => s.syncGCal);

  // GCal local inputs
  const [gcalEmailInput, setGcalEmailInput] = useState(gcalEmail || "");
  const [gcalClientIdInput, setGcalClientIdInput] = useState(gcalClientId || "");
  const [gcalApiKeyInput, setGcalApiKeyInput] = useState(gcalApiKey || "");
  const [gcalSimulatedInput, setGcalSimulatedInput] = useState(isSimulatedSync);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal control
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configProjectId, setConfigProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Project inputs
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  // Custom Field Form state inside modal
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  
  // Custom Stage Form state inside modal
  const [newStageName, setNewStageName] = useState("");

  // Folder tab inputs
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Update calendar forms inputs when store variables change
  useEffect(() => {
    setGcalEmailInput(gcalEmail || "");
    setGcalClientIdInput(gcalClientId || "");
    setGcalApiKeyInput(gcalApiKey || "");
    setGcalSimulatedInput(isSimulatedSync);
  }, [gcalEmail, gcalClientId, gcalApiKey, isSimulatedSync]);

  const activeProjectForConfig = useMemo(() => {
    return projects.find((p) => p.id === configProjectId) || null;
  }, [projects, configProjectId]);

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
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save notifications settings");
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
      toast.success("Notification test email sent");
    } catch {
      toast.error("Test email requires firebase functions configuration");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleConnectGCal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gcalEmailInput.trim()) {
      toast.error("Please enter a valid Google Account email");
      return;
    }
    // Save any credentials entered
    saveGCalCredentials(gcalClientIdInput.trim(), gcalApiKeyInput.trim());
    connectGCal(gcalEmailInput.trim(), gcalSimulatedInput);
    toast.success("Google Calendar connected successfully!");
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    await syncGCal();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6 max-w-[1280px] pb-10">
      <div>
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Workstation Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure developer workflows, folder routing, integration endpoints, and schedule sync settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border bg-muted/20 p-1 rounded-lg max-w-fit">
        {(["account", "folders", "projects", "gcal", "notifications"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "folders" 
              ? "Folders" 
              : tab === "projects" 
              ? "Project Configurations" 
              : tab === "gcal" 
              ? "Google Calendar Sync" 
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {activeTab === "account" && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2.5 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">User Session</h2>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Display Name" value={userProfile?.displayName || user?.displayName || "Developer"} readOnly />
            <Field label="UID / User ID" value={user?.uid || ""} readOnly />
          </div>
          <button
            onClick={() => void signOut()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold bg-card hover:bg-secondary transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </section>
      )}

      {/* Folders Tab */}
      {activeTab === "folders" && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2.5 text-primary">
              <FolderIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Task Directories / Folders</h2>
              <p className="text-xs text-muted-foreground">Manage and filter general work classifications.</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newFolderName.trim()) {
                addFolder(newFolderName.trim());
                setNewFolderName("");
                toast.success("Folder directory added");
              }
            }}
            className="flex gap-2"
          >
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Infrastructure, Frontend, Core Libs..."
              className="flex-1 text-xs rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 disabled:opacity-50 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add Folder
            </button>
          </form>

          {folders.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No folder directories configured.</p>
          ) : (
            <div className="space-y-2">
              {folders.map((f) => {
                const taskCount = tasks.filter((t) => t.folder === f.id).length;
                const isEditing = editingId === f.id;
                return (
                  <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5">
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
                        className="flex-1 text-xs bg-transparent outline-none border-b border-primary text-foreground"
                      />
                    ) : (
                      <span className="flex-1 text-xs font-medium text-foreground">{f.name}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono tabular-nums">{taskCount} tasks</span>
                    
                    {isEditing ? (
                      <button
                        onClick={() => { renameFolder(f.id, editName); setEditingId(null); }}
                        className="p-1.5 rounded hover:bg-secondary text-green-500"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditingId(f.id); setEditName(f.name); }}
                        className="p-1.5 rounded hover:bg-secondary text-muted-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (taskCount > 0 && !confirm(`"${f.name}" has ${taskCount} task(s). Delete anyway?`)) return;
                        deleteFolder(f.id);
                        toast.success("Folder deleted");
                      }}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-red-500 transition"
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

      {/* Projects Config Tab */}
      {activeTab === "projects" && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2.5 text-primary">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Active Engineering Projects</h2>
                <p className="text-xs text-muted-foreground">Configure custom tags, deploy endpoints, and stages to match your workstation UI.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setNewProjName("");
                setNewProjDesc("");
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-xs text-muted-foreground border border-dashed border-border rounded-xl p-8 text-center">
              No active projects. Create one to enable custom stage pipelines and linked tracking.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((p) => {
                const linkedTasksCount = tasks.filter((t) => t.projectId === p.id).length;
                return (
                  <div key={p.id} className="bg-background border border-border p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-foreground/20 transition-all">
                    <div>
                      <h3 className="text-xs font-bold text-foreground truncate">{p.name}</h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{p.description || "No description set."}</p>
                      <div className="flex gap-2 flex-wrap mt-3">
                        <span className="text-[9px] font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                          {linkedTasksCount} Tasks
                        </span>
                        {p.githubRepo && (
                          <span className="text-[9px] font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded text-cyan-500 truncate max-w-[140px]" title={p.githubRepo}>
                            GitHub
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
                      <button
                        onClick={() => {
                          setConfigProjectId(p.id);
                          setIsConfigModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground transition-all"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Configure
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete project "${p.name}"? This removes linked deploy targets and can't be undone.`)) {
                            deleteProject(p.id);
                            toast.success("Project deleted");
                          }
                        }}
                        className="h-8 w-8 grid place-items-center rounded-lg border border-red-500/10 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Google Calendar Sync Tab */}
      {activeTab === "gcal" && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2.5 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Google Calendar Synchronization</h2>
              <p className="text-xs text-muted-foreground">Integrate two-way sync for daily workstation standups, deploy windows, and schedule tasks.</p>
            </div>
          </div>

          {!gcalConnected ? (
            <form onSubmit={handleConnectGCal} className="max-w-md border border-border bg-background p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Connect Google Account
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground" htmlFor="gcal-email">
                  Google Account Email Address *
                </label>
                <input
                  id="gcal-email"
                  type="email"
                  required
                  placeholder="e.g. developer@gmail.com"
                  value={gcalEmailInput}
                  onChange={(e) => setGcalEmailInput(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground" htmlFor="gcal-client-id">
                  OAuth Client ID (Optional)
                </label>
                <input
                  id="gcal-client-id"
                  type="text"
                  placeholder="Enter GCP client id slug..."
                  value={gcalClientIdInput}
                  onChange={(e) => setGcalClientIdInput(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground" htmlFor="gcal-api-key">
                  Google API Key (Optional)
                </label>
                <input
                  id="gcal-api-key"
                  type="password"
                  placeholder="Enter GCP developer api key..."
                  value={gcalApiKeyInput}
                  onChange={(e) => setGcalApiKeyInput(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gcalSimulatedInput}
                    onChange={(e) => setGcalSimulatedInput(e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-primary border-border focus:ring-0 accent-primary"
                  />
                  <div className="text-[11px]">
                    <span className="font-semibold text-foreground">Sandbox Simulation</span>
                    <p className="text-[9px] text-muted-foreground">Load test seed meetings offline (recommended)</p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition"
              >
                Connect Calendar
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Connected Status Card */}
              <div className="flex items-center justify-between p-4 border border-green-500/20 bg-green-500/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Synchronization Active</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Linked Account: <strong className="text-foreground">{gcalEmail}</strong></p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1 h-8 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold transition disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                    Sync Now
                  </button>
                  <button
                    onClick={() => {
                      disconnectGCal();
                      toast.success("Disconnected Google Calendar");
                    }}
                    className="flex items-center gap-1 h-8 px-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-xs font-semibold text-red-500 transition"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Sync settings toggles */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="border border-border p-4 rounded-xl space-y-3 bg-background/50">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Sync Options</h4>
                  <label className="flex items-center justify-between py-1 cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground">Two-way Sync</span>
                      <p className="text-[10px] text-muted-foreground">Instantly write new calendar events back to Google.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={gcalSyncEnabled}
                      onChange={(e) => toggleGCalSync(e.target.checked)}
                      className="h-4 w-4 rounded border-border focus:ring-0 accent-primary"
                    />
                  </label>
                  <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>Mode: {isSimulatedSync ? "Sandbox (Seed simulator)" : "Production (OAuth API)"}</span>
                  </div>
                </div>

                {/* API Info editing */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveGCalCredentials(gcalClientIdInput.trim(), gcalApiKeyInput.trim());
                    toast.success("API Credentials saved");
                  }}
                  className="border border-border p-4 rounded-xl space-y-3 bg-background/50"
                >
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">API Config</h4>
                  <div className="grid gap-2">
                    <input
                      value={gcalClientIdInput}
                      onChange={(e) => setGcalClientIdInput(e.target.value)}
                      placeholder="OAuth Client ID"
                      className="text-[11px] bg-secondary border border-border rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
                    />
                    <input
                      type="password"
                      value={gcalApiKeyInput}
                      onChange={(e) => setGcalApiKeyInput(e.target.value)}
                      placeholder="Google API Key"
                      className="text-[11px] bg-secondary border border-border rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-8 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition"
                  >
                    Update Key Credentials
                  </button>
                </form>
              </div>

              {/* Sync logs window */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Activity Synchronization Logs</h4>
                <div className="h-40 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-[10px] leading-relaxed text-emerald-500 overflow-y-auto scrollbar-thin select-text">
                  {gcalSyncLogs.length === 0 ? (
                    <span className="text-slate-500 italic">[Idle] No log entries captured.</span>
                  ) : (
                    gcalSyncLogs.map((log, idx) => (
                      <div key={idx} className="truncate">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2.5 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Shared Alert Notifications</h2>
              <p className="text-xs text-muted-foreground">Manage profile notifications settings synced with Google Cloud.</p>
            </div>
          </div>

          <div className="space-y-3">
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

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Sender Email" value={userProfile?.notificationPreferences?.senderEmail || DEFAULT_SENDER_EMAIL} readOnly />
            <Field
              label="Recipient Email"
              value={notificationPrefs?.recipientEmail || ""}
              onChange={(value) => { void saveNotifications({ recipientEmail: value }); }}
              type="email"
            />
          </div>

          <button
            onClick={() => void runTestEmail()}
            disabled={testingEmail}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground hover:opacity-90 disabled:opacity-60 transition"
          >
            <Bell className="h-4 w-4" />
            {testingEmail ? "Sending Alert..." : "Test Dispatch Alert"}
          </button>
        </section>
      )}

      {/* Pop-up Modals */}
      
      {/* 1. Create Project Pop-up Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm select-text">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-card overflow-hidden flex flex-col bg-opacity-95 backdrop-blur-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Create New Project</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newProjName.trim()) {
                  const p = addProject(newProjName.trim(), newProjDesc.trim());
                  setIsCreateModalOpen(false);
                  setConfigProjectId(p.id);
                  setIsConfigModalOpen(true);
                  toast.success("Project created! Configure additional targets below.");
                }
              }}
              className="p-5 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="proj-name">
                  Project Name *
                </label>
                <input
                  id="proj-name"
                  required
                  placeholder="e.g. Personal Command Center"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="proj-desc">
                  Project Description
                </label>
                <textarea
                  id="proj-desc"
                  placeholder="e.g. Master developer OS layout styling rules."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 outline-none h-20 resize-none text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-9 px-4 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjName.trim()}
                  className="h-9 px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold transition disabled:opacity-50"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Configure Project Pop-up Modal */}
      {isConfigModalOpen && activeProjectForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm select-text">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-card overflow-hidden flex flex-col bg-opacity-95 backdrop-blur-md max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
              <div>
                <h3 className="text-sm font-bold text-foreground">Configure Project: {activeProjectForConfig.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">ID: {activeProjectForConfig.id}</p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
              
              {/* Section 1: General details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> General Info
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field
                    label="Project Name"
                    value={activeProjectForConfig.name}
                    onChange={(val) => updateProject(activeProjectForConfig.id, { name: val })}
                  />
                  <Field
                    label="Project Description"
                    value={activeProjectForConfig.description || ""}
                    onChange={(val) => updateProject(activeProjectForConfig.id, { description: val })}
                  />
                </div>
              </div>

              {/* Section 2: Core Targets */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Core Target Integrations
                </h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field
                    label="GitHub Repo URL"
                    value={activeProjectForConfig.githubRepo || ""}
                    onChange={(val) => updateProject(activeProjectForConfig.id, { githubRepo: val })}
                  />
                  <Field
                    label="Vercel Project ID / Slug"
                    value={activeProjectForConfig.vercelProject || ""}
                    onChange={(val) => updateProject(activeProjectForConfig.id, { vercelProject: val })}
                  />
                  <Field
                    label="Firebase Project ID"
                    value={activeProjectForConfig.firebaseProject || ""}
                    onChange={(val) => updateProject(activeProjectForConfig.id, { firebaseProject: val })}
                  />
                </div>
              </div>

              {/* Section 3: Custom Field Schema */}
              <div className="space-y-3 border-t border-border/50 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5" /> Custom Metadata Fields
                </h4>
                
                <div className="space-y-2">
                  {(activeProjectForConfig.customFields || []).map((field) => (
                    <div key={field.id} className="flex gap-2 items-center bg-secondary border border-border/60 p-2 rounded-lg">
                      <span className="text-xs font-semibold px-2 min-w-[120px] text-muted-foreground truncate">{field.label}:</span>
                      <input
                        value={field.value}
                        onChange={(e) => {
                          const updated = (activeProjectForConfig.customFields || []).map(f => f.id === field.id ? { ...f, value: e.target.value } : f);
                          updateProject(activeProjectForConfig.id, { customFields: updated });
                        }}
                        className="flex-1 text-xs bg-background border border-border/80 rounded-md px-2 py-1 outline-none text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (activeProjectForConfig.customFields || []).filter(f => f.id !== field.id);
                          updateProject(activeProjectForConfig.id, { customFields: updated });
                          toast.success("Field removed");
                        }}
                        className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-secondary shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
                      const updated = [
                        ...(activeProjectForConfig.customFields || []),
                        { id: Math.random().toString(36).slice(2, 9), label: newFieldLabel.trim(), value: newFieldValue.trim() }
                      ];
                      updateProject(activeProjectForConfig.id, { customFields: updated });
                      setNewFieldLabel("");
                      setNewFieldValue("");
                      toast.success("Field added");
                    }}
                    className="flex gap-2 items-end pt-1"
                  >
                    <div className="flex-1 space-y-1">
                      <input
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="Label (e.g. Figma link)"
                        className="w-full text-xs bg-secondary border border-border rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                    <div className="flex-[2] space-y-1">
                      <input
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="Value URL or string..."
                        className="w-full text-xs bg-secondary border border-border rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                      className="h-8 px-3 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition shrink-0"
                    >
                      Add Field
                    </button>
                  </form>
                </div>
              </div>

              {/* Section 4: Infrastructure Stages and Targets */}
              <div className="space-y-4 border-t border-border/50 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> Deploy Pipelines & Environments
                  </h4>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newStageName.trim()) return;
                      const cleanId = newStageName.toLowerCase().replace(/[^a-z0-9]/g, "-") || Math.random().toString(36).slice(2, 10);
                      const currentStages = activeProjectForConfig.stages || [];
                      if (currentStages.some(s => s.id === cleanId)) {
                        toast.error("Stage ID already exists");
                        return;
                      }
                      const updatedStages = [...currentStages, { id: cleanId, name: newStageName.trim(), enabled: true }];
                      const updatedEnvs = {
                        ...activeProjectForConfig.environments,
                        [cleanId]: { deployUrl: "", firebaseProject: "", vercelProject: "", notes: "", commands: "" }
                      };
                      updateProject(activeProjectForConfig.id, { stages: updatedStages, environments: updatedEnvs });
                      setNewStageName("");
                      toast.success("Stage added");
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="Custom stage (e.g. Dev2)"
                      className="text-xs bg-secondary border border-border rounded-lg px-2 py-1 outline-none text-foreground placeholder:text-[10px]"
                    />
                    <button
                      type="submit"
                      disabled={!newStageName.trim()}
                      className="px-2.5 py-1 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition shrink-0"
                    >
                      Add Stage
                    </button>
                  </form>
                </div>

                <div className="space-y-3">
                  {(activeProjectForConfig.stages || [
                    { id: "development", name: "Development", enabled: true },
                    { id: "staging", name: "Staging", enabled: true },
                    { id: "production", name: "Production", enabled: true },
                  ]).map((stage, idx, arr) => {
                    const envData = activeProjectForConfig.environments[stage.id] || {};
                    const updateEnvField = (field: keyof ProjectEnvironment, val: string) => {
                      const updatedEnvs = {
                        ...activeProjectForConfig.environments,
                        [stage.id]: { ...envData, [field]: val }
                      };
                      updateProject(activeProjectForConfig.id, { environments: updatedEnvs });
                    };

                    const handleMove = (direction: "up" | "down") => {
                      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
                      if (targetIdx < 0 || targetIdx >= arr.length) return;
                      const updatedStages = [...arr];
                      const temp = updatedStages[idx];
                      updatedStages[idx] = updatedStages[targetIdx];
                      updatedStages[targetIdx] = temp;
                      updateProject(activeProjectForConfig.id, { stages: updatedStages });
                    };

                    return (
                      <div key={stage.id} className="border border-border/80 bg-secondary/20 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMove("up")}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove("down")}
                              disabled={idx === arr.length - 1}
                              className="p-1 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <input
                              value={stage.name}
                              onChange={(e) => {
                                const updatedStages = arr.map(s => s.id === stage.id ? { ...s, name: e.target.value } : s);
                                updateProject(activeProjectForConfig.id, { stages: updatedStages });
                              }}
                              className="text-xs font-semibold bg-transparent border-b border-border/50 focus:border-primary outline-none px-1 text-foreground"
                            />
                            <span className="text-[9px] text-muted-foreground font-mono">({stage.id})</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={stage.enabled}
                                onChange={(e) => {
                                  const updatedStages = arr.map(s => s.id === stage.id ? { ...s, enabled: e.target.checked } : s);
                                  updateProject(activeProjectForConfig.id, { stages: updatedStages });
                                }}
                                className="h-3.5 w-3.5 rounded text-primary border-border focus:ring-0 cursor-pointer accent-primary"
                              />
                              <span className="text-[11px] text-muted-foreground font-medium">Enabled</span>
                            </label>

                            {stage.id !== "development" && stage.id !== "staging" && stage.id !== "production" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedStages = arr.filter(s => s.id !== stage.id);
                                  updateProject(activeProjectForConfig.id, { stages: updatedStages });
                                  toast.success("Stage deleted");
                                }}
                                className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-secondary"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {stage.enabled && (
                          <div className="grid gap-2.5 md:grid-cols-2 pt-1">
                            <Field
                              label="Deploy Link / URL"
                              value={envData.deployUrl || ""}
                              onChange={(val) => updateEnvField("deployUrl", val)}
                              placeholder="https://test.example.com"
                            />
                            <Field
                              label="Build & Run Execution Command"
                              value={envData.commands || ""}
                              onChange={(val) => updateEnvField("commands", val)}
                              placeholder="npm run start"
                            />
                            <Field
                              label="Firebase Target App"
                              value={envData.firebaseProject || ""}
                              onChange={(val) => updateEnvField("firebaseProject", val)}
                              placeholder="project-slug-dev"
                            />
                            <Field
                              label="Vercel Deploy Slug"
                              value={envData.vercelProject || ""}
                              onChange={(val) => updateEnvField("vercelProject", val)}
                              placeholder="vercel-project-dev"
                            />
                            <div className="md:col-span-2">
                              <span className="text-[10px] font-semibold text-muted-foreground">Notes & Credentials Links</span>
                              <textarea
                                value={envData.notes || ""}
                                onChange={(e) => updateEnvField("notes", e.target.value)}
                                placeholder="Connection configurations, parameters, notes..."
                                className="w-full text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 mt-1 outline-none h-14 resize-none text-foreground"
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
              <div className="pt-4 border-t border-red-500/20 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Danger Zone
                </h4>
                <div className="flex items-center justify-between border border-red-500/10 rounded-xl p-4 bg-red-500/5">
                  <div className="max-w-[70%]">
                    <p className="text-xs font-bold text-foreground">Delete this Project</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Delete this project, its pipeline configurations and environments. Linked notes and tasks will remain active but unlinked.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete project "${activeProjectForConfig.name}"? This cannot be undone.`)) {
                        deleteProject(activeProjectForConfig.id);
                        setIsConfigModalOpen(false);
                        setConfigProjectId(null);
                        window.dispatchEvent(new CustomEvent("flow:navigate", { detail: "today" }));
                        toast.success("Project deleted");
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-5 py-4 border-t border-border bg-muted/40">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="h-9 px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold transition"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

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
    <span className="text-[10.5px] font-semibold text-muted-foreground block">{label}</span>
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-[10px]"
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
  <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3 bg-background/30">
    <div>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
      type="button"
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`}
      />
    </button>
  </div>
);

export default Settings;
