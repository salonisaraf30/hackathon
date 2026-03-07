// app/api/competitors/[id]/trends/route.ts
// Returns daily activity metrics for a single competitor over the last N days
// Used by the trend chart on the competitor detail page

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/utils/api-error";

// GET /api/competitors/[id]/trends?days=30
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError("Unauthorized", 401);

    // Verify the competitor belongs to this user before returning its data
    const { data: competitor, error: competitorError } = await supabase
      .from("competitors")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (competitorError || !competitor) {
      throw new ApiError("Competitor not found", 404);
    }

    // Parse the days query param — default to 30, cap at 90
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get("days") || "30"), 90);

    // Compute the start date for the range
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    // Fetch daily metrics ordered ascending so the chart renders left → right
    const { data: metrics, error: metricsError } = await supabase
      .from("competitor_metrics")
      .select("date, signal_count, activity_score")
      .eq("competitor_id", params.id)
      .gte("date", thirtyDaysAgoStr)
      .order("date", { ascending: true });

    if (metricsError) throw new ApiError(metricsError.message);

    // Compute signal velocity: last 7 days vs prior 7 days
    // This gives a % change that shows if the competitor is accelerating
    const last7 = metrics?.slice(-7) ?? [];
    const prior7 = metrics?.slice(-14, -7) ?? [];

    const last7Avg = last7.length
      ? last7.reduce((sum, m) => sum + (m.signal_count ?? 0), 0) / last7.length
      : 0;
    const prior7Avg = prior7.length
      ? prior7.reduce((sum, m) => sum + (m.signal_count ?? 0), 0) / prior7.length
      : 0;

    const velocityChange =
      prior7Avg > 0
        ? Math.round(((last7Avg - prior7Avg) / prior7Avg) * 100)
        : null; // null means not enough history to compute

    return NextResponse.json({
      metrics: metrics ?? [],
      velocity: {
        last7DaysAvg: Math.round(last7Avg * 10) / 10,
        prior7DaysAvg: Math.round(prior7Avg * 10) / 10,
        changePercent: velocityChange,
      },
    });

  } catch (err) {
    return handleApiError(err);
  }
}