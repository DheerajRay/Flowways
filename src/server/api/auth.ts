import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseBearerClient, getSupabaseServerClient } from "@/server/supabase/server";

export async function requireAuth() {
  const authorization = (await headers()).get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (accessToken) {
    const supabase = getSupabaseBearerClient(accessToken);
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (!error && data.user) {
      return { supabase, user: data.user, error: null };
    }
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { supabase, user: data.user, error: null };
}


