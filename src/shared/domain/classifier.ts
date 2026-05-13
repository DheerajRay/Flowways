import type { ClassificationResult, ItemKind, WorkflowStatus } from "@/shared/types/item";

const WORKFLOW_CUES = /\b(blocked|backlog|ready|review|handoff|in progress|kanban|prepare|draft|plan|implement|coordinate|dependency|handover|milestone|spec|confluence|jira|rollout|release|design doc)\b/i;
const CHECKLIST_CUES = /^(\[\s?\]|-|todo\b|fix\b|call\b|email\b|finish\b|buy\b|pick up\b)/i;
const LIST_PATTERN = /(^|\s)\d+[.)]\s+\w+/i;
const PROFESSIONAL_WORK_PATTERN = /\b(config|proposal|doc|draft|review|project|launch|release|migration|workflow|handoff|brief|spec|ticket)\b/i;

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
  const checklistSignals = Number(CHECKLIST_CUES.test(clean)) + Number(LIST_PATTERN.test(clean));
  const workflowSignals = Number(WORKFLOW_CUES.test(clean)) + Number(PROFESSIONAL_WORK_PATTERN.test(clean));

  let kind: ItemKind = "checklist";
  if (modeHint !== "auto") kind = modeHint;
  else if (dueAt) kind = "timeline";
  else if (workflowSignals > checklistSignals) kind = "workflow";
  else if (isJournal) kind = "journal";
  else if (checklistSignals > 0) kind = "checklist";
  else if (workflowSignals > 0) kind = "workflow";

  const workflowStatus: WorkflowStatus | null = kind === "workflow" ? "Backlog" : null;

  return {
    kind,
    title: stripSyntax(clean) || clean || "Untitled item",
    body: kind === "journal" ? clean : "",
    labels: extractLabels(clean),
    due_at: dueAt,
    workflow_status: workflowStatus,
    confidence: kind === "workflow" ? 0.72 : 0.66,
    reason: `Fallback deterministic classifier used (workflowSignals=${workflowSignals}, checklistSignals=${checklistSignals})`,
    fallbackUsed: true
  };
}


