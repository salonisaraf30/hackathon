import { loadEnvConfig } from "@next/env";

// Load env vars BEFORE importing modules that depend on them
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { runIngestion } from "@/lib/ingestion/run-ingestion";

const REQUIRED_ENV_VARS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL",
  "ANTHROPIC_API_KEY",
] as const;

function hasSupabaseUrl() {
  return Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function checkEnv() {
  const missing: string[] = [];

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!hasSupabaseUrl()) {
    missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    missing.push("ANTHROPIC_API_KEY");
  }

  return missing;
}

async function run() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           CompetitorPulse Ingestion Test                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const missing = checkEnv();

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    for (const key of missing) {
      console.error(`- ${key}`);
    }
    console.error("\nSet these variables, then run: npm run test:ingestion");
    process.exit(1);
  }

  // Create Supabase client for querying signals
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Get signal count before ingestion
  const { count: beforeCount } = await supabase
    .from("signals")
    .select("*", { count: "exact", head: true });

  console.log(`Signals in DB before: ${beforeCount ?? 0}\n`);
  console.log("Running ingestion...\n");

  const startTime = Date.now();
  const results = await runIngestion();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✓ Ingestion completed in ${elapsed}s`);
  console.log(`Competitors processed: ${results.length}`);

  const successCount = results.filter((item) => !item.error).length;
  const errorCount = results.length - successCount;

  console.log(`Success: ${successCount}, Errors: ${errorCount}\n`);

  // Get signals created in the last 5 minutes (from this run)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: recentSignals, error: signalError } = await supabase
    .from("signals")
    .select(`
      id,
      source,
      signal_type,
      title,
      summary,
      importance_score,
      detected_at,
      competitor_id
    `)
    .gte("detected_at", fiveMinutesAgo)
    .order("detected_at", { ascending: false });

  if (signalError) {
    console.error("Failed to fetch recent signals:", signalError);
    return;
  }

  // Get competitor names
  const competitorIds = [...new Set(recentSignals?.map((s) => s.competitor_id) ?? [])];
  const { data: competitors } = await supabase
    .from("competitors")
    .select("id, name")
    .in("id", competitorIds);

  const competitorMap = new Map(competitors?.map((c) => [c.id, c.name]) ?? []);

  if (!recentSignals || recentSignals.length === 0) {
    console.log("No new signals detected in this run.");
    console.log("This could mean:");
    console.log("  - No changes detected on competitor websites");
    console.log("  - No relevant news/jobs/releases found");
    console.log("  - API keys for optional monitors are missing");
    return;
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`  NEW SIGNALS DETECTED: ${recentSignals.length}`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  // Group signals by source
  const bySource: Record<string, typeof recentSignals> = {};
  for (const signal of recentSignals) {
    const source = signal.source || "unknown";
    if (!bySource[source]) bySource[source] = [];
    bySource[source].push(signal);
  }

  // Display signals grouped by source
  const sourceOrder = ["website", "news", "jobs", "github", "producthunt", "techcrunch"];
  const sourceLabels: Record<string, string> = {
    website: "🌐 WEBSITE CHANGES",
    news: "📰 NEWS ARTICLES",
    jobs: "💼 JOB POSTINGS",
    github: "🐙 GITHUB RELEASES",
    producthunt: "🚀 PRODUCT HUNT",
    techcrunch: "📱 TECHCRUNCH",
  };

  for (const source of sourceOrder) {
    const signals = bySource[source];
    if (!signals || signals.length === 0) continue;

    console.log(`\n${sourceLabels[source] || source.toUpperCase()} (${signals.length} signals)`);
    console.log("─".repeat(60));

    for (const signal of signals) {
      const competitor = competitorMap.get(signal.competitor_id) || "Unknown";
      const stars = "★".repeat(Math.min(signal.importance_score, 10));
      
      console.log(`\n  [${competitor}] ${signal.title}`);
      console.log(`  Type: ${signal.signal_type} | Importance: ${signal.importance_score}/10 ${stars}`);
      console.log(`  ${signal.summary?.substring(0, 150)}${(signal.summary?.length ?? 0) > 150 ? "..." : ""}`);
    }
  }

  // Summary table
  console.log("\n\n═══════════════════════════════════════════════════════════════");
  console.log("  SUMMARY BY SOURCE");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.table(
    sourceOrder
      .filter((s) => bySource[s]?.length)
      .map((source) => ({
        Source: sourceLabels[source]?.replace(/^[^\s]+\s/, "") || source,
        Signals: bySource[source]?.length ?? 0,
        "Avg Importance": (
          (bySource[source]?.reduce((sum, s) => sum + s.importance_score, 0) ?? 0) /
          (bySource[source]?.length || 1)
        ).toFixed(1),
      }))
  );

  // Per-competitor breakdown
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  SUMMARY BY COMPETITOR");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const byCompetitor: Record<string, { total: number; sources: Set<string> }> = {};
  for (const signal of recentSignals) {
    const name = competitorMap.get(signal.competitor_id) || "Unknown";
    if (!byCompetitor[name]) byCompetitor[name] = { total: 0, sources: new Set() };
    byCompetitor[name].total++;
    byCompetitor[name].sources.add(signal.source || "unknown");
  }

  console.table(
    Object.entries(byCompetitor).map(([name, data]) => ({
      Competitor: name,
      Signals: data.total,
      Sources: Array.from(data.sources).join(", "),
    }))
  );
}

run().catch((error) => {
  console.error("Ingestion test failed:", error);
  process.exit(1);
});
