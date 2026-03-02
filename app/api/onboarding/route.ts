// app/api/onboarding/route.ts
// Handles: POST — saves the user's product info and competitors from the onboarding flow
// This is the first route called after signup. It:
//   1. Upserts the user's profile
//   2. Creates or updates their product (startup name, description, positioning)
//   3. Inserts any competitors they added, skipping duplicates
//   4. Triggers an initial website scrape for each new competitor

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { monitorWebsite } from "@/lib/ingestion/website-monitor";
import { handleApiError, ApiError } from "@/lib/utils/api-error";

type OnboardingCompetitorInput = {
  name?: string;
  url?: string;
};

type OnboardingPayload = {
  startupName?: string;
  description?: string;
  stage?: string | null;
  audiences?: string[];
  competitors?: (string | OnboardingCompetitorInput)[];
  goal?: string | null;
};

type CompetitorRow = {
  id: string;
  name: string;
  website_url: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated before doing anything
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError("Unauthorized", 401);

    // Ensure a profile row exists for this user
    // Uses upsert so re-running onboarding doesn't create duplicate profiles
    const { error: profileUpsertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, email: user.email ?? null }, { onConflict: "id" });

    if (profileUpsertError) {
      throw new ApiError(`Failed to initialize profile: ${profileUpsertError.message}`);
    }

    const body = (await request.json()) as OnboardingPayload;
    const {
      startupName,
      description,
      stage,
      audiences = [],
      competitors = [],
      goal,
    } = body;

    // startupName is the only required field in the onboarding flow
    if (!startupName?.trim()) {
      throw new ApiError("Startup name is required", 400);
    }

    // Combine description, stage, and goal into a single positioning string
    // This is what the AI pipeline uses to understand the user's product context
    const positioning = [description?.trim(), stage, goal].filter(Boolean).join(" | ");
    const targetMarket = audiences.length > 0 ? audiences.join(", ") : null;

    // Normalize audiences and build structured onboarding tags
    // These are stored as key_features and used by the intelligence pipeline
    const normalizedAudiences = audiences
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const onboardingTags = [
      ...(stage ? [`stage:${stage}`] : []),
      ...(goal ? [`goal:${goal}`] : []),
      ...normalizedAudiences.map((item) => `audience:${item}`),
    ];

    // Check if a product already exists for this user
    // Users who re-run onboarding should update, not create a duplicate
    const { data: existingProducts, error: existingProductError } = await supabase
      .from("user_products")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (existingProductError) throw new ApiError(existingProductError.message);

    const productPayload = {
      user_id: user.id,
      name: startupName.trim(),
      description: description?.trim() || null,
      positioning: positioning || null,
      target_market: targetMarket,
      key_features: onboardingTags,
    };

    // Update if product exists, insert if this is a new user
    let productError: Error | null = null;
    if ((existingProducts ?? []).length > 0) {
      const productId = existingProducts![0].id;
      const result = await supabase
        .from("user_products")
        .update(productPayload)
        .eq("id", productId);
      productError = result.error;
    } else {
      const result = await supabase.from("user_products").insert(productPayload);
      productError = result.error;
    }

    if (productError) throw new ApiError(productError.message);

    // ── COMPETITOR PROCESSING ───────────────────────────────────────────
    // Competitors can arrive as plain strings (just a name) or as objects
    // with name + url. Normalise everything into { name, website_url }.

    const cleanedCompetitors = competitors
      .map((item) => {
        if (typeof item === "string") {
          const name = item.trim();
          return name ? { name, website_url: null as string | null } : null;
        }

        const rawName = item?.name?.trim() ?? "";
        const rawUrl = item?.url?.trim() ?? "";

        // Skip entries with no name
        if (!rawName) return null;

        // Ensure the URL has a protocol — some users type just the domain
        const normalizedUrl = rawUrl
          ? rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
            ? rawUrl
            : `https://${rawUrl}`
          : null;

        return { name: rawName, website_url: normalizedUrl };
      })
      .filter((item): item is { name: string; website_url: string | null } =>
        Boolean(item)
      );

    if (cleanedCompetitors.length > 0) {
      // Fetch all existing competitors for this user to avoid duplicates
      const { data: existing, error: existingError } = await supabase
        .from("competitors")
        .select("id, name, website_url")
        .eq("user_id", user.id);

      if (existingError) throw new ApiError(existingError.message);

      const existingRows = (existing ?? []) as CompetitorRow[];

      // Build a lookup map by lowercase name for fast duplicate detection
      const existingByName = new Map(
        existingRows.map((item) => [item.name.trim().toLowerCase(), item])
      );

      // If a competitor already exists but had no URL, backfill it now
      // (user may have added a URL during re-onboarding)
      const admin = createAdminClient();
      for (const item of cleanedCompetitors) {
        const existingRow = existingByName.get(item.name.trim().toLowerCase());
        if (existingRow && !existingRow.website_url && item.website_url) {
          await supabase
            .from("competitors")
            .update({ website_url: item.website_url })
            .eq("id", existingRow.id);
        }
      }

      // Only insert competitors that don't already exist (by name)
      const toInsert = cleanedCompetitors
        .filter((item) => !existingByName.has(item.name.trim().toLowerCase()))
        .map((item) => ({
          user_id: user.id,
          name: item.name.trim(),
          website_url: item.website_url,
          description: "Added during onboarding",
        }));

      if (toInsert.length > 0) {
        const { data: insertedRowsRaw, error: insertError } = await supabase
          .from("competitors")
          .insert(toInsert)
          .select("id, name, website_url");

        if (insertError) throw new ApiError(insertError.message);

        const insertedRows = (insertedRowsRaw ?? []) as CompetitorRow[];

        // Trigger an immediate scrape for each newly inserted competitor
        // Scrape failures are non-fatal — log and continue to the next competitor
        // The cron job will retry on the next run
        for (const competitor of insertedRows) {
          if (!competitor.website_url) continue;

          try {
            await monitorWebsite(competitor.id, competitor.website_url, admin);

            // Record scrape time so the cron job doesn't re-scrape too soon
            await admin
              .from("competitors")
              .update({ last_scraped_at: new Date().toISOString() })
              .eq("id", competitor.id);
          } catch (scrapeError) {
            console.error(`Initial scrape failed for ${competitor.name}:`, scrapeError);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    // handleApiError distinguishes ApiError (known status) from unknown errors (500)
    return handleApiError(err);
  }
}