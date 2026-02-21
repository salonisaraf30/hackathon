// app/api/signals/route.ts
// Handles: GET (list signals with filters for the authenticated user)

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/signals?competitor_id=xxx&signal_type=xxx&limit=50&offset=0
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const competitorId = searchParams.get("competitor_id");
  const signalType = searchParams.get("signal_type");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const sortBy = searchParams.get("sort") || "detected_at"; // detected_at or importance_score
  const sortOrder = searchParams.get("order") || "desc";

  // First, get the user's competitor IDs (for RLS-like filtering)
  const { data: userCompetitors } = await supabase
    .from("competitors")
    .select("id")
    .eq("user_id", user.id);

  if (!userCompetitors || userCompetitors.length === 0) {
    return NextResponse.json({ signals: [], total: 0 });
  }

  const competitorIds = userCompetitors.map((c) => c.id);

  // Build query
  let query = supabase
    .from("signals")
    .select(
      `
      *,
      competitors(name, logo_url)
    `,
      { count: "exact" }
    )
    .in("competitor_id", competitorIds);

  // Apply filters
  if (competitorId) {
    query = query.eq("competitor_id", competitorId);
  }

  if (signalType) {
    query = query.eq("signal_type", signalType);
  }

  // Apply sorting and pagination
  const ascending = sortOrder === "asc";
  query = query.order(sortBy, { ascending }).range(offset, offset + limit - 1);

  const { data: signals, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    signals,
    total: count,
    limit,
    offset,
  });
}