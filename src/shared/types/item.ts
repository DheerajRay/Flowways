export type ItemKind = "checklist" | "journal" | "workflow" | "timeline";
export type WorkflowStatus = "Backlog" | "Ready" | "In Progress" | "Review" | "Done";

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
  due_at: string | null;
  workflow_status: WorkflowStatus | null;
  confidence: number;
  reason: string;
  fallbackUsed: boolean;
}


