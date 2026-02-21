import { loadEnvConfig } from "@next/env";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { monitorWebsite } from "@/lib/ingestion/website-monitor";

loadEnvConfig(process.cwd());

function printUsage() {
  console.log(
    "Usage: npm run monitor:websites -- <competitorId> <url1> [url2] [url3] ...",
  );
}

function resolveSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, key };
}

async function run() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  if (args.length < 2) {
    printUsage();
    process.exit(1);
  }

  const [competitorId, ...urls] = args;

  const { url, key } = resolveSupabaseConfig();
  const supabase = createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  for (const websiteUrl of urls) {
    console.log(`\nMonitoring ${websiteUrl}...`);
    const signals = await monitorWebsite(competitorId, websiteUrl, supabase);
    console.log(`Extracted ${signals.length} signal(s).`);
    if (signals.length > 0) {
      console.dir(signals, { depth: null });
    }
  }
}

run().catch((error) => {
  console.error("Website monitor run failed:", error);
  process.exit(1);
});
