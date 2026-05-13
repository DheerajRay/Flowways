import OpenAI from "openai";
import { fallbackClassify, inferContextLabels, normalizeGeneratedLabels, parseDueAt } from "@/shared/domain/classifier";
import { classificationResultSchema } from "@/shared/types/schemas";
import type { ClassificationResult, ItemKind } from "@/shared/types/item";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface MemoryHint {
  title: string;
  kind: ItemKind;
  labels?: string[] | null;
}

export async function classifyWithAiOrFallback(
  text: string,
  modeHint: "auto" | ItemKind,
  memoryHints: MemoryHint[] = [],
  baseDate = new Date()
): Promise<ClassificationResult> {
  if (!client) {
    return fallbackClassify(text, modeHint, baseDate);
  }

  try {
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
            "Classify user capture into checklist, journal, workflow, or timeline. Prefer workflow for professional project/action items (prepare, draft, plan, review, handoff, release, docs). Use checklist for simple personal actionable todos/lists. If input is exploratory/idea-like (for example 'testing something', 'test idea', 'thinking about'), prefer journal unless explicit task/list markers exist. Use memory hints to keep consistent categorization with existing items. Return strict JSON with keys: kind,title,body,labels,due_at,workflow_status,confidence,reason,fallbackUsed."
        },
        {
          role: "user",
          content: `modeHint=${modeHint}\ntext=${text}\n\nmemoryHints:\n${hintText || "(none)"}`
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
              due_at: { type: ["string", "null"] },
              workflow_status: { type: ["string", "null"], enum: ["Backlog", "Ready", "In Progress", "Review", "Done", null] },
              confidence: { type: "number" },
              reason: { type: "string" },
              fallbackUsed: { type: "boolean" }
            },
            required: ["kind", "title", "body", "labels", "due_at", "workflow_status", "confidence", "reason", "fallbackUsed"]
          }
        }
      }
    });

    const parsed = classificationResultSchema.parse(JSON.parse(response.output_text || "{}"));
    const memoryLabels = memoryHints.flatMap((h) => h.labels || []);
    const normalizedLabels = normalizeGeneratedLabels(parsed.labels, text, memoryLabels);
    const isIdeaLike = /\b(testing\b|test idea\b|idea\b|thought\b|hypothesis\b|explore\b)\b/i.test(text);
    const hasChecklistMarkers = /^(\[\s?\]|-|todo\b|fix\b|call\b|email\b|finish\b|buy\b|pick up\b)/i.test(text);
    const reminderLike = /\b(remind|reminder|due|tomorrow|today|next week|(in|after|for)\s+\d+\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days))\b/i.test(text);
    const timeLike = /\b(\d{1,2})(?::\d{2})?\s*(am|pm)\b|\b\d{2}:\d{2}\b/i.test(text);
    const structuredListLike =
      ((text.match(/\d+\.\s+[^0-9]+(?=(\d+\.\s+)|$)/g)?.length || 0) >= 2) ||
      (text.split("\n").filter((line) => /^[-*]\s+/.test(line.trim())).length >= 2);
    const hardWorkflowLike = /\b(blocked|review|in progress|handoff|dependency|milestone|jira|kanban)\b/i.test(text);

    let refinedKind = parsed.kind;
    let refinedTitle = parsed.title;
    let refinedBody = parsed.body;
    let refinedReason = parsed.reason;

    if (modeHint === "auto" && parsed.kind === "checklist" && isIdeaLike && !hasChecklistMarkers) {
      refinedKind = "journal";
      refinedBody = parsed.body || text;
      refinedReason = `${parsed.reason} | post-rule: idea-like input mapped to journal`;
    }

    const deterministicDueAt = parseDueAt(text, baseDate);
    const inferredDueAt = deterministicDueAt || parsed.due_at;

    if (modeHint === "auto" && (reminderLike || timeLike || parsed.kind === "timeline")) {
      const parsedDueAt = inferredDueAt;
      refinedKind = "timeline";
      if (parsedDueAt) {
        refinedReason = `${refinedReason} | post-rule: reminder-like input mapped to timeline`;
      }
    }

    if (
      refinedKind === "timeline" &&
      (timeLike || reminderLike) &&
      !/\b(\d{1,2})(?::\d{2})?\s*(am|pm)\b|\b\d{2}:\d{2}\b|\b(in|after|for)\s+\d+\s*(sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days)\b/i.test(refinedTitle)
    ) {
      refinedTitle = text.replace(/#[a-z0-9_-]+/gi, "").trim() || parsed.title;
    }

    if (modeHint === "auto" && structuredListLike && !hardWorkflowLike && refinedKind === "workflow") {
      refinedKind = "checklist";
      refinedReason = `${refinedReason} | post-rule: structured list mapped to checklist`;
    }

    const finalLabels = normalizedLabels.length ? normalizedLabels : inferContextLabels(text, refinedKind);

    const finalDueAt = refinedKind === "timeline"
      ? (deterministicDueAt || parsed.due_at)
      : parsed.due_at;

    return {
      ...parsed,
      kind: refinedKind,
      title: refinedTitle || parsed.title,
      body: refinedBody,
      due_at: finalDueAt,
      labels: finalLabels,
      reason: refinedReason
    };
  } catch {
    return fallbackClassify(text, modeHint, baseDate);
  }
}


