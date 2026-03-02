// app/api/digests/route.ts
// Handles: GET (list all digests for the authenticated user)

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/utils/api-error";

// GET /api/digests — List all digests for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated before doing anything
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError("Unauthorized", 401);

    // Fetch all digests with their associated signals and competitor names
    // digest_signals is the join table linking digests to the signals they include
    // signals → competitors gives us the competitor name for each signal in the digest
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

    // Surface DB errors as 500 via handleApiError
    if (error) throw new ApiError(error.message);

    return NextResponse.json({ digests });

  } catch (err) {
    // handleApiError distinguishes ApiError (known status) from unknown errors (500)
    return handleApiError(err);
  }
}