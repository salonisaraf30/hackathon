// app/api/ingestion/route.ts
// Handles: POST (trigger ingestion for a specific competitor or all competitors)
// Can be called in two ways:
//   1. With a competitor_id in the body — scrapes just that one competitor (user auth required)
//   2. Without a competitor_id — runs full ingestion for all competitors (cron or user auth)

import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion/run-ingestion";
import { monitorWebsite } from "@/lib/ingestion/website-monitor";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/utils/api-error";

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();

    // Safely parse the request body — competitor_id is optional
    let competitorId: string | null = null;
    try {
      const body = await request.json();
      competitorId = body?.competitor_id ?? null;
    } catch {
      // Body may be empty (e.g. cron call) — that's fine, competitorId stays null
      competitorId = null;
    }

    // ── PATH 1: Single competitor scrape ────────────────────────────────
    // If a competitor_id was provided, scrape just that one competitor.
    // Always requires user auth — cron does not use this path.
    if (competitorId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ApiError("Unauthorized", 401);

      // Fetch the competitor using admin client to bypass RLS,
      // then manually verify ownership (competitor.user_id must match auth user)
      const { data: competitor, error: competitorError } = await admin
        .from("competitors")
        .select("id, name, website_url, user_id")
        .eq("id", competitorId)
        .maybeSingle();

      if (competitorError) throw new ApiError(competitorError.message);

      // Reject if competitor doesn't exist or belongs to a different user
      if (!competitor || competitor.user_id !== user.id) {
        throw new ApiError("Competitor not found", 404);
      }

      if (!competitor.website_url) {
        throw new ApiError("Competitor missing website URL", 400);
      }

      // Run the website monitor for this competitor
      const insertedSignals = await monitorWebsite(
        competitor.id,
        competitor.website_url,
        admin
      );

      // Update last_scraped_at so the cron job knows not to re-scrape too soon
      await admin
        .from("competitors")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", competitor.id);

      return NextResponse.json({
        results: [
          {
            competitor: competitor.name,
            signals_found: insertedSignals.length,
            status: "success",
          },
        ],
      });
    }

    // ── PATH 2: Full ingestion run ───────────────────────────────────────
    // No competitor_id provided — run ingestion for all competitors.
    // Accepts either a cron call (Bearer CRON_SECRET) or a logged-in user.

    const authHeader = request.headers.get("authorization");
    const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // If not a cron call, require a logged-in user
    if (!isCronCall) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new ApiError("Unauthorized", 401);
    }

    // Scope the ingestion to a specific user if called manually (not by cron)
    // Cron runs ingestion for ALL users (userId undefined → runIngestion handles that)
    let userId: string | undefined;
    if (!isCronCall) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    const results = await runIngestion(userId);
    return NextResponse.json({ results });

  } catch (err) {
    // handleApiError distinguishes ApiError (known status) from unknown errors (500)
    return handleApiError(err);
  }
}