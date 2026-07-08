import OpenAI from "openai";
import { curateLabels, fallbackClassify, hasInvalidTimeToken, inferContextLabels, normalizeGeneratedLabels, normalizeText, parseDueAt } from "@/shared/domain/classifier";
import { deriveTimelineMetaFromText } from "@/shared/domain/timeline";
import { deriveJournalMetaFromText, stripDiaryControlTags } from "@/shared/domain/journal";
import { classificationResultSchema } from "@/shared/types/schemas";
import type { ClassificationResult, ItemKind } from "@/shared/types/item";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface MemoryHint {
  title: string;
  kind: ItemKind;
  labels?: string[] | null;
}

function petModeFallbackQuip(text: string, mode: "sweet" | "meh" | "monster"): string {
  const short = normalizeText(text).slice(0, 42);
  if (mode === "sweet") return `Got it, cutie. "${short}" is tucked in.`;
  if (mode === "meh") return `Saved: "${short}". Moving on.`;
  return `Boom. "${short}" captured. Try to keep up.`;
}

export async function classifyWithAiOrFallback(
  text: string,
  modeHint: "auto" | ItemKind,
  petMode: "sweet" | "meh" | "monster" = "sweet",
  petEnabled = true,
  memoryHints: MemoryHint[] = [],
  baseDate = new Date(),
  clientTimezoneOffsetMinutes?: number
): Promise<ClassificationResult> {
  if (!petEnabled) {
    const fallback = fallbackClassify(text, modeHint, baseDate, clientTimezoneOffsetMinutes);
    return { ...fallback, pet_quip: "" };
  }

  if (!client) {
    const fallback = fallbackClassify(text, modeHint, baseDate, clientTimezoneOffsetMinutes);
    return { ...fallback, pet_quip: petModeFallbackQuip(text, petMode) };
  }

  try {
    const existingTagVocabulary = [...new Set(
      memoryHints.flatMap((h) => h.labels || [])
        .map((label) => normalizeText(label).toLowerCase())
        .filter(Boolean)
    )].slice(0, 120);

    const hintText = memoryHints
      .slice(0, 8)
      .map((h, i) => `${i + 1}. [${h.kind}] ${h.title}${h.labels?.length ? ` #${h.labels.join(" #")}` : ""}`)
      .join("\n");

    const response = await client.responses.create({
      model: process.env.OPENAI_CLASSIFIER_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Classify user capture into checklist, journal, workflow, or timeline. Prefer workflow for professional project/action items (prepare, draft, plan, review, handoff, release, docs). Use checklist for simple personal actionable todos/lists. If input is exploratory/idea-like (for example 'testing something', 'test idea', 'thinking about'), prefer journal unless explicit task/list markers exist. Use memory hints to keep consistent categorization with existing items. For labels: be strict, output only important retrieval tags (max 4), prioritize people/entities/places/core actions, avoid generic fillers and near-duplicates. Reuse existing tags when possible instead of inventing similar new ones. Also provide one short playful pet_quip (max 80 chars) related to the input, in tone based on petMode: sweet=gentle/cute, meh=neutral/dry, monster=bold/sassy. Return strict JSON with keys: kind,title,body,labels,pet_quip,due_at,workflow_status,confidence,reason,fallbackUsed."
        },
        {
          role: "user",
          content: `modeHint=${modeHint}\npetMode=${petMode}\ntext=${text}\n\nexistingTagVocabulary:\n${existingTagVocabulary.length ? existingTagVocabulary.join(", ") : "(none)"}\n\nmemoryHints:\n${hintText || "(none)"}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "classification",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              kind: { type: "string", enum: ["checklist", "journal", "workflow", "timeline"] },
              title: { type: "string" },
              body: { type: "string" },
              labels: { type: "array", items: { type: "string" } },
              pet_quip: { type: "string" },
              due_at: { type: ["string", "null"] },
              workflow_status: { type: ["string", "null"], enum: ["Backlog", "Ready", "In Progress", "Review", "Done", null] },
              confidence: { type: "number" },
              reason: { type: "string" },
              fallbackUsed: { type: "boolean" }
            },
            required: ["kind", "title", "body", "labels", "pet_quip", "due_at", "workflow_status", "confidence", "reason", "fallbackUsed"]
          }
        }
      }
    });

    const parsed = classificationResultSchema.parse(JSON.parse(response.output_text || "{}"));
    const memoryLabels = memoryHints.flatMap((h) => h.labels || []);
    const normalizedLabels = normalizeGeneratedLabels(parsed.labels, text, memoryLabels);
    const isIdeaLike = /\b(testing\b|test idea\b|idea\b|thought\b|hypothesis\b|explore\b)\b/i.test(text);
    const hasChecklistMarkers = /^(\[\s?\]|-|todo\b|fix\b|call\b|email\b|finish\b|buy\b|pick up\b)/i.test(text);
    const reminderLike = /\b(remind|reminder|due|alarm|timer|(in|after|for)\s+\d+\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days))\b/i.test(text);
    const timeLike = /\b(\d{1,2})(?::\d{2})?\s*(am|pm)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b|\bnoon\b|\bmidnight\b/i.test(text);
    const dayOnlyLike = /\b(today|tomorrow|next week)\b/i.test(text);
    const weekdayLike = /\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text);
    const hasTemporalCue = reminderLike || timeLike || weekdayLike || (dayOnlyLike && /\b(remind|reminder|alarm|timer|call|meet|book|pick up|pickup|drop off|dropoff)\b/i.test(text));
    const invalidTimeToken = hasInvalidTimeToken(text);
    const followupActionLike = /\b(remind|follow up|follow-up|connect|call|meet|check with|book|collect|pick up|pickup|drop off|dropoff)\b/i.test(text);
    const personLike = /\b(note from|from\s+[a-z][a-z0-9_-]{1,20}\b|[a-z][a-z0-9_-]{1,20}\s+(said|asked|called|told))\b/i.test(text);
    const directedActionLike = /\b(collect|bring|send|share|review|prepare|fix|connect|call|meet|check|follow up|follow-up|book|pick up|pickup)\b/i.test(text);
    const commaActionBatchLike = (() => {
      const parts = text.split(",").map((part) => normalizeText(part)).filter(Boolean);
      if (parts.length < 2 || parts.length > 5) return false;
      return parts.filter((part) => /^(fix|update|publish|buy|call|email|send|review|check|pick up|pickup|collect|book|pack|bring)\b/i.test(part)).length >= 2;
    })();
    const structuredListLike =
      ((text.match(/\d+\.\s+[^0-9]+(?=(\d+\.\s+)|$)/g)?.length || 0) >= 2) ||
      (text.split("\n").filter((line) => /^[-*]\s+/.test(line.trim())).length >= 2) ||
      commaActionBatchLike;
    const hardWorkflowLike = /\b(blocked|review|in progress|handoff|dependency|milestone|jira|kanban|rollout|assign|coordinate)\b/i.test(text);
    const explicitReminderLike = /\b(remind|reminder|alarm|timer)\b/i.test(text);
    const workflowActionItemsLike = /\b(action items?|assign|handoff|coordinate|dependency|blocked|milestone)\b/i.test(text);

    let refinedKind = parsed.kind;
    let refinedTitle = parsed.title;
    let refinedBody = parsed.body;
    let refinedReason = parsed.reason;

    if (modeHint === "auto" && parsed.kind === "checklist" && isIdeaLike && !hasChecklistMarkers) {
      refinedKind = "journal";
      refinedBody = parsed.body || text;
      refinedReason = `${parsed.reason} | post-rule: idea-like input mapped to journal`;
    }

    const deterministicDueAtRaw = parseDueAt(text, baseDate, clientTimezoneOffsetMinutes);
    const hasDayOnlyCue = /\b(today|tomorrow|next week)\b/i.test(text);
    const hasClockCue = /\b(\d{1,2})(?::\d{2})?\s*(am|pm)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b|\bnoon\b|\bmidnight\b|\b(in|after|for)\s+\d+\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/i.test(text);
    const deterministicDueAt =
      deterministicDueAtRaw && !(hasDayOnlyCue && !hasClockCue && !explicitReminderLike)
        ? deterministicDueAtRaw
        : null;
    const inferredDueAt = deterministicDueAt || parsed.due_at;

    if (
      modeHint === "auto" &&
      !invalidTimeToken &&
      !(workflowActionItemsLike && !explicitReminderLike) &&
      (hasTemporalCue || (parsed.kind === "timeline" && hasTemporalCue) || (weekdayLike && (followupActionLike || personLike)) || Boolean(deterministicDueAt && (followupActionLike || personLike)))
    ) {
      const parsedDueAt = inferredDueAt;
      refinedKind = "timeline";
      if (parsedDueAt) {
        refinedReason = `${refinedReason} | post-rule: reminder-like input mapped to timeline`;
      }
    }

    if (
      modeHint === "auto" &&
      refinedKind === "timeline" &&
      workflowActionItemsLike &&
      !explicitReminderLike &&
      !structuredListLike
    ) {
      refinedKind = "workflow";
      refinedReason = `${refinedReason} | post-rule: action-items text mapped to workflow`;
    }

    if (modeHint === "auto" && invalidTimeToken) {
      refinedKind = "journal";
      refinedReason = `${refinedReason} | post-rule: invalid time token, timeline suppressed`;
    }

    if (modeHint === "auto" && refinedKind === "timeline" && !deterministicDueAt && !hasTemporalCue) {
      if (personLike && directedActionLike && !structuredListLike) {
        refinedKind = "workflow";
        refinedReason = `${refinedReason} | post-rule: timeline without time cues mapped to workflow`;
      } else if (isIdeaLike && !hasChecklistMarkers) {
        refinedKind = "journal";
        refinedReason = `${refinedReason} | post-rule: timeline without time cues mapped to journal`;
      } else if (structuredListLike) {
        refinedKind = "checklist";
        refinedReason = `${refinedReason} | post-rule: timeline without time cues mapped to checklist`;
      } else {
        refinedKind = "journal";
        refinedReason = `${refinedReason} | post-rule: timeline without time cues mapped to journal`;
      }
    }

    if (refinedKind === "timeline") {
      const sourceTimelineTitle = normalizeText(text.replace(/#[a-z0-9_-]+/gi, ""));
      if (sourceTimelineTitle) {
        refinedTitle = sourceTimelineTitle;
      }
    }

    if (modeHint === "auto" && structuredListLike && !hardWorkflowLike && refinedKind === "workflow") {
      refinedKind = "checklist";
      refinedReason = `${refinedReason} | post-rule: structured list mapped to checklist`;
    }

    if (modeHint === "auto" && refinedKind !== "timeline" && personLike && directedActionLike && !structuredListLike) {
      refinedKind = "workflow";
      refinedReason = `${refinedReason} | post-rule: directed request mapped to workflow`;
    }

    if (modeHint !== "auto") {
      refinedKind = modeHint;
      refinedReason = `${refinedReason} | post-rule: manual mode override applied`;
    }

    const inferredLabels = inferContextLabels(text, refinedKind);
    let finalLabels = [...new Set([...normalizedLabels, ...inferredLabels])];
    if (finalLabels.length === 0) {
      const inferredFromAiText = inferContextLabels(`${parsed.title} ${parsed.body}`, refinedKind);
      finalLabels = [...new Set(inferredFromAiText)];
    }
    finalLabels = curateLabels(refinedKind, finalLabels);
    if (refinedKind === "timeline") {
      const genericTimelineLabels = new Set(["reminder", "notification", "timeline", "timer", "task", "note", "item"]);
      finalLabels = finalLabels.filter((label) => !genericTimelineLabels.has(label));
    }

    const safeParsedDueAt = (() => {
      if (!parsed.due_at) return null;
      if (invalidTimeToken) return null;
      if (hasDayOnlyCue && !hasClockCue && !explicitReminderLike) return null;
      const parsedAsDate = new Date(parsed.due_at);
      return Number.isNaN(parsedAsDate.getTime()) ? null : parsed.due_at;
    })();

    const finalDueAt = refinedKind === "timeline"
      ? (deterministicDueAt || safeParsedDueAt)
      : null;
    const finalTimelineMeta = refinedKind === "timeline"
      ? deriveTimelineMetaFromText(text, finalDueAt, baseDate, clientTimezoneOffsetMinutes)
      : null;
    const forcedDiary = /#\s*diary\b/i.test(text);
    if (forcedDiary) refinedKind = "journal";
    const finalJournalMeta = refinedKind === "journal"
      ? deriveJournalMetaFromText(text)
      : null;
    const finalBody = refinedKind === "journal" && finalJournalMeta?.journal_subtype === "diary"
      ? stripDiaryControlTags(refinedBody || text)
      : refinedBody;

    const finalWorkflowStatus = refinedKind === "workflow"
      ? (parsed.workflow_status || "Backlog")
      : null;

    return {
      ...parsed,
      kind: refinedKind,
      title: refinedTitle || parsed.title,
      body: finalBody,
      pet_quip: (parsed.pet_quip || "").trim(),
      due_at: finalDueAt,
      timeline_meta: finalTimelineMeta,
      journal_meta: finalJournalMeta,
      workflow_status: finalWorkflowStatus,
      labels: finalLabels,
      reason: refinedReason
    };
  } catch {
    return fallbackClassify(text, modeHint, baseDate, clientTimezoneOffsetMinutes);
  }
}


