import { NextResponse } from "next/server";
import { createItemSchema } from "@/shared/types/schemas";
import { requireAuth } from "@/server/api/auth";
import { classifyWithAiOrFallback } from "@/server/ai/classifier-service";
import { buildItem } from "@/server/db/item-builder";
import { defaultTimelineMeta } from "@/shared/domain/timeline";
import { defaultJournalMeta, formatDiaryEntry, stripDiaryControlTags } from "@/shared/domain/journal";
import { resolveAmbiguousChecklistAppend } from "@/server/checklist-append-resolver";
import { parseListFromText } from "@/server/checklist-parser";

function normalizeListLine(value: string): string {
  return value
    .toLowerCase()
    .replace(/^[-*\d.)\s]+/, "")
    .replace(/^\[( |x)\]\s*/i, "")
    .replace(/[.,!?;:()[\]{}"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  const itemIds = (data || []).map((item) => item.id);
  const metadataByItemId: Record<string, unknown> = {};
  if (itemIds.length) {
    const metadataResult = await auth.supabase
      .from("item_metadata")
      .select("item_id,metadata,created_at")
      .in("item_id", itemIds)
      .order("created_at", { ascending: false });
    if (!metadataResult.error) {
      for (const row of metadataResult.data || []) {
        if (!metadataByItemId[row.item_id]) metadataByItemId[row.item_id] = row.metadata;
      }
    }
  }

  const items = (data || []).map((item) => {
    const metadata = metadataByItemId[item.id] as Record<string, unknown> | null | undefined;
    const timelineMeta = item.kind === "timeline"
      ? (metadata || defaultTimelineMeta("stopwatch"))
      : null;
    const journalMeta = item.kind === "journal"
      ? (metadata || defaultJournalMeta("note"))
      : null;
    return {
      ...item,
      timeline_meta: timelineMeta,
      journal_meta: journalMeta
    };
  });
  return NextResponse.json({ items });
}

function hasInvalidClockToken(value: string): boolean {
  const text = value.toLowerCase();
  const t24 = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (t24) {
    const hh = Number(t24[1]);
    const mm = Number(t24[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh > 23 || mm > 59) return true;
  }
  const t12 = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (t12) {
    const hh = Number(t12[1]);
    const mm = Number(t12[2] || 0);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 1 || hh > 12 || mm > 59) return true;
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const raw = await request.json();
    const payload = createItemSchema.parse(raw);
    if (
      hasInvalidClockToken(payload.sourceText) &&
      /\b(remind|reminder|alarm|timer|today|tomorrow|next week)\b/i.test(payload.sourceText)
    ) {
      return NextResponse.json({ error: "Invalid timeline input: invalid time format." }, { status: 400 });
    }

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
      payload.petMode,
      payload.petEnabled,
      hintsResult.data || [],
      payload.clientNow ? new Date(payload.clientNow) : undefined,
      payload.clientTimezoneOffsetMinutes
    );
  const item = buildItem(auth.user.id, payload.sourceText, (countResult.count || 0) + 1, classification);
  const clientNow = payload.clientNow ? new Date(payload.clientNow) : new Date();
  const forcedDiaryTag = /#\s*diary\b/i.test(payload.sourceText);
  if (forcedDiaryTag) {
    item.kind = "journal";
    item.title = "Diary";
    item.journalMeta = {
      journal_subtype: "diary",
      last_entry_at: clientNow.toISOString()
    };
    if (!item.labels.includes("diary")) item.labels = [...item.labels, "diary"];
  }

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

    const openChecklistsResult = await auth.supabase
        .from("items")
        .select("id,title,body,labels,updated_at")
        .eq("user_id", auth.user.id)
        .eq("kind", "checklist")
        .eq("checked", false)
        .order("updated_at", { ascending: false })
        .limit(20);
    const openChecklists = openChecklistsResult.error ? [] : (openChecklistsResult.data || []);

    if (item.kind !== "checklist") {
      const resolvedAppend = resolveAmbiguousChecklistAppend(payload.sourceText, item.labels || [], openChecklists);
      if (resolvedAppend) {
        const mergedBody = mergeChecklistBody(resolvedAppend.target.body || "", resolvedAppend.items);
        const mergedResult = await auth.supabase
          .from("items")
          .update({
            body: mergedBody,
            updated_at: new Date().toISOString()
          })
          .eq("id", resolvedAppend.target.id)
          .eq("user_id", auth.user.id)
          .select("*")
          .single();

        if (!mergedResult.error) {
          return NextResponse.json({
            item: mergedResult.data,
            classification: {
              ...classification,
              reason: `${classification.reason} | context-append merged into existing checklist`
            },
            merged: true,
            mergedIntoId: resolvedAppend.target.id
          });
        }
      }
    }

    if (item.kind === "checklist") {
      const incomingList = parseListFromText(payload.sourceText);
      if (incomingList.length) {
        item.body = toChecklistMarkdown(incomingList);
      }

      if (openChecklists.length) {
        const open = openChecklists;

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

    if (item.kind === "journal" && item.journalMeta?.journal_subtype === "diary") {
      const journalResult = await auth.supabase
        .from("items")
        .select("id,title,body,labels,updated_at,checked")
        .eq("user_id", auth.user.id)
        .eq("kind", "journal")
        .eq("checked", false)
        .order("updated_at", { ascending: false })
        .limit(50);

      const journalCandidates = journalResult.data || [];
      const candidateIds = journalCandidates.map((row) => row.id);
      let existingDiary: { id: string; title: string; body: string; labels: string[] | null } | null = null;
      if (candidateIds.length) {
        const journalMetaResult = await auth.supabase
          .from("item_metadata")
          .select("item_id,metadata,created_at")
          .in("item_id", candidateIds)
          .order("created_at", { ascending: false });
        if (!journalMetaResult.error) {
          const seen = new Set<string>();
          for (const row of journalMetaResult.data || []) {
            if (seen.has(row.item_id)) continue;
            seen.add(row.item_id);
            const meta = row.metadata as { journal_subtype?: string } | null;
            if (meta?.journal_subtype === "diary") {
              const match = journalCandidates.find((c) => c.id === row.item_id);
              if (match) {
                existingDiary = {
                  id: match.id,
                  title: match.title,
                  body: match.body || "",
                  labels: match.labels || []
                };
                break;
              }
            }
          }
        }
      }
      if (!existingDiary) {
        const heuristic = journalCandidates.find((candidate) =>
          /^diary$/i.test((candidate.title || "").trim()) ||
          (candidate.labels || []).some((label: unknown) => String(label).toLowerCase() === "diary")
        );
        if (heuristic) {
          existingDiary = {
            id: heuristic.id,
            title: heuristic.title,
            body: heuristic.body || "",
            labels: heuristic.labels || []
          };
        }
      }

      const diaryMessage = stripDiaryControlTags(payload.sourceText) || item.body || item.title;
      const diaryEntry = formatDiaryEntry(diaryMessage, clientNow);
      if (existingDiary) {
        const nextBody = existingDiary.body ? `${existingDiary.body}\n${diaryEntry}` : diaryEntry;
        const mergedLabels = [...new Set([...(existingDiary.labels || []), ...(item.labels || [])])];
        const updateDiaryResult = await auth.supabase
          .from("items")
          .update({
            title: "Diary",
            body: nextBody,
            labels: mergedLabels,
            updated_at: clientNow.toISOString()
          })
          .eq("id", existingDiary.id)
          .eq("user_id", auth.user.id)
          .select("*")
          .single();

        if (!updateDiaryResult.error) {
          const existingCount = (existingDiary.body || "").split(/\r?\n/).filter(Boolean).length;
          await auth.supabase.from("item_metadata").insert({
            item_id: existingDiary.id,
            metadata: {
              journal_subtype: "diary",
              diary_entry_count: existingCount + 1,
              last_entry_at: clientNow.toISOString()
            }
          });
          return NextResponse.json({
            item: updateDiaryResult.data,
            classification: {
              ...classification,
              reason: `${classification.reason} | appended entry to global diary`
            },
            merged: true,
            mergedIntoId: existingDiary.id
          });
        }
      } else {
        item.title = "Diary";
        item.body = diaryEntry;
        item.journalMeta = {
          journal_subtype: "diary",
          diary_entry_count: 1,
          last_entry_at: clientNow.toISOString()
        };
        if (!item.labels.includes("diary")) item.labels = [...item.labels, "diary"];
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

    if (item.timelineMeta) {
      await auth.supabase.from("item_metadata").insert({
        item_id: item.id,
        metadata: item.timelineMeta
      });
    }
    if (item.journalMeta) {
      await auth.supabase.from("item_metadata").insert({
        item_id: item.id,
        metadata: item.journalMeta
      });
    }

    return NextResponse.json({ item, classification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown save error";
    return NextResponse.json({ error: `Unhandled save error: ${message}` }, { status: 500 });
  }
}



