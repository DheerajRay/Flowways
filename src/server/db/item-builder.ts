import { randomUUID } from "crypto";
import type { ClassificationResult, Item } from "@/shared/types/item";

export function buildItem(userId: string, sourceText: string, position: number, c: ClassificationResult): Item {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId,
    kind: c.kind,
    title: c.title,
    body: c.body,
    labels: c.labels,
    workflowStatus: c.kind === "workflow" ? "Backlog" : null,
    checked: false,
    dueAt: c.due_at,
    position,
    sourceText,
    classificationConfidence: c.confidence,
    classificationReason: c.reason,
    timelineMeta: c.timeline_meta || null,
    journalMeta: c.journal_meta || null,
    createdAt: now,
    updatedAt: now
  };
}



