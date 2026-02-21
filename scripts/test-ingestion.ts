import { loadEnvConfig } from "@next/env";

import { runIngestion } from "@/lib/ingestion/run-ingestion";

loadEnvConfig(process.cwd());

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
  console.log("Starting ingestion smoke test...");
  const missing = checkEnv();

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    for (const key of missing) {
      console.error(`- ${key}`);
    }
    console.error("\nSet these variables, then run: npm run test:ingestion");
    process.exit(1);
  }

  const results = await runIngestion();

  console.log("\nIngestion completed.");
  console.log(`Competitors processed: ${results.length}`);

  const successCount = results.filter((item) => !item.error).length;
  const errorCount = results.length - successCount;

  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (results.length > 0) {
    console.log("\nResults:");
    console.table(
      results.map((item) => ({
        competitor: item.competitor,
        signals: item.signals ?? 0,
        error: item.error ?? "",
      })),
    );
  }
}

run().catch((error) => {
  console.error("Ingestion smoke test failed:", error);
  process.exit(1);
});
