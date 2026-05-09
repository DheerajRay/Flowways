import type { ClassificationResult, ItemKind, WorkflowStatus } from "@/shared/types/item";

const WORKFLOW_CUES = /\b(blocked|backlog|ready|review|handoff|in progress|kanban)\b/i;
const TASK_CUES = /^(\[\s?\]|-|todo\b|fix\b|draft\b|call\b|email\b|finish\b)/i;

export function normalizeText(value: string): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function extractLabels(text: string): string[] {
  const matches = normalizeText(text).match(/#[a-z0-9_-]+/gi) || [];
  return matches.map((t) => t.slice(1).toLowerCase());
}

export function parseDueAt(text: string, baseDate = new Date()): string | null {
  const normalized = normalizeText(text).toLowerCase();
  const result = new Date(baseDate);

  if (/\btoday\b/.test(normalized)) {
    result.setHours(17, 0, 0, 0);
  } else if (/\btomorrow\b/.test(normalized)) {
    result.setDate(result.getDate() + 1);
    result.setHours(17, 0, 0, 0);
  } else if (/\bnext week\b/.test(normalized)) {
    result.setDate(result.getDate() + 7);
    result.setHours(9, 0, 0, 0);
  } else {
    const iso = normalized.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (!iso) return null;
    result.setFullYear(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    result.setHours(9, 0, 0, 0);
  }

  const tm = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (tm) {
    let h = Number(tm[1]);
    const m = Number(tm[2] || 0);
    if (tm[3] === "pm" && h < 12) h += 12;
    if (tm[3] === "am" && h === 12) h = 0;
    result.setHours(h, m, 0, 0);
  }
  return result.toISOString();
}

function stripSyntax(text: string): string {
  return normalizeText(text)
    .replace(/\b(today|tomorrow|next week)\b/gi, "")
    .replace(/\b20\d{2}-\d{2}-\d{2}\b/g, "")
    .replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/gi, "")
    .replace(/#[a-z0-9_-]+/gi, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^\[\s?\]\s*/, "")
    .trim();
}

export function fallbackClassify(text: string, modeHint: "auto" | ItemKind = "auto", baseDate = new Date()): ClassificationResult {
  const clean = normalizeText(text);
  const dueAt = parseDueAt(clean, baseDate);
  const isJournal = clean.length > 140 || /\n|\. .+\./.test(text);

  let kind: ItemKind = "checklist";
  if (modeHint !== "auto") kind = modeHint;
  else if (dueAt) kind = "timeline";
  else if (WORKFLOW_CUES.test(clean)) kind = "workflow";
  else if (isJournal) kind = "journal";
  else if (TASK_CUES.test(clean)) kind = "checklist";

  const workflowStatus: WorkflowStatus | null = kind === "workflow" ? "Backlog" : null;

  return {
    kind,
    title: stripSyntax(clean) || clean || "Untitled item",
    body: kind === "journal" ? clean : "",
    labels: extractLabels(clean),
    due_at: dueAt,
    workflow_status: workflowStatus,
    confidence: 0.65,
    reason: "Fallback deterministic classifier used",
    fallbackUsed: true
  };
}


