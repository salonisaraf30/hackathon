import { createAdminClient } from "@/lib/supabase/admin";

import { monitorWebsite } from "./website-monitor";

export interface IngestionResult {
  competitor: string;
  signals?: number;
  error?: string;
}

export async function runIngestion(): Promise<IngestionResult[]> {
  const supabase = createAdminClient();

  const { data: competitors, error } = await supabase
    .from("competitors")
    .select("id, website_url, name")
    .not("website_url", "is", null);

  if (error || !competitors) {
    console.error("Failed to fetch competitors:", error);
    return [];
  }

  const results: IngestionResult[] = [];

  for (const competitor of competitors) {
    if (!competitor.website_url) {
      continue;
    }

    try {
      const signals = await monitorWebsite(competitor.id, competitor.website_url, supabase);
      results.push({
        competitor: competitor.name,
        signals: signals?.length ?? 0,
      });

      const { error: updateError } = await supabase
        .from("competitors")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", competitor.id);

      if (updateError) {
        console.error(`Failed to update last_scraped_at for ${competitor.name}:`, updateError);
      }
    } catch (err) {
      console.error(`Failed to monitor ${competitor.name}:`, err);
      results.push({ competitor: competitor.name, error: String(err) });
    }
  }

  return results;
}
