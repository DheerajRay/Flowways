import { NextResponse } from "next/server";
import { requireAuth } from "@/server/api/auth";
import { DEFAULT_USER_SETTINGS } from "@/shared/types/settings";
import { updateUserSettingsSchema, userSettingsSchema } from "@/shared/types/schemas";

function mergeWithDefaults(raw: unknown) {
  const parsed = updateUserSettingsSchema.parse(raw || {});
  return userSettingsSchema.parse({
    ...DEFAULT_USER_SETTINGS,
    ...parsed,
    color_palette: {
      ...DEFAULT_USER_SETTINGS.color_palette,
      ...(parsed.color_palette || {})
    }
  });
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from("user_settings")
    .select("pet_enabled,pet_mode,font_family,font_size,theme,color_palette")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const settings = mergeWithDefaults(data);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const raw = await request.json();
  const patch = updateUserSettingsSchema.parse(raw);

  const currentResult = await auth.supabase
    .from("user_settings")
    .select("pet_enabled,pet_mode,font_family,font_size,theme,color_palette")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (currentResult.error) return NextResponse.json({ error: currentResult.error.message }, { status: 400 });

  const merged = userSettingsSchema.parse({
    ...DEFAULT_USER_SETTINGS,
    ...(currentResult.data || {}),
    ...patch,
    color_palette: {
      ...DEFAULT_USER_SETTINGS.color_palette,
      ...((currentResult.data?.color_palette as Record<string, string> | undefined) || {}),
      ...(patch.color_palette || {})
    }
  });

  const { data, error } = await auth.supabase
    .from("user_settings")
    .upsert({
      user_id: auth.user.id,
      ...merged
    }, { onConflict: "user_id" })
    .select("pet_enabled,pet_mode,font_family,font_size,theme,color_palette")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: mergeWithDefaults(data) });
}
