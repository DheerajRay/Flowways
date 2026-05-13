import OpenAI from "openai";
import { fallbackClassify } from "@/shared/domain/classifier";
import { classificationResultSchema } from "@/shared/types/schemas";
import type { ClassificationResult, ItemKind } from "@/shared/types/item";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface MemoryHint {
  title: string;
  kind: ItemKind;
  labels?: string[] | null;
}

export async function classifyWithAiOrFallback(text: string, modeHint: "auto" | ItemKind, memoryHints: MemoryHint[] = []): Promise<ClassificationResult> {
  if (!client) {
    return fallbackClassify(text, modeHint);
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
            "Classify user capture into checklist, journal, workflow, or timeline. Prefer workflow for professional project/action items (prepare, draft, plan, review, handoff, release, docs). Use checklist for simple personal actionable todos/lists. Use memory hints to keep consistent categorization with existing items. Return strict JSON with keys: kind,title,body,labels,due_at,workflow_status,confidence,reason,fallbackUsed."
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

    const parsed = JSON.parse(response.output_text || "{}");
    return classificationResultSchema.parse(parsed);
  } catch {
    return fallbackClassify(text, modeHint);
  }
}


