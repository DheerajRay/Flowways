export type ItemKind = "checklist" | "journal" | "workflow" | "timeline";
export type WorkflowStatus = "Backlog" | "Paused" | "In Progress" | "Ready" | "Review" | "Done";
export type TimelineSubtype = "stopwatch" | "reminder" | "recurring" | "countup";
export type JournalSubtype = "diary" | "note" | "idea";

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
  last_notified_at?: string | null;
  last_notified_occurrence_at?: string | null;
}

export interface JournalMeta {
  journal_subtype: JournalSubtype;
  diary_entry_count?: number;
  last_entry_at?: string | null;
}

export interface Item {
  id: string;
  userId: string;
  kind: ItemKind;
  title: string;
  body: string;
  labels: string[];
  workflowStatus: WorkflowStatus | null;
  checked: boolean;
  dueAt: string | null;
  timelineMeta?: TimelineMeta | null;
  journalMeta?: JournalMeta | null;
  position: number;
  sourceText: string;
  classificationConfidence: number;
  classificationReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassificationResult {
  kind: ItemKind;
  title: string;
  body: string;
  labels: string[];
  pet_quip?: string;
  due_at: string | null;
  timeline_meta?: TimelineMeta | null;
  journal_meta?: JournalMeta | null;
  workflow_status: WorkflowStatus | null;
  confidence: number;
  reason: string;
  fallbackUsed: boolean;
}



