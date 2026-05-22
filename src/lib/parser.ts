import type { Priority, Recurrence } from "./types";

export interface ParsedInput {
  title: string;
  tags: string[];
  priority: Priority;
  recurrence: Recurrence;
  folder?: string;
  dueDate?: string;
}

export function parseQuickInput(raw: string): ParsedInput {
  let text = raw.trim();
  const tags: string[] = [];
  let priority: Priority = "medium";
  let recurrence: Recurrence = "none";
  let folder: string | undefined;
  let dueDate: string | undefined;

  // Tags #tag
  text = text.replace(/#([\w-]+)/g, (_, t) => {
    tags.push(t.toLowerCase());
    return "";
  });

  // Folder @folder
  text = text.replace(/@([\w-]+)/g, (_, f) => {
    folder = f.toLowerCase();
    return "";
  });

  // Recurrence /daily /weekly
  text = text.replace(/\/(daily|weekly)/i, (_, r) => {
    recurrence = r.toLowerCase() as Recurrence;
    return "";
  });

  // Priority: high|medium|low|p1|p2|p3 (p1 = high)
  text = text.replace(/\b(p1|p2|p3|high|medium|med|low)\b/i, (_, p) => {
    const v = p.toLowerCase();
    if (v === "p1" || v === "high") priority = "high";
    else if (v === "p2" || v === "medium" || v === "med") priority = "medium";
    else priority = "low";
    return "";
  });

  // Date keywords
  text = text.replace(/\b(today|tomorrow|tmrw|tmr)\b/i, (_, d) => {
    const v = d.toLowerCase();
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    if (v === "tomorrow" || v === "tmrw" || v === "tmr") date.setDate(date.getDate() + 1);
    dueDate = date.toISOString();
    return "";
  });

  return {
    title: text.replace(/\s+/g, " ").trim(),
    tags,
    priority,
    recurrence,
    folder,
    dueDate,
  };
}
