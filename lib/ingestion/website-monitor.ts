import * as cheerio from "cheerio";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { extractSignalsFromDiff } from "./signal-extractor";

// All pages scraped per competitor on every run
// Each captures a different category of competitive signal
const TARGET_PATHS = [
  { path: "",           label: "homepage"  }, // positioning, messaging changes
  { path: "/pricing",   label: "pricing"   }, // pricing changes — highest importance
  { path: "/blog",      label: "blog"      }, // product updates, announcements
  { path: "/changelog", label: "changelog" }, // feature releases
  { path: "/about",     label: "about"     }, // team, company changes
  { path: "/careers",   label: "careers"   }, // hiring signals — strategic intent
];

const UA = "Mozilla/5.0 (compatible; CompetitorPulse/1.0)";

// ─── Levenshtein similarity (0–1) for deduplication ──────────────────────────
// Used to detect near-duplicate signals with slightly different wording
function stringSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;

  // Build Levenshtein distance matrix
  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter[i - 1] !== longer[j - 1]) {
          newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }
  return (longer.length - costs[longer.length]) / longer.length;
}

// ─── Deduplicate signals against each other and against existing DB signals ───
// A signal is a duplicate if:
//   - Same competitor, same signal_type, AND title similarity > 80%
// When duplicates are found, keep the one with the higher importance_score
type ExtractedSignal = {
  signal_type: string;
  title: string;
  summary: string;
  importance_score: number;
};

function deduplicateSignals(
  newSignals: ExtractedSignal[],
  existingSignals: { signal_type: string; title: string; importance_score: number | null }[]
): ExtractedSignal[] {
  const deduplicated: ExtractedSignal[] = [];

  for (const candidate of newSignals) {
    // Check against signals already in this batch
    const duplicateInBatch = deduplicated.find(
      (s) =>
        s.signal_type === candidate.signal_type &&
        stringSimilarity(s.title.toLowerCase(), candidate.title.toLowerCase()) > 0.8
    );

    if (duplicateInBatch) {
      // Keep the higher importance score version
      if (candidate.importance_score > duplicateInBatch.importance_score) {
        const idx = deduplicated.indexOf(duplicateInBatch);
        deduplicated[idx] = candidate;
      }
      continue;
    }

    // Check against signals already stored in the DB (last 7 days)
    const duplicateInDb = existingSignals.find(
      (s) =>
        s.signal_type === candidate.signal_type &&
        stringSimilarity(s.title.toLowerCase(), candidate.title.toLowerCase()) > 0.8
    );

    if (duplicateInDb) {
      // Already stored — skip unless this one has a higher importance score
      // (in which case we still add it as a new signal — the old one stays)
      if (candidate.importance_score <= (duplicateInDb.importance_score ?? 0)) {
        continue;
      }
    }

    deduplicated.push(candidate);
  }

  return deduplicated;
}

// ─── Fetch + extract text from a single page ─────────────────────────────────
// Keeps nav, header, and footer this time — they contain pricing CTAs,
// navigation labels, and footer links that reveal product structure changes
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000), // 10s timeout per page
    });

    // Skip pages that don't exist (404, 403, etc.)
    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove only true noise — keep nav, header, footer for competitive signals
    // Nav labels reveal product structure; footer reveals integrations and legal changes
    $("script, style, noscript, iframe, svg").remove();

    // Extract key structural sections separately so Claude has clear context
    const headerText = $("header, [role='banner']").text().replace(/\s+/g, " ").trim();
    const navText = $("nav, [role='navigation']").text().replace(/\s+/g, " ").trim();
    const mainText = $("main, [role='main'], #main, #content, .content").text().replace(/\s+/g, " ").trim();
    const footerText = $("footer, [role='contentinfo']").text().replace(/\s+/g, " ").trim();

    // Fall back to full body if no semantic sections found
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const structured = [headerText, navText, mainText, footerText].filter(Boolean).join(" | ");

    return (structured.length > 100 ? structured : bodyText).substring(0, 15000);
  } catch {
    // Network error, timeout, DNS failure — skip this page silently
    return null;
  }
}

