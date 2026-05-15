import { z } from "zod";

export const classifyInputSchema = z.object({
  text: z.string().min(1).max(5000),
  modeHint: z.enum(["auto", "checklist", "journal", "workflow", "timeline"]).default("auto"),
  clientNow: z.string().datetime().optional(),
  clientTimezoneOffsetMinutes: z.number().int().min(-840).max(840).optional()
});

export const classificationResultSchema = z.object({
  kind: z.enum(["checklist", "journal", "workflow", "timeline"]),
  title: z.string().min(1),
  body: z.string(),
  labels: z.array(z.string()),
  pet_quip: z.string().optional().default(""),
  due_at: z.string().datetime().nullable(),
  workflow_status: z.enum(["Backlog", "Paused", "In Progress", "Ready", "Review", "Done"]).nullable(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  fallbackUsed: z.boolean().default(false)
});

export const createItemSchema = z.object({
  sourceText: z.string().min(1),
  modeHint: z.enum(["auto", "checklist", "journal", "workflow", "timeline"]).default("auto"),
  clientNow: z.string().datetime().optional(),
  clientTimezoneOffsetMinutes: z.number().int().min(-840).max(840).optional()
});

export const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  checked: z.boolean().optional(),
  workflowStatus: z.enum(["Backlog", "Paused", "In Progress", "Ready", "Review", "Done"]).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  labels: z.array(z.string()).optional(),
  position: z.number().int().positive().optional()
});



