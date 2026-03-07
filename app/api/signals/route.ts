// app/api/signals/route.ts
// Handles: GET (list signals with filters for the authenticated user)

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError } from "@/lib/utils/api-error";

// GET /api/signals?competitor_id=xxx&signal_type=xxx&limit=50&offset=0&sort=detected_at&order=desc
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated before doing anything
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError("Unauthorized", 401);

    // Parse query params — all are optional filters/pagination controls
    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get("competitor_id");
    const signalType = searchParams.get("signal_type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sort") || "detected_at"; // detected_at or importance_score
    const sortOrder = searchParams.get("order") || "desc";

    // Fetch all competitor IDs belonging to this user
    // Used to scope signals to only this user's tracked competitors
    // (signals table has no direct user_id — ownership flows through competitors)
    const { data: userCompetitors, error: competitorsError } = await supabase
      .from("competitors")
      .select("id")
      .eq("user_id", user.id);

    if (competitorsError) throw new ApiError(competitorsError.message);

    // If the user has no competitors yet, return empty early — nothing to query
    if (!userCompetitors || userCompetitors.length === 0) {
      return NextResponse.json({ signals: [], total: 0 });
    }

    const competitorIds = userCompetitors.map((c: { id: string }) => c.id);

    // Build the base query — scoped to this user's competitors
    // count: "exact" gives us the total for pagination without a second query
    let query = supabase
      .from("signals")
      .select(`*, competitors(name, logo_url)`, { count: "exact" })
      .in("competitor_id", competitorIds);

    // Narrow to a specific competitor if requested
    if (competitorId) {
      query = query.eq("competitor_id", competitorId);
    }

    // Narrow to a specific signal type if requested (e.g. pricing_change, product_launch)
    if (signalType) {
      query = query.eq("signal_type", signalType);
    }

    // Apply sort and pagination — range() is inclusive on both ends
    const ascending = sortOrder === "asc";
    query = query
      .order(sortBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data: signals, count, error } = await query;

    if (error) throw new ApiError(error.message);

    // Return signals alongside pagination metadata so the client
    // can implement infinite scroll or page controls
    return NextResponse.json({ signals, total: count, limit, offset });

  } catch (err) {
    // handleApiError distinguishes ApiError (known status) from unknown errors (500)
    return handleApiError(err);
  }
}