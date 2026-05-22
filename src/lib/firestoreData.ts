/**
 * Firestore data layer for Developer OS.
 * All data stored in flat root collections.
 *
 * Collections:
 *   dev_folders      — Folder documents
 *   dev_tasks        — Task documents
 *   dev_notes        — Note documents
 *   dev_commands     — CLI command documents
 *   dev_preferences  — Preferences document with userId as document ID
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Task, Note, Folder, Command, Project, Improvement, ActivityLog, Scratchpad } from "./types";

// ── Folders ────────────────────────────────────────────────────────────────

export const fetchFolders = async (uid: string): Promise<Folder[]> => {
  const q = query(collection(db, "dev_folders"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Folder);
};

export const saveFolder = async (uid: string, folder: Folder): Promise<void> => {
  await setDoc(doc(db, "dev_folders", folder.id), { ...folder, userId: uid });
};

export const deleteFolder = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, "dev_folders", id));
};

// ── Tasks ──────────────────────────────────────────────────────────────────

export const fetchTasks = async (uid: string): Promise<Task[]> => {
  const q = query(collection(db, "dev_tasks"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Task);
};

export const saveTask = async (uid: string, task: Task): Promise<void> => {
  await setDoc(doc(db, "dev_tasks", task.id), { ...task, userId: uid });
};

export const updateTask = async (uid: string, id: string, patch: Partial<Task>): Promise<void> => {
  await updateDoc(doc(db, "dev_tasks", id), patch as Record<string, unknown>);
};

export const deleteTask = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, "dev_tasks", id));
};

export const batchSaveTasks = async (uid: string, tasks: Task[]): Promise<void> => {
  const batch = writeBatch(db);
  for (const task of tasks) {
    batch.set(doc(db, "dev_tasks", task.id), { ...task, userId: uid });
  }
  await batch.commit();
};

// ── Notes ──────────────────────────────────────────────────────────────────

export const fetchNotes = async (uid: string): Promise<Note[]> => {
  const q = query(collection(db, "dev_notes"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Note);
};

export const saveNote = async (uid: string, note: Note): Promise<void> => {
  await setDoc(doc(db, "dev_notes", note.id), { ...note, userId: uid });
};

export const updateNote = async (uid: string, id: string, patch: Partial<Note>): Promise<void> => {
  await updateDoc(doc(db, "dev_notes", id), patch as Record<string, unknown>);
};

export const deleteNote = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, "dev_notes", id));
};

// ── Commands ───────────────────────────────────────────────────────────────

export const fetchCommands = async (uid: string): Promise<Command[]> => {
  const q = query(collection(db, "dev_commands"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Command);
};

export const saveCommand = async (uid: string, cmd: Command): Promise<void> => {
  await setDoc(doc(db, "dev_commands", cmd.id), { ...cmd, userId: uid });
};

export const deleteCommand = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, "dev_commands", id));
};

// ── Preferences ────────────────────────────────────────────────────────────

export interface UserPrefs {
  theme: "light" | "dark";
}

export const fetchPrefs = async (uid: string): Promise<UserPrefs | null> => {
  const snap = await getDoc(doc(db, "dev_preferences", uid));
  return snap.exists() ? (snap.data() as UserPrefs) : null;
};

export const savePrefs = async (uid: string, prefs: Partial<UserPrefs>): Promise<void> => {
  await setDoc(doc(db, "dev_preferences", uid), prefs, { merge: true });
};

// ── Projects ───────────────────────────────────────────────────────────────

export const fetchProjects = async (uid: string): Promise<Project[]> => {
  const q = query(collection(db, "dev_projects"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Project);
};

export const saveProject = async (uid: string, project: Project): Promise<void> => {
  await setDoc(doc(db, "dev_projects", project.id), { ...project, userId: uid });
};

export const deleteProject = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, "dev_projects", id));
};

// ── Improvements ───────────────────────────────────────────────────────────

export const fetchImprovements = async (uid: string): Promise<Improvement[]> => {
  const q = query(collection(db, "dev_improvements"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Improvement);
};

export const saveImprovement = async (uid: string, imp: Improvement): Promise<void> => {
  await setDoc(doc(db, "dev_improvements", imp.id), { ...imp, userId: uid });
};

export const deleteImprovement = async (uid: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, "dev_improvements", id));
};

// ── Activity Logs ──────────────────────────────────────────────────────────

export const fetchActivityLogs = async (uid: string): Promise<ActivityLog[]> => {
  const q = query(collection(db, "dev_activities"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ActivityLog);
};

export const saveActivityLog = async (uid: string, log: ActivityLog): Promise<void> => {
  await setDoc(doc(db, "dev_activities", log.id), { ...log, userId: uid });
};

// ── Scratchpads ────────────────────────────────────────────────────────────

export const fetchScratchpad = async (uid: string): Promise<Scratchpad | null> => {
  const snap = await getDoc(doc(db, "dev_scratchpads", uid));
  return snap.exists() ? (snap.data() as Scratchpad) : null;
};

export const saveScratchpad = async (uid: string, content: string): Promise<void> => {
  await setDoc(doc(db, "dev_scratchpads", uid), {
    userId: uid,
    content,
    updatedAt: new Date().toISOString(),
  });
};
