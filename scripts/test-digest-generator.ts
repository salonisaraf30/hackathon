import { loadEnvConfig } from "@next/env";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateDigest } from "@/lib/intelligence/digest-generator";

loadEnvConfig(process.cwd());

type CompetitorRow = { id: string; name: string };

async function resolveUserId(preferredUserId?: string): Promise<string> {
  if (preferredUserId) {
    return preferredUserId;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const userId = data?.users?.[0]?.id;
  if (!userId) {
    throw new Error("No auth users found. Please create an account in the app first.");
  }

  return userId;
}

async function seedProduct(userId: string) {
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("user_products")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch user product: ${fetchError.message}`);
  }

  const payload = {
    user_id: userId,
    name: "CompetitorPulse",
    positioning: "AI-first competitive intelligence for PM-led SaaS teams",
    target_market: "B2B SaaS product teams (seed to Series C)",
    key_features: ["automated signal tracking", "weekly strategic digest", "action recommendations"],
    description:
      "Tracks competitor website and market signals, then generates weekly actionable intelligence briefs for product and GTM teams.",
  };

  if (existing?.id) {
    const { error } = await supabase.from("user_products").update(payload).eq("id", existing.id);
    if (error) {
      throw new Error(`Failed to update user product: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from("user_products").insert(payload);
  if (error) {
    throw new Error(`Failed to insert user product: ${error.message}`);
  }
}

async function seedCompetitors(userId: string): Promise<CompetitorRow[]> {
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("competitors")
    .select("id, name")
    .eq("user_id", userId)
    .returns<CompetitorRow[]>();

  if (fetchError) {
    throw new Error(`Failed to fetch competitors: ${fetchError.message}`);
  }

  if (existing && existing.length >= 2) {
    return existing.slice(0, 2);
  }

  const inserts = [
    {
      user_id: userId,
      name: "Notion",
      website_url: "https://www.notion.so",
    },
    {
      user_id: userId,
      name: "Linear",
      website_url: "https://linear.app",
    },
  ];

  const { data: inserted, error: insertError } = await supabase
    .from("competitors")
    .insert(inserts)
    .select("id, name")
    .returns<CompetitorRow[]>();

  if (insertError) {
    throw new Error(`Failed to insert competitors: ${insertError.message}`);
  }

  return inserted ?? [];
}

async function seedSignals(competitors: CompetitorRow[]) {
  const supabase = createAdminClient();

  const now = new Date();
  const signalRows = [
    {
      competitor_id: competitors[0].id,
      source: "website",
      signal_type: "pricing_change",
      title: "Notion launched AI Pro plan at $30/user",
      summary:
        "Notion introduced a new AI Pro tier with unlimited AI actions and enterprise security controls. The announcement positions Notion toward higher-value mid-market and enterprise accounts.",
      raw_content: "Seeded test signal",
      importance_score: 8,
      detected_at: now.toISOString(),
    },
    {
      competitor_id: competitors[1].id,
      source: "website",
      signal_type: "feature_update",
      title: "Linear added AI release notes generation",
      summary:
        "Linear announced AI-generated sprint and release summaries directly in the workflow. This reduces PM overhead and strengthens their automation narrative.",
      raw_content: "Seeded test signal",
      importance_score: 7,
      detected_at: now.toISOString(),
    },
    {
      competitor_id: competitors[1].id,
      source: "website",
      signal_type: "partnership",
      title: "Linear announced cloud partnership with Anthropic",
      summary:
        "Linear published a partnership update focused on secure model hosting and enterprise AI reliability. This could increase buyer confidence for regulated teams.",
      raw_content: "Seeded test signal",
      importance_score: 6,
      detected_at: now.toISOString(),
    },
  ];

  const { error } = await supabase.from("signals").insert(signalRows);
  if (error) {
    throw new Error(`Failed to insert signals: ${error.message}`);
  }
}

async function run() {
  const inputUserId = process.argv[2];
  const userId = await resolveUserId(inputUserId);

  console.log(`Using user: ${userId}`);
  await seedProduct(userId);

  const competitors = await seedCompetitors(userId);
  if (competitors.length < 2) {
    throw new Error("Need at least 2 competitors for digest test.");
  }

  await seedSignals(competitors);
  console.log("Seeded product + competitors + signals.");

  const digest = await generateDigest(userId);

  console.log("\nDigest output:\n");
  console.log(JSON.stringify(digest, null, 2));
}

run().catch((error) => {
  console.error("Digest test failed:", error);
  process.exit(1);
});
