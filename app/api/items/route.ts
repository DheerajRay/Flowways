import { NextResponse } from "next/server";
import { createItemSchema } from "@/shared/types/schemas";
import { requireAuth } from "@/server/api/auth";
import { classifyWithAiOrFallback } from "@/server/ai/classifier-service";
import { buildItem } from "@/server/db/item-builder";

function normalizeListLine(value: string): string {
  return value
    .toLowerCase()
    .replace(/^[-*\d.)\s]+/, "")
    .replace(/^\[( |x)\]\s*/i, "")
    .replace(/[.,!?;:()[\]{}"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseListFromText(value: string): string[] {
  const source = value.trim();
  if (!source) return [];

  const numbered = source.match(/\d+\.\s+[^\n]+/g)?.map((entry) => entry.replace(/^\d+\.\s+/, "").trim()) || [];
  if (numbered.length >= 2) return numbered;

  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, "").trim());

  if (lines.length >= 2) return lines;

  if (source.includes(",")) {
    const comma = source.split(",").map((token) => token.trim()).filter(Boolean);
    if (comma.length >= 2) return comma;
  }

  return [];
}

function isLikelySingleListItem(value: string): string | null {
  const source = value.trim();
  if (!source) return null;
  if (source.includes(",") || source.includes(";") || source.includes("\n")) return null;
  if (/\d+\.\s+/.test(source)) return null;
  if (source.length > 28) return null;
  if (/\b(remind|timer|today|tomorrow|next week|am|pm|:)\b/i.test(source)) return null;
  return source;
}

function hasShoppingContext(candidate: { title?: string | null; body?: string | null; labels?: string[] | null }): boolean {
  const labels = (candidate.labels || []).map((l) => l.toLowerCase());
  if (labels.includes("shopping") || labels.includes("grocery")) return true;
  const text = `${candidate.title || ""} ${candidate.body || ""}`.toLowerCase();
  return /\b(shopping|grocery|groceries|milk|eggs|bread|vegetable|fruit|tomato|onion)\b/.test(text);
}

function mergeChecklistBody(existingBody: string, incomingItems: string[]): string {
  const existingLines = existingBody
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const existingEntries = existingLines.length
    ? existingLines.map((line) => {
        const checked = /\[x\]/i.test(line);
        const text = line.replace(/^- \[( |x)\]\s+/i, "").replace(/^[-*\d.)\s]+/, "").trim();
        return { checked, text };
      })
    : [];

  const seen = new Set(existingEntries.map((entry) => normalizeListLine(entry.text)));
  for (const item of incomingItems) {
    const key = normalizeListLine(item);
    if (key && !seen.has(key)) {
      existingEntries.push({ checked: false, text: item });
      seen.add(key);
    }
  }

  return existingEntries.map((entry) => `- [${entry.checked ? "x" : " "}] ${entry.text}`).join("\n");
}

