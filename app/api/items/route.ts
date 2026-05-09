import { NextResponse } from "next/server";
import { createItemSchema } from "@/shared/types/schemas";
import { requireAuth } from "@/server/api/auth";
import { classifyWithAiOrFallback } from "@/server/ai/classifier-service";
import { buildItem } from "@/server/db/item-builder";

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
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const raw = await request.json();
  const payload = createItemSchema.parse(raw);

  const { count } = await auth.supabase.from("items").select("id", { count: "exact", head: true });
  const classification = await classifyWithAiOrFallback(payload.sourceText, payload.modeHint);
  const item = buildItem(auth.user.id, payload.sourceText, (count || 0) + 1, classification);

  const { error } = await auth.supabase.from("items").insert({
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

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item, classification });
}



