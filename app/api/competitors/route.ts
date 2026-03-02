// app/api/competitors/route.ts
// Handles: GET (list all competitors for user) and POST (add new competitor)

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { monitorWebsite } from "@/lib/ingestion/website-monitor";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/utils/api-error";

// GET /api/competitors — List all competitors for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated before doing anything
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError("Unauthorized", 401);

    // Fetch competitors with their signal counts
    // signals(count) uses Supabase's aggregation — returns { count: number } per competitor
    const { data: competitors, error } = await supabase
      .from("competitors")
      .select(`*, signals(count)`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Surface DB errors as 500 via handleApiError
    if (error) throw new ApiError(error.message);

    return NextResponse.json({ competitors });

  } catch (err) {
    // handleApiError distinguishes ApiError (known status) from unknown errors (500)
    return handleApiError(err);
  }
}

// POST /api/competitors — Add a new competitor and trigger initial scrape
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated before doing anything
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError("Unauthorized", 401);

    const body = await request.json();
    const { name, website_url, twitter_handle, product_hunt_slug, description } = body;

    // Validate required fields — name and website_url are the minimum
    // twitter_handle, product_hunt_slug, description are optional
    if (!name || !website_url) {
      throw new ApiError("Name and website URL are required", 400);
    }

    // Insert the competitor into Supabase
    // RLS ensures this row is owned by the authenticated user
    const { data: competitor, error } = await supabase
      .from("competitors")
      .insert({
        user_id: user.id,
        name,
        website_url,
        twitter_handle: twitter_handle || null,
        product_hunt_slug: product_hunt_slug || null,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw new ApiError(error.message);

    // Use admin client for the scrape + update operations
    // Admin client bypasses RLS, needed for server-side writes
    const admin = createAdminClient();
    let initialSignalsCount = 0;

    try {
      // Trigger an immediate scrape of the competitor's website on creation
      // so the user sees signals right away rather than waiting for the next cron run
      if (competitor.website_url) {
        const initialSignals = await monitorWebsite(
          competitor.id,
          competitor.website_url,
          admin
        );
        initialSignalsCount = initialSignals.length;

        // Record when we last scraped so the cron job knows not to re-scrape too soon
        await admin
          .from("competitors")
          .update({ last_scraped_at: new Date().toISOString() })
          .eq("id", competitor.id);
      }
    } catch (scrapeError) {
      // Scrape failure is intentionally non-fatal — the competitor row was already
      // created successfully. Log the error and return 201 anyway.
      // The next cron run will pick this competitor up and scrape it.
      console.error("Initial monitorWebsite scrape failed:", scrapeError);
    }

    // Return 201 Created with the new competitor and how many signals were found
    return NextResponse.json(
      { competitor, initial_signals_found: initialSignalsCount },
      { status: 201 }
    );

  } catch (err) {
    // handleApiError distinguishes ApiError (known status) from unknown errors (500)
    return handleApiError(err);
  }
}