function toChecklistMarkdown(items: string[]): string {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- [ ] ${item}`)
    .join("\n");
}

const GENERIC_LABELS = new Set(["personal", "work", "idea", "list", "task"]);

function getSpecificOverlap(labelsA: string[], labelsB: string[]): string[] {
  const left = new Set(labelsA.filter((tag) => !GENERIC_LABELS.has(tag)));
  const right = new Set(labelsB.filter((tag) => !GENERIC_LABELS.has(tag)));
  return [...left].filter((tag) => right.has(tag));
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("items")
    .select("*")
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const raw = await request.json();
    const payload = createItemSchema.parse(raw);

    const countResult = await auth.supabase.from("items").select("id", { count: "exact", head: true });
    if (countResult.error) {
      return NextResponse.json({ error: `Count query failed: ${countResult.error.message}` }, { status: 400 });
    }

    const hintsResult = await auth.supabase
      .from("items")
      .select("title,kind,labels")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false })
      .limit(12);

    const classification = await classifyWithAiOrFallback(
      payload.sourceText,
      payload.modeHint,
      hintsResult.data || [],
      payload.clientNow ? new Date(payload.clientNow) : undefined,
      payload.clientTimezoneOffsetMinutes
    );
    const item = buildItem(auth.user.id, payload.sourceText, (countResult.count || 0) + 1, classification);
    const clientNow = payload.clientNow ? new Date(payload.clientNow) : new Date();

    if (item.kind === "timeline") {
      if (!item.dueAt) {
        return NextResponse.json({ error: "Invalid timeline input: could not determine a due time." }, { status: 400 });
      }
      const dueMs = new Date(item.dueAt).getTime();
      const nowMs = clientNow.getTime();
      if (Number.isNaN(dueMs) || dueMs <= nowMs) {
        return NextResponse.json({ error: "Invalid timeline input: due time must be in the future." }, { status: 400 });
      }
    }

    if (item.kind === "checklist") {
      const incomingList = parseListFromText(payload.sourceText);
      if (incomingList.length) {
        item.body = toChecklistMarkdown(incomingList);
      }
      const openChecklistsResult = await auth.supabase
        .from("items")
        .select("id,title,body,labels,updated_at")
        .eq("user_id", auth.user.id)
        .eq("kind", "checklist")
        .eq("checked", false)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (!openChecklistsResult.error && openChecklistsResult.data?.length) {
        const open = openChecklistsResult.data;

        if (!incomingList.length) {
          const single = isLikelySingleListItem(payload.sourceText);
          const shoppingCandidate = single
            ? open.find((candidate) => hasShoppingContext(candidate))
            : null;
          if (shoppingCandidate) {
            const mergedBody = mergeChecklistBody(shoppingCandidate.body || "", [single!]);
            const mergedResult = await auth.supabase
              .from("items")
              .update({
                body: mergedBody,
                updated_at: new Date().toISOString()
              })
              .eq("id", shoppingCandidate.id)
              .eq("user_id", auth.user.id)
              .select("*")
              .single();

            if (!mergedResult.error) {
              return NextResponse.json({
                item: mergedResult.data,
                classification: {
                  ...classification,
                  reason: `${classification.reason} | auto-merged single item into shopping checklist`
                },
                merged: true,
                mergedIntoId: shoppingCandidate.id
              });
            }
          }
        }

        if (incomingList.length) {
          const scored = open
            .map((candidate) => ({
              candidate,
              overlap: getSpecificOverlap(item.labels || [], candidate.labels || [])
            }))
            .filter((entry) => entry.overlap.length > 0)
            .sort((a, b) => b.overlap.length - a.overlap.length);

          const strongMatch = scored[0]?.candidate;
          if (strongMatch) {
            const mergedBody = mergeChecklistBody(strongMatch.body || "", incomingList);
            const mergedResult = await auth.supabase
              .from("items")
              .update({
                body: mergedBody,
                updated_at: new Date().toISOString()
              })
              .eq("id", strongMatch.id)
              .eq("user_id", auth.user.id)
              .select("*")
              .single();

            if (!mergedResult.error) {
              return NextResponse.json({
                item: mergedResult.data,
                classification: {
                  ...classification,
                  reason: `${classification.reason} | auto-merged into existing checklist`
                },
                merged: true,
                mergedIntoId: strongMatch.id
              });
            }
          }
        }
      }
    }

    const insertResult = await auth.supabase.from("items").insert({
      id: item.id,
      user_id: item.userId,
      kind: item.kind,
      title: item.title,
      body: item.body,
      labels: item.labels,
      workflow_status: item.workflowStatus,
      checked: item.checked,
      due_at: item.dueAt,
      position: item.position,
      source_text: item.sourceText,
      classification_confidence: item.classificationConfidence,
      classification_reason: item.classificationReason
    });

    if (insertResult.error) {
      return NextResponse.json({ error: `Insert failed: ${insertResult.error.message}`, code: insertResult.error.code }, { status: 400 });
    }

    return NextResponse.json({ item, classification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown save error";
    return NextResponse.json({ error: `Unhandled save error: ${message}` }, { status: 500 });
  }
}



