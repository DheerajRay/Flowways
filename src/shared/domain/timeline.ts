import { normalizeText, parseDueAt } from "@/shared/domain/classifier";

export type TimelineSubtype = "stopwatch" | "reminder" | "recurring" | "countup";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  byWeekday?: number[];
  time: string;
}

export interface TimelineMeta {
  timeline_subtype: TimelineSubtype;
  remind_at: string | null;
  remind_lead_minutes: number;
  recurrence_rule: RecurrenceRule | null;
  countup_started_at: string | null;
  countup_stopped_at: string | null;
  last_notified_at: string | null;
  last_notified_occurrence_at: string | null;
}

export const DEFAULT_REMIND_LEAD_MINUTES = 5;

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
};

function toTime(text: string, baseDate: Date): string {
  const normalized = normalizeText(text).toLowerCase();
  const t12 = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (t12) {
    let h = Number(t12[1]);
    const m = Number(t12[2] || 0);
    if (t12[3] === "pm" && h < 12) h += 12;
    if (t12[3] === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const t24 = normalized.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (t24) return `${String(Number(t24[1])).padStart(2, "0")}:${t24[2]}`;
  return `${String(baseDate.getHours()).padStart(2, "0")}:${String(baseDate.getMinutes()).padStart(2, "0")}`;
}

export function parseRecurrenceRule(text: string, baseDate = new Date()): RecurrenceRule | null {
  const normalized = normalizeText(text).toLowerCase();
  if (!/\bevery\b|\beveryday\b|\bdaily\b|\bweekly\b|\bmonthly\b|\bweekdays?\b/.test(normalized)) return null;
  const time = toTime(normalized, baseDate);
  const everyN = normalized.match(/\bevery\s+(\d+)\s+(day|days|week|weeks|month|months)\b/);
  const weekdays = [...new Set([...normalized.matchAll(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g)].map((m) => WEEKDAY_MAP[m[1]]))];

  if (/\bweekdays?\b/.test(normalized)) {
    return { frequency: "weekly", interval: 1, byWeekday: [1, 2, 3, 4, 5], time };
  }
  if (everyN) {
    const interval = Math.max(1, Number(everyN[1]) || 1);
    if (everyN[2].startsWith("day")) return { frequency: "daily", interval, time };
    if (everyN[2].startsWith("week")) return { frequency: "weekly", interval, byWeekday: weekdays.length ? weekdays : undefined, time };
    return { frequency: "monthly", interval, time };
  }
  if (/\bdaily\b|\bevery day\b|\beveryday\b/.test(normalized)) return { frequency: "daily", interval: 1, time };
  if (/\bmonthly\b|\bevery month\b/.test(normalized)) return { frequency: "monthly", interval: 1, time };
  if (weekdays.length) return { frequency: "weekly", interval: 1, byWeekday: weekdays, time };
  if (/\bweekly\b|\bevery week\b/.test(normalized)) return { frequency: "weekly", interval: 1, time };
  return null;
}

export function nextOccurrenceFromRule(rule: RecurrenceRule, now = new Date()): Date {
  const [h, m] = rule.time.split(":").map(Number);
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setHours(h || 0, m || 0, 0, 0);

  if (rule.frequency === "daily") {
    if (candidate <= now) candidate.setDate(candidate.getDate() + rule.interval);
    return candidate;
  }
  if (rule.frequency === "monthly") {
    if (candidate <= now) candidate.setMonth(candidate.getMonth() + rule.interval);
    return candidate;
  }

  const days = (rule.byWeekday?.length ? rule.byWeekday : [now.getDay()]).slice().sort((a, b) => a - b);
  const today = now.getDay();
  for (const d of days) {
    const delta = (d - today + 7) % 7;
    const next = new Date(candidate);
    next.setDate(candidate.getDate() + delta);
    if (next > now) return next;
  }
  const next = new Date(candidate);
  next.setDate(candidate.getDate() + 7 * Math.max(1, rule.interval));
  while (next.getDay() !== days[0]) next.setDate(next.getDate() + 1);
  return next;
}

export function defaultTimelineMeta(subtype: TimelineSubtype): TimelineMeta {
  return {
    timeline_subtype: subtype,
    remind_at: null,
    remind_lead_minutes: DEFAULT_REMIND_LEAD_MINUTES,
    recurrence_rule: null,
    countup_started_at: null,
    countup_stopped_at: null,
    last_notified_at: null,
    last_notified_occurrence_at: null
  };
}

export function deriveTimelineMetaFromText(
  text: string,
  dueAt: string | null,
  baseDate = new Date(),
  clientTimezoneOffsetMinutes?: number
): TimelineMeta {
  const normalized = normalizeText(text).toLowerCase();
  const recurring = parseRecurrenceRule(normalized, baseDate);
  const countupCue = /\b(track|tracking|time spent|since now|start timer|start tracking)\b/i.test(normalized);
  const remindCue = /\b(remind|reminder|notify)\b/i.test(normalized);
  const actionCue = /\b(meet|meeting|connect|call|book|collect|pickup|pick up|drop off|follow up|follow-up|check with)\b/i.test(normalized);
  const explicitTaskCue = /\b(by|on|at)\b/i.test(normalized);
  const shortDuration = /\b(in|after|for)\s+\d+\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours)\b/i.test(normalized);
  const resolvedDue = dueAt || parseDueAt(text, baseDate, clientTimezoneOffsetMinutes);

  if (countupCue && !resolvedDue && !recurring) {
    return { ...defaultTimelineMeta("countup"), countup_started_at: baseDate.toISOString() };
  }
  if (recurring) {
    const remindAt = nextOccurrenceFromRule(recurring, baseDate).toISOString();
    return { ...defaultTimelineMeta("recurring"), recurrence_rule: recurring, remind_at: remindAt };
  }
  if (resolvedDue && (remindCue || (actionCue && explicitTaskCue)) && !shortDuration) {
    return { ...defaultTimelineMeta("reminder"), remind_at: resolvedDue };
  }
  return { ...defaultTimelineMeta("stopwatch"), remind_at: resolvedDue };
}
