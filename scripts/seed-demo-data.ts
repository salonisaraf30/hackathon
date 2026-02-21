import { loadEnvConfig } from "@next/env";

import { createAdminClient } from "@/lib/supabase/admin";

loadEnvConfig(process.cwd());

const DEMO_COMPETITORS = [
	{ name: "Notion", website_url: "https://www.notion.so" },
	{ name: "Linear", website_url: "https://linear.app" },
	{ name: "Coda", website_url: "https://coda.io" },
];

async function run() {
	const supabase = createAdminClient();

	console.log("Seeding demo competitors...");

	let inserted = 0;
	let skipped = 0;

	for (const competitor of DEMO_COMPETITORS) {
		const { data: existing, error: existingError } = await supabase
			.from("competitors")
			.select("id, name, website_url")
			.eq("website_url", competitor.website_url)
			.limit(1)
			.maybeSingle();

		if (existingError) {
			console.error(`Lookup failed for ${competitor.name}:`, existingError.message);
			continue;
		}

		if (existing) {
			skipped += 1;
			console.log(`Skipped ${competitor.name} (already exists).`);
			continue;
		}

		const { error: insertError } = await supabase.from("competitors").insert({
			name: competitor.name,
			website_url: competitor.website_url,
		});

		if (insertError) {
			console.error(`Failed to insert ${competitor.name}:`, insertError.message);
			continue;
		}

		inserted += 1;
		console.log(`Inserted ${competitor.name}.`);
	}

	console.log("\nSeed complete.");
	console.log(`Inserted: ${inserted}`);
	console.log(`Skipped: ${skipped}`);
}

run().catch((error) => {
	console.error("Seed failed:", error);
	process.exit(1);
});