// ─── Main monitor ─────────────────────────────────────────────────────────────
export async function monitorWebsite(
  competitorId: string,
  url: string,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient ?? (await createClient());

  // Fetch competitor name once — needed for signal extraction context
  const { data: competitor } = await supabase
    .from("competitors")
    .select("name")
    .eq("id", competitorId)
    .maybeSingle();

  const competitorName = competitor?.name ?? "Unknown";

  // Normalise base URL — strip trailing slash
  const baseUrl = url.replace(/\/$/, "");

  // Build full URLs for all target pages
  const pageTargets = TARGET_PATHS.map((t) => ({
    label: t.label,
    fullUrl: `${baseUrl}${t.path}`,
  }));

  // Scrape all pages in parallel — one failed page doesn't block the others
  const pageResults = await Promise.allSettled(
    pageTargets.map(async (target) => {
      const text = await fetchPageText(target.fullUrl);
      return { label: target.label, url: target.fullUrl, text };
    })
  );

  // Collect pages that successfully returned content
  const pages = pageResults
    .filter(
      (r): r is PromiseFulfilledResult<{ label: string; url: string; text: string | null }> =>
        r.status === "fulfilled" && r.value.text !== null
    )
    .map((r) => r.value) as { label: string; url: string; text: string }[];

  if (pages.length === 0) {
    console.error(`All pages failed to fetch for ${url}`);
    return [];
  }

  // Combine all page text into one blob for hashing and diffing
  // Section labels (=== PRICING ===) help Claude identify which page changed
  // and assign appropriate importance scores (pricing changes score higher)
  const combinedText = pages
    .map((p) => `=== ${p.label.toUpperCase()} ===\n${p.text}`)
    .join("\n\n");

  const contentHash = crypto.createHash("md5").update(combinedText).digest("hex");

  // Fetch the last snapshot to compare against
  const { data: lastSnapshot, error: snapshotError } = await supabase
    .from("website_snapshots")
    .select("*")
    .eq("competitor_id", competitorId)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapshotError) {
    console.error("Failed to fetch latest snapshot:", snapshotError);
  }

  // Store a new snapshot with the combined multi-page content
  const { error: insertSnapshotError } = await supabase
    .from("website_snapshots")
    .insert({
      competitor_id: competitorId,
      url: baseUrl,
      content_hash: contentHash,
      raw_content: combinedText.substring(0, 50000),
    });

  if (insertSnapshotError) {
    console.error("Failed to store website snapshot:", insertSnapshotError);
  }

  // If content hasn't changed across any of the pages, nothing to do
  if (lastSnapshot?.content_hash === contentHash) {
    return [];
  }

  // Extract signals by diffing old combined snapshot against new one
  const rawSignals = await extractSignalsFromDiff(
    competitorName,
    lastSnapshot?.raw_content ?? "",
    combinedText,
  ) as ExtractedSignal[];

  if (rawSignals.length === 0) return [];

  // Fetch recent signals from DB for deduplication check
  // Only look back 7 days — older signals are fine to re-detect if they resurface
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentSignals } = await supabase
    .from("signals")
    .select("signal_type, title, importance_score")
    .eq("competitor_id", competitorId)
    .gte("detected_at", sevenDaysAgo);

  // Deduplicate: remove signals that are near-identical to ones in this batch
  // or already stored in the DB within the last 7 days
  const deduplicatedSignals = deduplicateSignals(
    rawSignals,
    recentSignals ?? []
  );

  console.log(
    `[website-monitor] ${competitorName}: ${rawSignals.length} raw → ${deduplicatedSignals.length} after dedup`
  );

  if (deduplicatedSignals.length === 0) return [];

  // Map deduplicated signals to DB rows
  const rows = deduplicatedSignals.map((signal) => ({
    competitor_id: competitorId,
    source: "website",
    signal_type: signal.signal_type,
    title: signal.title,
    summary: signal.summary,
    importance_score: signal.importance_score,
    raw_content: combinedText.substring(0, 10000),
  }));

  const { data: insertedSignals, error: signalInsertError } = await supabase
    .from("signals")
    .insert(rows)
    .select();

  if (signalInsertError) {
    console.error("Failed to store extracted signals:", signalInsertError);
    return [];
  }

  return insertedSignals ?? [];
}
