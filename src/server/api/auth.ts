import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/server/supabase/server";

export async function requireAuth() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { supabase, user: data.user, error: null };
}


