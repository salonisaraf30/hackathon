// app/api/ingest/route.ts
// Handles: POST (trigger signal ingestion — either for a single competitor or all)
// Called by: Vercel cron job (all competitors) OR competitor creation (single competitor)

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// POST /api/ingest
// Body: { competitor_id?: string } — if provided, scrape only this competitor
// If no body, scrape all competitors (used by cron)
export async function POST(request: NextRequest) {
  // Determine if this is a cron call or a user-triggered call
  // Cron calls have no body and must include CRON_SECRET
  // User-triggered calls include a competitor_id in the body

  let competitorId: string | null = null;
  let isCronCall = false;

  try {
    const body = await request.json();
    competitorId = body.competitor_id || null;
  } catch {
    // No body — this is a cron job call
    isCronCall = true;
  }

  // If it's a cron call (no body), verify the CRON_SECRET
  if (isCronCall) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createClient();

  try {
    let competitors;

    if (competitorId) {
      // Single competitor scrape (triggered on add)
      const { data } = await supabase
        .from("competitors")
        .select("*")
        .eq("id", competitorId);
      competitors = data;
    } else {
      // All competitors (cron job) — use service role key for this
      // In production, you'd use SUPABASE_SERVICE_ROLE_KEY here
      const { data } = await supabase.from("competitors").select("*");
      competitors = data;
    }

    if (!competitors || competitors.length === 0) {
      return NextResponse.json({ message: "No competitors to scrape" });
    }

    const results = [];

    for (const competitor of competitors) {
      try {
        const signals = await scrapeCompetitor(competitor, supabase);
        results.push({
          competitor: competitor.name,
          signals_found: signals.length,
          status: "success",
        });
      } catch (err: any) {
        results.push({
          competitor: competitor.name,
          signals_found: 0,
          status: "error",
          error: err.message,
        });
      }
    }

    // Update last_scraped_at for all processed competitors
    const ids = competitors.map((c: any) => c.id);
    await supabase
      .from("competitors")
      .update({ last_scraped_at: new Date().toISOString() })
      .in("id", ids);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Ingestion failed:", error);
    return NextResponse.json(
      { error: error.message || "Ingestion failed" },
      { status: 500 }
    );
  }
}

// ─── Core Scraping Logic ──────────────────────────────────────────────────────

async function scrapeCompetitor(competitor: any, supabase: any) {
  const allSignals: any[] = [];

  // 1. Scrape the main website
  if (competitor.website_url) {
    const websiteSignals = await scrapeWebsite(
      competitor.id,
      competitor.website_url,
      supabase
    );
    allSignals.push(...websiteSignals);
  }

  // 2. Scrape pricing page (if exists, try common paths)
  if (competitor.website_url) {
    const pricingUrls = [
      `${competitor.website_url}/pricing`,
      `${competitor.website_url}/plans`,
    ];
    for (const url of pricingUrls) {
      try {
        const pricingSignals = await scrapeWebsite(
          competitor.id,
          url,
          supabase
        );
        allSignals.push(...pricingSignals);
      } catch {
        // Pricing page doesn't exist at this path — that's fine
      }
    }
  }

  // 3. TODO: Add more sources here as needed
  // - Twitter scraping
  // - Product Hunt monitoring
  // - Job board scraping

  return allSignals;
}

async function scrapeWebsite(
  competitorId: string,
  url: string,
  supabase: any
) {
  // Fetch the page
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CompetitorPulse/1.0; +https://competitorpulse.com)",
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();

  // Parse and extract meaningful content
  const $ = cheerio.load(html);
  $("nav, footer, header, script, style, noscript, iframe, svg").remove();
  const textContent = $("body").text().replace(/\s+/g, " ").trim();

  // Truncate to avoid massive API calls (keep first 4000 chars)
  const truncatedContent = textContent.substring(0, 4000);

  // Hash the content
  const contentHash = crypto
    .createHash("md5")
    .update(truncatedContent)
    .digest("hex");

  // Check previous snapshot
  const { data: lastSnapshot } = await supabase
    .from("website_snapshots")
    .select("*")
    .eq("competitor_id", competitorId)
    .eq("url", url)
    .order("captured_at", { ascending: false })
    .limit(1)
    .single();

  // Store new snapshot
  await supabase.from("website_snapshots").insert({
    competitor_id: competitorId,
    url,
    content_hash: contentHash,
    raw_content: truncatedContent,
  });

  // If first scrape or content changed, extract signals
  const isFirstScrape = !lastSnapshot;
  const hasChanged = lastSnapshot && lastSnapshot.content_hash !== contentHash;

  if (isFirstScrape || hasChanged) {
    const signals = await extractSignalsWithAI(
      competitorId,
      url,
      truncatedContent,
      isFirstScrape ? null : lastSnapshot.raw_content,
      supabase
    );
    return signals;
  }

  return []; // No changes detected
}

// ─── AI Signal Extraction ─────────────────────────────────────────────────────

async function extractSignalsWithAI(
  competitorId: string,
  url: string,
  currentContent: string,
  previousContent: string | null,
  supabase: any
) {
  const diffContext = previousContent
    ? `PREVIOUS VERSION:\n${previousContent.substring(0, 2000)}\n\nCURRENT VERSION:\n${currentContent.substring(0, 2000)}`
    : `WEBSITE CONTENT:\n${currentContent.substring(0, 3000)}`;

  const prompt = `You are a competitive intelligence analyst. Analyze this website content and extract actionable competitive signals.

URL: ${url}

${diffContext}

${previousContent ? "Identify what CHANGED between the previous and current version." : "This is a first-time scan. Identify the most notable competitive signals from this content."}

Extract 1-5 signals. For each signal, provide:
- signal_type: one of "pricing_change", "feature_update", "product_launch", "hiring", "partnership", "content_published", "funding", "positioning_change"
- title: short, specific headline (e.g., "Launched enterprise tier at $99/mo")
- summary: 2-3 sentence explanation of what this means competitively
- importance_score: 1-10 (10 = major strategic move, 1 = minor update)

Respond ONLY with valid JSON array. If no meaningful signals found, return [].
Example:
[
  {
    "signal_type": "pricing_change",
    "title": "New enterprise tier launched at $99/mo",
    "summary": "Previously only had free and $29/mo plans. Adding enterprise tier signals move upmarket and potential feature gating for smaller customers.",
    "importance_score": 8
  }
]`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "[]";

  let parsedSignals;
  try {
    const cleaned = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    parsedSignals = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse signal extraction:", responseText);
    return [];
  }

  if (!Array.isArray(parsedSignals) || parsedSignals.length === 0) {
    return [];
  }

  // Store signals in Supabase
  const signalRows = parsedSignals.map((s: any) => ({
    competitor_id: competitorId,
    source: "website",
    signal_type: s.signal_type,
    title: s.title,
    summary: s.summary,
    raw_content: currentContent.substring(0, 1000),
    importance_score: s.importance_score || 5,
  }));

  const { data: insertedSignals, error } = await supabase
    .from("signals")
    .insert(signalRows)
    .select();

  if (error) {
    console.error("Failed to insert signals:", error);
    return [];
  }

  // TODO: Index in Nia for context retrieval
  // for (const signal of insertedSignals) {
  //   await indexSignalInNia(signal);
  // }

  return insertedSignals;
}