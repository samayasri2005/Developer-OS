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
}
