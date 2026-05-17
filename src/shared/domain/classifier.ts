import type { ClassificationResult, ItemKind, WorkflowStatus } from "@/shared/types/item";
import { deriveTimelineMetaFromText } from "@/shared/domain/timeline";

const WORKFLOW_CUES = /\b(blocked|backlog|ready|review|handoff|in progress|kanban|prepare|draft|plan|implement|coordinate|dependency|handover|milestone|spec|confluence|jira|rollout|release|design doc)\b/i;
const CHECKLIST_CUES = /^(\[\s?\]|-|todo\b|fix\b|call\b|email\b|finish\b|buy\b|pick up\b)/i;
const LIST_PATTERN = /(^|\s)\d+[.)]\s+\w+/i;
const PROFESSIONAL_WORK_PATTERN = /\b(config|proposal|doc|draft|review|project|launch|release|migration|workflow|handoff|brief|spec|ticket)\b/i;
const IDEA_OR_NOTE_CUES = /\b(testing\b|test idea\b|idea\b|thought\b|hypothesis\b|explore\b)\b/i;
const GENERIC_LABELS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "me", "my", "of", "on", "or", "that", "the", "this", "to", "was", "with",
  "note", "notes", "task", "tasks", "item", "items", "journal", "timeline", "workflow", "checklist", "reminder", "notification", "timer", "thought"
]);
const ACTION_CANONICAL: Record<string, string> = {
  connect: "meeting",
  meeting: "meeting",
  meet: "meeting",
  call: "meeting",
  followup: "meeting",
  "follow-up": "meeting",
  mins: "minute",
  min: "minute",
  secs: "second",
  sec: "second"
};
const TAG_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "it", "me", "my", "of", "on", "or", "that", "the", "this", "to", "was", "with",
  "not", "no", "yes", "ok", "okay", "just", "really", "very", "thing", "things", "stuff", "some", "something",
  "said", "tell", "told", "asked", "ask", "called", "call", "check", "checking", "about", "into", "onto",
  "am", "pm", "mins", "min", "minute", "minutes", "secs", "sec", "second", "seconds", "hr", "hrs", "hour", "hours",
  "today", "tomorrow"
]);

export function normalizeText(value: string): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function extractLabels(text: string): string[] {
  const matches = normalizeText(text).match(/#[a-z0-9_-]+/gi) || [];
  return matches.map((t) => t.slice(1).toLowerCase());
}

function slugLabel(value: string): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-|-$/g, "");
}

function singularizeLabel(value: string): string {
  if (value.endsWith("ies") && value.length > 4) return `${value.slice(0, -3)}y`;
  if (value.endsWith("es") && value.length > 4) return value.slice(0, -2);
  if (value.endsWith("s") && value.length > 3) return value.slice(0, -1);
  return value;
}

function prioritizeLabel(label: string, kind: ItemKind): number {
  const weekday = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)$/.test(label);
  const person = /^[a-z]{2,20}$/.test(label) && !GENERIC_LABELS.has(label);
  const action = /^(meeting|collect|book|pickup|dropoff|release|review|fix|buy)$/.test(label);
  const topic = !weekday && !action && !GENERIC_LABELS.has(label);

  if (kind === "timeline") {
    if (person) return 100;
    if (action) return 90;
    if (weekday) return 80;
    if (topic) return 70;
  } else if (kind === "journal") {
    if (topic) return 90;
    if (person) return 80;
    if (weekday) return 70;
  } else if (kind === "checklist") {
    if (label === "shopping" || label === "grocery") return 100;
    if (topic) return 80;
    if (person) return 70;
  } else {
    if (action) return 95;
    if (topic) return 85;
    if (person) return 80;
  }
  return 10;
}

export function curateLabels(kind: ItemKind, labels: string[]): string[] {
  const canonical = labels
    .map((l) => slugLabel(l))
    .filter(Boolean)
    .map((l) => l.replace(/-(s|es)$/, ""))
    .map((l) => ACTION_CANONICAL[l] || l)
    .filter((l) => !GENERIC_LABELS.has(l))
    .filter((l) => !TAG_STOPWORDS.has(l))
    .filter((l) => l.length >= 2)
    .filter((l) => /[a-z]/.test(l))
    .filter((l) => !/^\d+$/.test(l))
    .filter((l) => !/^(check-in|checking|notification|reminder|timeline|journal|workflow|checklist)$/.test(l));

  const deduped = [...new Set(canonical)];
  const sorted = deduped.sort((a, b) => prioritizeLabel(b, kind) - prioritizeLabel(a, kind));
  const max = kind === "timeline" ? 4 : 5;
  return sorted.slice(0, max);
}

