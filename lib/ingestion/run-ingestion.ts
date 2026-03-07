// lib/ingestion/run-ingestion.ts
// Orchestrates ingestion across all (or one user's) competitors
// Called by: POST /api/ingestion (manual trigger) and /api/cron/ingest (scheduled)

import { createAdminClient } from "@/lib/supabase/admin";
import { monitorWebsite } from "./website-monitor";
import { type RawSignal } from "./types";
import { monitorNews } from "./news-monitor";
import { monitorJobs } from "./jobs-monitor";
import { monitorGitHub } from "./github-monitor";
import { monitorProductHunt } from "./producthunt-monitor";
import {monitorTechCrunch} from "./techcrunch-monitor";


export interface IngestionResult {
  competitor: string;
  signals?: number;
  error?: string;
}

interface CompetitorRow {
  id: string;
  name: string;
  website_url: string | null;
  twitter_handle: string | null;
  github_handle: string | null;
  product_hunt_slug: string | null;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 || len2 === 0) return 0;

  // Create distance matrix
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * Deduplicate signals: if two signals have the same competitor_id, signal_type,
 * and their titles are > 80% similar, keep only the higher importance_score one.
 */
function deduplicateSignals(signals: RawSignal[]): RawSignal[] {
  const result: RawSignal[] = [];

  for (const signal of signals) {
    let isDuplicate = false;
    let duplicateIndex = -1;

    for (let i = 0; i < result.length; i++) {
      const existing = result[i];
      if (
        existing.competitor_id === signal.competitor_id &&
        existing.signal_type === signal.signal_type
      ) {
        const similarity = calculateSimilarity(existing.title, signal.title);
        if (similarity > 0.8) {
          isDuplicate = true;
          duplicateIndex = i;
          break;
        }
      }
    }

    if (isDuplicate && duplicateIndex >= 0) {
      // Keep the one with higher importance_score
      if (signal.importance_score > result[duplicateIndex].importance_score) {
        result[duplicateIndex] = signal;
      }
    } else {
      result.push(signal);
    }
  }

  return result;
}

export async function runIngestion(userId?: string): Promise<IngestionResult[]> {
  const supabase = createAdminClient();

  // Fetch all competitors that have a website URL to scrape
  // If userId is provided, scope to just that user (manual trigger)
  // If userId is omitted, run for ALL users (cron job)
  let query = supabase
    .from("competitors")
    .select("id, website_url, name, twitter_handle, github_handle, product_hunt_slug")
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

  for (const competitor of competitors as CompetitorRow[]) {
    try {
      // Run all monitors in parallel
      const [websiteResult, newsResult, jobsResult, githubResult, productHuntResult, techCrunchResult] = await Promise.allSettled([
        competitor.website_url
          ? monitorWebsite(competitor.id, competitor.website_url, supabase)
          : Promise.resolve([]),
        monitorNews(competitor, supabase),
        monitorJobs(competitor, supabase),
        monitorGitHub(competitor, supabase),
        monitorProductHunt(competitor, supabase),
        monitorTechCrunch(competitor, supabase),
      ]);

      // Collect all fulfilled results, log rejected ones
      const allSignals: RawSignal[] = [];

      if (websiteResult.status === "fulfilled") {
        // Website monitor returns inserted signals directly, extract raw signal data
        const websiteSignals = websiteResult.value.map((s: any) => ({
          competitor_id: s.competitor_id ?? competitor.id,
          source: s.source ?? "website",
          signal_type: s.signal_type,
          title: s.title,
          summary: s.summary ?? "",
          importance_score: s.importance_score ?? 5,
          raw_content: s.raw_content ?? "",
        }));
        allSignals.push(...websiteSignals);
      } else {
        console.error(`Website monitor failed for ${competitor.name}:`, websiteResult.reason);
      }

      if (newsResult.status === "fulfilled") {
        allSignals.push(...newsResult.value);
      } else {
        console.error(`News monitor failed for ${competitor.name}:`, newsResult.reason);
      }

      if (jobsResult.status === "fulfilled") {
        allSignals.push(...jobsResult.value);
      } else {
        console.error(`Jobs monitor failed for ${competitor.name}:`, jobsResult.reason);
      }

      if (githubResult.status === "fulfilled") {
        allSignals.push(...githubResult.value);
      } else {
        console.error(`GitHub monitor failed for ${competitor.name}:`, githubResult.reason);
      }

      if (productHuntResult.status === "fulfilled") {
        allSignals.push(...productHuntResult.value);
      } else {
        console.error(`Product Hunt monitor failed for ${competitor.name}:`, productHuntResult.reason);
      }

      if (techCrunchResult.status === "fulfilled") {
        allSignals.push(...techCrunchResult.value);
      } else {
        console.error(`TechCrunch monitor failed for ${competitor.name}:`, techCrunchResult.reason);
      }

      // Deduplicate signals
      const deduplicatedSignals = deduplicateSignals(allSignals);

      // Filter out website signals (already inserted by website monitor) and insert others
      const newSignals = deduplicatedSignals.filter((s) => s.source !== "website");

      if (newSignals.length > 0) {
        const { error: signalInsertError } = await supabase
          .from("signals")
          .insert(newSignals);

        if (signalInsertError) {
          console.error(`Failed to insert signals for ${competitor.name}:`, signalInsertError);
        }
      }

      results.push({
        competitor: competitor.name,
        signals: deduplicatedSignals.length,
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

