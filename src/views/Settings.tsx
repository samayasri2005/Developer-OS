import { useMemo, useState } from "react";
import { Bell, Code2, LogOut, Mail, Shield, Folder as FolderIcon, Plus, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/store/tasks";
import {
  APP_ID,
  DEFAULT_SENDER_EMAIL,
  updateAppNotificationPreferences,
} from "@/lib/userProfile";
import { sendNotificationTestEmail } from "@/lib/emailNotifications";

const Settings = () => {
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const [testingEmail, setTestingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<"account" | "folders" | "notifications">("account");

  const folders = useTasks((s) => s.folders);
  const addFolder = useTasks((s) => s.addFolder);
  const deleteFolder = useTasks((s) => s.deleteFolder);
  const renameFolder = useTasks((s) => s.renameFolder);
  const tasks = useTasks((s) => s.tasks);

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
    <div className="min-h-screen bg-background px-6 py-8 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your account, folders, and notifications.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["account", "folders", "notifications"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "folders" ? "Workspace/Folders" : tab.charAt(0).toUpperCase() + tab.slice(1)}
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

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-accent/10 p-3 text-accent">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Integration Notes</h2>
              <p className="text-sm text-muted-foreground">Notification switches are live. Event emitters can be hooked into task, note, and build flows next.</p>
            </div>
          </div>
        </section>
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
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  type?: string;
}) => (
  <label className="block">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <input
      type={type}
      value={value}
      readOnly={readOnly}
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
