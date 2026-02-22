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

async function ensureUserHasProduct(userId: string) {
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

  if (!existing?.id) {
    throw new Error(
      "No user_products row found for this user. Complete onboarding first so digest can use real Supabase data.",
    );
  }
}

async function getCompetitors(userId: string): Promise<CompetitorRow[]> {
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("competitors")
    .select("id, name")
    .eq("user_id", userId)
    .returns<CompetitorRow[]>();

  if (fetchError) {
    throw new Error(`Failed to fetch competitors: ${fetchError.message}`);
  }

  if (!existing || existing.length === 0) {
    throw new Error(
      "No competitors found for this user. Add competitors in onboarding/competitors page before testing digest.",
    );
  }

  return existing;
}

async function ensureUserHasSignals(competitors: CompetitorRow[]) {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("signals")
    .select("id", { count: "exact", head: true })
    .in(
      "competitor_id",
      competitors.map((competitor) => competitor.id),
    );

  if (error) {
    throw new Error(`Failed to fetch signals: ${error.message}`);
  }

  if (!count || count === 0) {
    throw new Error(
      "No signals found for this user's competitors. Run ingestion first so digest uses real crawled Supabase data.",
    );
  }
}

async function run() {
  const inputUserId = process.argv[2];
  const userId = await resolveUserId(inputUserId);

  console.log(`Using user: ${userId}`);
  await ensureUserHasProduct(userId);

  const competitors = await getCompetitors(userId);
  await ensureUserHasSignals(competitors);

  console.log("Found existing Supabase product + competitors + signals.");

  const digest = await generateDigest(userId);

  console.log("\nDigest output:\n");
  console.log(JSON.stringify(digest, null, 2));
}

run().catch((error) => {
  console.error("Digest test failed:", error);
  process.exit(1);
});