export function normalizeGeneratedLabels(labels: string[], text: string, memoryLabels: string[] = []): string[] {
  const source = labels.map(slugLabel).filter(Boolean);
  const memory = memoryLabels.map(slugLabel).filter(Boolean);
  const memoryByCanon = new Map<string, string>();
  for (const memoryLabel of memory) {
    const canonical = singularizeLabel(memoryLabel.replace(/-/g, ""));
    if (!memoryByCanon.has(canonical)) memoryByCanon.set(canonical, memoryLabel);
  }
  const hasConfigDriftContext = /\bconfig drift\b/i.test(text) || memory.includes("config-drift");

  const mapped = source.map((label) => {
    if (label === "config-drift" || label === "configdrift") return "config-drift";
    if (label === "drift" && hasConfigDriftContext) return "config-drift";
    if (label === "flow-ways") return "flowways";
    const canon = singularizeLabel(label.replace(/-/g, ""));
    return memoryByCanon.get(canon) || label;
  });

  if (hasConfigDriftContext && mapped.includes("drift") && !mapped.includes("config-drift")) {
    mapped.push("config-drift");
  }

  return [...new Set(mapped)];
}

export function inferContextLabels(text: string, kind: ItemKind): string[] {
  const lower = text.toLowerCase();
  const inferred: string[] = [];
  const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  if (kind === "checklist") {
    if (/\b(egg|milk|onion|tomato|rice|bread|grocery|shopping|vegetable|fruit|brinjal|potato)\b/.test(lower)) {
      inferred.push("shopping", "grocery");
    }
    if (/\b(personal|home|house)\b/.test(lower)) inferred.push("personal");
    if (/\b(work|office|confluence|jira|config|doc)\b/.test(lower)) inferred.push("work");
  }

  if (kind === "workflow") {
    if (/\b(confluence|jira|doc|draft|spec)\b/.test(lower)) inferred.push("documentation");
    if (/\b(release|rollout|deploy)\b/.test(lower)) inferred.push("release");
  }

  if (kind === "journal") {
    if (/\b(idea|testing|thought|hypothesis)\b/.test(lower)) inferred.push("idea");
  }

  if (kind === "timeline") {
    if (/\bbook(ing)?\s+tickets?\b/.test(lower)) inferred.push("booking", "tickets");
    if (/\bcollect\b/.test(lower)) inferred.push("collect");
    if (/\bbook\b/.test(lower)) inferred.push("book");
    if (/\b(call|meeting|doctor|flight|train|bill|payment|pickup|dropoff)\b/.test(lower)) {
      const ops = lower.match(/\b(call|meeting|doctor|flight|train|bill|payment|pickup|dropoff)\b/g) || [];
      inferred.push(...ops);
    }

    const stopwords = new Set([
      "to", "at", "in", "on", "for", "by", "from", "with", "about", "after", "before",
      "today", "tomorrow", "week", "next", "pm", "am", "mins", "min", "minutes", "hour", "hours",
      "remind", "reminder", "timer", "notification", "the", "a", "an", "and", "me", "my"
    ]);
    const locationCandidates = lower.match(/\b(?:for|to|at|in)\s+([a-z][a-z0-9_-]{2,})\b/g) || [];
    for (const phrase of locationCandidates) {
      const token = phrase.replace(/\b(?:for|to|at|in)\s+/, "").trim();
      if (token && !stopwords.has(token)) inferred.push(token);
    }

    for (const day of weekdays) {
      if (new RegExp(`\\b${day}\\b`).test(lower)) inferred.push(day);
    }
  }

  const sourceNameMatch =
    lower.match(/\bnote from\s+([a-z][a-z0-9_-]{1,20})\b/) ||
    lower.match(/\bfrom\s+([a-z][a-z0-9_-]{1,20})\b/) ||
    lower.match(/\b([a-z][a-z0-9_-]{1,20})\s+(said|called|told|asked|shared)\b/);
  const sourceName = sourceNameMatch?.[1];
  if (sourceName && !/^(note|task|timer|reminder|the|this|that)$/.test(sourceName)) {
    inferred.push(sourceName);
  }

  return [...new Set(inferred.map((t) => slugLabel(t)).filter(Boolean))];
}

