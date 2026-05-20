import { z } from "zod";
import { DEFAULT_USER_SETTINGS } from "@/shared/types/settings";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const userSettingsSchema = z.object({
  pet_enabled: z.boolean(),
  pet_mode: z.enum(["sweet", "meh", "monster"]),
  font_family: z.enum(["avenir", "inter", "plex", "mono", "rounded"]),
  font_size: z.enum(["s", "m", "l"]),
  theme: z.enum(["classic", "neo", "midnight", "bold", "sunset"]),
  color_palette: z.object({
    red: hexColor,
    blue: hexColor,
    green: hexColor,
    amber: hexColor,
    violet: hexColor
  })
});

export const updateUserSettingsSchema = userSettingsSchema.partial();

export const classifyInputSchema = z.object({
  text: z.string().min(1).max(5000),
  modeHint: z.enum(["auto", "checklist", "journal", "workflow", "timeline"]).default("auto"),
  petMode: z.enum(["sweet", "meh", "monster"]).default(DEFAULT_USER_SETTINGS.pet_mode),
  petEnabled: z.boolean().default(DEFAULT_USER_SETTINGS.pet_enabled),
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
  timeline_meta: z.object({
    timeline_subtype: z.enum(["stopwatch", "reminder", "recurring", "countup"]),
    remind_at: z.string().datetime().nullable(),
    remind_lead_minutes: z.number().int().min(1).max(1440),
    recurrence_rule: z.object({
      frequency: z.enum(["daily", "weekly", "monthly"]),
      interval: z.number().int().min(1).max(365),
      byWeekday: z.array(z.number().int().min(0).max(6)).optional(),
      time: z.string().regex(/^\d{2}:\d{2}$/)
    }).nullable(),
    countup_started_at: z.string().datetime().nullable(),
    countup_stopped_at: z.string().datetime().nullable(),
    last_notified_at: z.string().datetime().nullable().optional(),
    last_notified_occurrence_at: z.string().datetime().nullable().optional()
  }).nullable().optional(),
  journal_meta: z.object({
    journal_subtype: z.enum(["diary", "note", "idea"]),
    diary_entry_count: z.number().int().min(0).optional(),
    last_entry_at: z.string().datetime().nullable().optional()
  }).nullable().optional(),
  workflow_status: z.enum(["Backlog", "Paused", "In Progress", "Ready", "Review", "Done"]).nullable(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  fallbackUsed: z.boolean().default(false)
});

export const createItemSchema = z.object({
  sourceText: z.string().min(1),
  modeHint: z.enum(["auto", "checklist", "journal", "workflow", "timeline"]).default("auto"),
  petMode: z.enum(["sweet", "meh", "monster"]).default(DEFAULT_USER_SETTINGS.pet_mode),
  petEnabled: z.boolean().default(DEFAULT_USER_SETTINGS.pet_enabled),
  clientNow: z.string().datetime().optional(),
  clientTimezoneOffsetMinutes: z.number().int().min(-840).max(840).optional()
});

export const updateItemSchema = z.object({
  kind: z.enum(["checklist", "journal", "workflow", "timeline"]).optional(),
  title: z.string().min(1).optional(),
  body: z.string().optional(),
  checked: z.boolean().optional(),
  workflowStatus: z.enum(["Backlog", "Paused", "In Progress", "Ready", "Review", "Done"]).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  timelineMeta: classificationResultSchema.shape.timeline_meta.optional(),
  journalMeta: classificationResultSchema.shape.journal_meta.optional(),
  labels: z.array(z.string()).optional(),
  position: z.number().int().positive().optional()
});



