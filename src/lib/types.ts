export type Status = "todo" | "doing" | "done";
export type Priority = "low" | "medium" | "high";
export type Recurrence = "none" | "daily" | "weekly";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  tags: string[];
  folder: string;
  dueDate?: string;
  recurrence: Recurrence;
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
  lastResetAt?: string;
  order: number;
  notes?: string;
  links?: LinkRef[];
  linkedNoteIds?: string[];
  projectId?: string;
}

export interface LinkRef {
  id: string;
  url: string;
  title?: string;
  createdAt: string;
}

export type NoteKind = "note" | "daily";

export interface Note {
  id: string;
  userId?: string;
  title: string;
  content: string;
  kind: NoteKind;
  /** YYYY-MM-DD for daily logs */
  dayKey?: string;
  linkedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
  projectId?: string;
}

export interface Folder {
  id: string;
  userId?: string;
  name: string;
  color?: string;
}

export interface Command {
  id: string;
  label: string;
  command: string;
  category: string;
  createdAt: string;
  projectId?: string;
}

export interface ProjectEnvironment {
  deployUrl?: string;
  firebaseProject?: string;
  vercelProject?: string;
  notes?: string;
  commands?: string;
}

export interface ProjectTechStack {
  id: string;
  name: string;
  version?: string;
  category: "frontend" | "backend" | "database" | "tooling" | "other";
}

export interface ProjectAccount {
  id: string;
  platform: string;
  accountName: string;
}

export interface ProjectAITool {
  id: string;
  toolName: string;
  account: string;
  notes?: string;
}

export interface ProjectConfig {
  id: string;
  label: string;
  path: string;
  notes?: string;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  githubRepo?: string;
  firebaseProject?: string;
  vercelProject?: string;
  createdAt: string;
  environments: Record<string, ProjectEnvironment>;
  stages?: { id: string; name: string; enabled: boolean }[];
  customFields?: { id: string; label: string; value: string }[];
  links?: LinkRef[];
  techStack?: ProjectTechStack[];
  accounts?: ProjectAccount[];
  aiTools?: ProjectAITool[];
  configs?: ProjectConfig[];
}

export interface Improvement {
  id: string;
  userId?: string;
  projectId: string;
  title: string;
  done: boolean;
  priority?: "low" | "medium" | "high";
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: "task_completed" | "note_edited" | "command_copied" | "deployment_opened" | "project_updated" | "improvement_completed";
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Scratchpad {
  userId: string;
  content: string;
  updatedAt: string;
}
