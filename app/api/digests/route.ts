// app/api/digests/route.ts
// Handles: GET (list all digests for the authenticated user)

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/digests — List all digests for the authenticated user
export async function GET() {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: digests, error } = await supabase
    .from("digests")
    .select(
      `
      *,
      digest_signals(
        signal_id,
        signals(id, title, signal_type, competitor_id, competitors(name))
      )
    `
    )
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ digests });
}