export function parseDueAt(text: string, baseDate = new Date(), clientTimezoneOffsetMinutes?: number): string | null {
  const normalized = normalizeText(text).toLowerCase();
  const offsetMin = Number.isFinite(clientTimezoneOffsetMinutes as number)
    ? Number(clientTimezoneOffsetMinutes)
    : baseDate.getTimezoneOffset();
  const toLocalFrame = (d: Date) => new Date(d.getTime() - offsetMin * 60000);
  const fromLocalFrame = (d: Date) => new Date(d.getTime() + offsetMin * 60000);
  const result = toLocalFrame(baseDate);
  const hasYesterday = /\byesterday\b/.test(normalized);
  const relative = normalized.match(/\b(in|after|for)\s+(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/);
  const bareRelative = normalized.match(/^\s*(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\s*$/);

  if (relative || bareRelative) {
    const amount = Number(relative ? relative[2] : bareRelative?.[1]);
    const unit = relative ? relative[3] : (bareRelative?.[2] || "");
    if (Number.isFinite(amount) && amount > 0) {
      const deltaMs =
        /day/.test(unit) ? amount * 24 * 60 * 60 * 1000 :
          /h|hr|hour/.test(unit) ? amount * 60 * 60 * 1000 :
            /sec|second/.test(unit) ? amount * 1000 :
              amount * 60 * 1000;
      return new Date(baseDate.getTime() + deltaMs).toISOString();
    }
  }

  const weekdayMatch = normalized.match(/\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  let hasWeekday = false;
  if (weekdayMatch) {
    const weekdayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    };
    const targetDay = weekdayMap[weekdayMatch[2]];
    const localBase = toLocalFrame(baseDate);
    const baseDay = localBase.getUTCDay();
    let daysAhead = (targetDay - baseDay + 7) % 7;
    if (daysAhead === 0 || weekdayMatch[1]) daysAhead += 7;
    result.setUTCDate(result.getUTCDate() + daysAhead);
    result.setUTCHours(9, 0, 0, 0);
    hasWeekday = true;
  }

  if (hasYesterday) {
    result.setUTCDate(result.getUTCDate() - 1);
    result.setUTCHours(17, 0, 0, 0);
  } else if (/\btoday\b/.test(normalized)) {
    result.setUTCHours(17, 0, 0, 0);
  } else if (/\btomorrow\b/.test(normalized)) {
    result.setUTCDate(result.getUTCDate() + 1);
    result.setUTCHours(17, 0, 0, 0);
  } else if (/\bnext week\b/.test(normalized)) {
    result.setUTCDate(result.getUTCDate() + 7);
    result.setUTCHours(9, 0, 0, 0);
  } else {
    const iso = normalized.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (iso) {
      result.setUTCFullYear(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      result.setUTCHours(9, 0, 0, 0);
    }
  }

  const tm = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (tm) {
    let h = Number(tm[1]);
    const m = Number(tm[2] || 0);
    if (tm[3] === "pm" && h < 12) h += 12;
    if (tm[3] === "am" && h === 12) h = 0;
    result.setUTCHours(h, m, 0, 0);
    if (!hasYesterday && !/\b(today|tomorrow|next week)\b/.test(normalized) && !/\b20\d{2}-\d{2}-\d{2}\b/.test(normalized) && fromLocalFrame(result).getTime() <= baseDate.getTime()) {
      result.setUTCDate(result.getUTCDate() + 1);
    }
    return fromLocalFrame(result).toISOString();
  }

  const tm24 = normalized.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (tm24) {
    const h = Number(tm24[1]);
    const m = Number(tm24[2]);
    result.setUTCHours(h, m, 0, 0);
    if (!hasYesterday && !/\b(today|tomorrow|next week)\b/.test(normalized) && !/\b20\d{2}-\d{2}-\d{2}\b/.test(normalized) && fromLocalFrame(result).getTime() <= baseDate.getTime()) {
      result.setUTCDate(result.getUTCDate() + 1);
    }
    return fromLocalFrame(result).toISOString();
  }

  if (/\bnoon\b/.test(normalized)) {
    result.setUTCHours(12, 0, 0, 0);
    if (!hasYesterday && !/\b(today|tomorrow|next week)\b/.test(normalized) && !/\b20\d{2}-\d{2}-\d{2}\b/.test(normalized) && fromLocalFrame(result).getTime() <= baseDate.getTime()) {
      result.setUTCDate(result.getUTCDate() + 1);
    }
    return fromLocalFrame(result).toISOString();
  }

  if (/\bmidnight\b/.test(normalized)) {
    result.setUTCHours(0, 0, 0, 0);
    if (!hasYesterday && !/\b(today|tomorrow|next week)\b/.test(normalized) && !/\b20\d{2}-\d{2}-\d{2}\b/.test(normalized) && fromLocalFrame(result).getTime() <= baseDate.getTime()) {
      result.setUTCDate(result.getUTCDate() + 1);
    }
    return fromLocalFrame(result).toISOString();
  }

  if (hasYesterday || /\b(today|tomorrow|next week)\b/.test(normalized) || /\b20\d{2}-\d{2}-\d{2}\b/.test(normalized) || hasWeekday) {
    return fromLocalFrame(result).toISOString();
  }

  return null;
}

function stripSyntax(text: string): string {
  return normalizeText(text)
    .replace(/\b(today|tomorrow|next week)\b/gi, "")
    .replace(/\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
    .replace(/\b(in|after|for)\s+\d+\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/gi, "")
    .replace(/\b20\d{2}-\d{2}-\d{2}\b/g, "")
    .replace(/\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/gi, "")
    .replace(/#[a-z0-9_-]+/gi, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^\[\s?\]\s*/, "")
    .trim();
}

export function fallbackClassify(text: string, modeHint: "auto" | ItemKind = "auto", baseDate = new Date(), clientTimezoneOffsetMinutes?: number): ClassificationResult {
  const clean = normalizeText(text);
  const dueAt = parseDueAt(clean, baseDate, clientTimezoneOffsetMinutes);
  const isJournal = clean.length > 140 || /\n|\. .+\./.test(text);
  const isIdeaLike = IDEA_OR_NOTE_CUES.test(clean);
  const checklistSignals = Number(CHECKLIST_CUES.test(clean)) + Number(LIST_PATTERN.test(clean));
  const workflowSignals = Number(WORKFLOW_CUES.test(clean)) + Number(PROFESSIONAL_WORK_PATTERN.test(clean));
  const temporalCue = /\b(today|tomorrow|next week|(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}(?::\d{2})?\s*(am|pm)|\d{2}:\d{2})\b/i.test(clean);
  const followupActionCue = /\b(remind|follow up|follow-up|connect|call|meet|check with|book|collect|pick up|pickup|drop off|dropoff)\b/i.test(clean);
  const personCue = /\b(note from|from\s+[a-z][a-z0-9_-]{1,20}\b|[a-z][a-z0-9_-]{1,20}\s+(said|asked|called|told))\b/i.test(clean);
  const directedActionCue = /\b(collect|bring|send|share|review|prepare|fix|connect|call|meet|check|follow up|follow-up|book|pick up|pickup)\b/i.test(clean);

  let kind: ItemKind = "checklist";
  if (modeHint !== "auto") kind = modeHint;
  else if (dueAt) kind = "timeline";
  else if (temporalCue && (followupActionCue || personCue)) kind = "timeline";
  else if (personCue && directedActionCue && checklistSignals === 0) kind = "workflow";
  else if (isIdeaLike && checklistSignals === 0) kind = "journal";
  else if (workflowSignals > checklistSignals) kind = "workflow";
  else if (isJournal) kind = "journal";
  else if (checklistSignals > 0) kind = "checklist";
  else if (workflowSignals > 0) kind = "workflow";

  const workflowStatus: WorkflowStatus | null = kind === "workflow" ? "Backlog" : null;
  const timelineTitle = normalizeText(clean.replace(/#[a-z0-9_-]+/gi, ""));
  const title = kind === "timeline"
    ? (timelineTitle || clean || "Untitled item")
    : (stripSyntax(clean) || clean || "Untitled item");

  return {
    kind,
    title,
    body: kind === "journal" ? clean : "",
    labels: (() => {
      const normalized = normalizeGeneratedLabels(extractLabels(clean), clean);
      const inferred = inferContextLabels(clean, kind);
      return curateLabels(kind, [...new Set([...normalized, ...inferred])]);
    })(),
    pet_quip: (() => {
      const compactTitle = title.length > 42 ? `${title.slice(0, 39)}...` : title;
      if (kind === "timeline") return `Clock started for "${compactTitle}". No pressure.`;
      if (kind === "workflow") return `Backlog fed: "${compactTitle}". Very official.`;
      if (kind === "checklist") return `List saved: "${compactTitle}". Tiny boxes, big plans.`;
      return `Noted: "${compactTitle}". Future-you will judge this.`;
    })(),
    due_at: dueAt,
    timeline_meta: kind === "timeline" ? deriveTimelineMetaFromText(clean, dueAt, baseDate, clientTimezoneOffsetMinutes) : null,
    workflow_status: workflowStatus,
    confidence: kind === "workflow" ? 0.72 : 0.66,
    reason: `Fallback deterministic classifier used (workflowSignals=${workflowSignals}, checklistSignals=${checklistSignals})`,
    fallbackUsed: true
  };
}


