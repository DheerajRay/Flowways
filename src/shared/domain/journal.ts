import { normalizeText } from "@/shared/domain/classifier";

export type JournalSubtype = "diary" | "note" | "idea";

export interface JournalMeta {
  journal_subtype: JournalSubtype;
  diary_entry_count?: number;
  last_entry_at?: string | null;
}

export function defaultJournalMeta(subtype: JournalSubtype): JournalMeta {
  return { journal_subtype: subtype };
}

export function deriveJournalMetaFromText(text: string): JournalMeta {
  const normalized = normalizeText(text).toLowerCase();
  if (/#diary\b/i.test(normalized)) return defaultJournalMeta("diary");
  if (/\b(test idea|idea|hypothesis|explore|thought|brainstorm)\b/i.test(normalized)) return defaultJournalMeta("idea");
  return defaultJournalMeta("note");
}

export function stripDiaryControlTags(text: string): string {
  return normalizeText(text.replace(/#diary\b/gi, "")).trim();
}

export function formatDiaryEntry(message: string, when = new Date()): string {
  const stamp = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(when);
  return `[${stamp}] <${message}>`;
}

