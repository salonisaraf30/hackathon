// app/api/cron/compute-metrics/route.ts
// Runs daily at 2am UTC — computes activity metrics for every competitor
// and upserts one row per competitor per day into competitor_metrics

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/utils/api-error";

export async function GET(request: NextRequest) {
  try {
    // Verify this is being called by Vercel Cron and not a random request
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      throw new ApiError("Unauthorized", 401);
    }

    const supabase = createAdminClient();

    // Compute metrics for yesterday — today's signals may still be coming in
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    // Fetch all competitors across all users
    const { data: competitors, error: competitorsError } = await supabase
      .from("competitors")
      .select("id, name");

    if (competitorsError) throw new ApiError(competitorsError.message);
    if (!competitors?.length) return NextResponse.json({ ok: true, processed: 0 });

    let processed = 0;

    for (const competitor of competitors) {
      // Fetch all signals detected for this competitor yesterday
      const { data: signals, error: signalsError } = await supabase
        .from("signals")
        .select("importance_score")
        .eq("competitor_id", competitor.id)
        .gte("detected_at", dateStr + "T00:00:00Z")
        .lt("detected_at", dateStr + "T23:59:59Z");

      if (signalsError) {
        console.error(`Failed to fetch signals for ${competitor.name}:`, signalsError);
        continue; // non-fatal — skip this competitor and move on
      }

      const signalCount = signals?.length ?? 0;
      const avgImportance =
        signalCount > 0
          ? signals!.reduce((sum, s) => sum + s.importance_score, 0) / signalCount
          : 0;
      // Activity score = volume × quality — a single number representing how
      // active this competitor was today for use in the trend chart
      const activityScore = signalCount * avgImportance;

      // Upsert so re-running the cron for the same day is safe
      await supabase.from("competitor_metrics").upsert({
        competitor_id: competitor.id,
        date: dateStr,
        signal_count: signalCount,
        avg_importance: avgImportance,
        activity_score: activityScore,
      });

      processed++;
    }

    return NextResponse.json({ ok: true, processed, date: dateStr });

  } catch (err) {
    return handleApiError(err);
  }
}
