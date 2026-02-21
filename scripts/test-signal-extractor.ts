import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function run() {
  const { extractSignalsFromDiff } = await import("@/lib/ingestion/signal-extractor");

  const oldContent = `
    Notion helps teams write docs, manage tasks, and collaborate.
    Pricing starts at $8 per member/month.
    Careers: We are hiring across engineering and design.
  `;

  const newContent = `
    Notion unveils Notion AI Workflows for enterprise automation.
    Pricing starts at $12 per member/month with advanced automation included.
    Careers: We are hiring a VP of Partnerships and 8 AI engineers.
    New partnership announced with OpenAI for enterprise model hosting.
  `;

  const signals = await extractSignalsFromDiff("Notion", oldContent, newContent);
  console.log("Extracted signals:");
  console.dir(signals, { depth: null });
}

run().catch((error) => {
  console.error("Smoke test failed:", error);
  process.exit(1);
});
