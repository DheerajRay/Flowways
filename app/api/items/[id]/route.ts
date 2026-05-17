import { NextResponse } from "next/server";
import { updateItemSchema } from "@/shared/types/schemas";
import { requireAuth } from "@/server/api/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const payload = updateItemSchema.parse(await request.json());

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.title !== undefined) patch.title = payload.title;
  if (payload.body !== undefined) patch.body = payload.body;
  if (payload.checked !== undefined) patch.checked = payload.checked;
  if (payload.workflowStatus !== undefined) patch.workflow_status = payload.workflowStatus;
  if (payload.dueAt !== undefined) patch.due_at = payload.dueAt;
  if (payload.timelineMeta !== undefined) {
    await auth.supabase.from("item_metadata").insert({
      item_id: id,
      metadata: payload.timelineMeta
    });
  }
  if (payload.journalMeta !== undefined) {
    await auth.supabase.from("item_metadata").insert({
      item_id: id,
      metadata: payload.journalMeta
    });
  }
  if (payload.labels !== undefined) patch.labels = payload.labels;
  if (payload.position !== undefined) patch.position = payload.position;

  const result = await auth.supabase
    .from("items")
    .update(patch)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ item: result.data });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const result = await auth.supabase.from("items").delete().eq("id", id).eq("user_id", auth.user.id);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
