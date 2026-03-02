// lib/ingestion/run-ingestion.ts
// Orchestrates ingestion across all (or one user's) competitors
// Called by: POST /api/ingestion (manual trigger) and /api/cron/ingest (scheduled)

import { createAdminClient } from "@/lib/supabase/admin";
import { monitorWebsite } from "./website-monitor";

export interface IngestionResult {
  competitor: string;
  signals?: number;
  error?: string;
}

export async function runIngestion(userId?: string): Promise<IngestionResult[]> {
  const supabase = createAdminClient();

  // Fetch all competitors that have a website URL to scrape
  // If userId is provided, scope to just that user (manual trigger)
  // If userId is omitted, run for ALL users (cron job)
  let query = supabase
    .from("competitors")
    .select("id, website_url, name")
    .not("website_url", "is", null);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: competitors, error } = await query;

  if (error || !competitors) {
    console.error("Failed to fetch competitors:", error);
    return [];
  }

  const results: IngestionResult[] = [];

  for (const competitor of competitors) {
    // Skip rows where website_url is somehow null despite the .not() filter
    if (!competitor.website_url) continue;

    try {
      const signals = await monitorWebsite(competitor.id, competitor.website_url, supabase);

      results.push({
        competitor: competitor.name,
        signals: signals?.length ?? 0,
      });

      // Record when we last scraped so we can avoid re-scraping too frequently
      const { error: updateError } = await supabase
        .from("competitors")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", competitor.id);

      if (updateError) {
        console.error(`Failed to update last_scraped_at for ${competitor.name}:`, updateError);
      }

    } catch (err) {
      // Scrape failure is intentionally non-fatal — log it and record the error
      // in the results, then continue to the next competitor so one bad scrape
      // does not abort the entire ingestion run
      console.error(`Scrape failed for ${competitor.name}:`, err);

      // Log to scrape_errors table so failures are visible in the dashboard
      // and can be retried or investigated without digging through server logs
      await supabase.from("scrape_errors").insert({
        competitor_id: competitor.id,
        error: String(err),
        failed_at: new Date().toISOString(),
      });

      results.push({ competitor: competitor.name, error: String(err) });
      // continue to next competitor
    }
  }

  return results;
}