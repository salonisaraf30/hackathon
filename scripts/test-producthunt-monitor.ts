import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Test Product Hunt monitor without database dependencies
async function testProductHuntMonitor() {
	console.log("=== Testing Product Hunt Monitor ===\n");

	// Check for required env var
	if (!process.env.PH_ACCESS_TOKEN) {
		console.error("❌ PH_ACCESS_TOKEN is not set");
		console.log("\nTo test Product Hunt monitoring:");
		console.log("1. Create an app at https://www.producthunt.com/v2/oauth/applications");
		console.log("2. Generate a Developer Token");
		console.log("3. Add PH_ACCESS_TOKEN=your-token to .env.local");
		return;
	}

	console.log("✓ PH_ACCESS_TOKEN is set");

	// Test with known product slugs
	const testSlugs = ["notion-so", "linear", "figma"];
	const slug = process.argv[2] || testSlugs[0];

	console.log(`\nFetching Product Hunt data for slug: "${slug}"...\n`);

	const query = `{
		post(slug: "${slug}") {
			name
			tagline
			votesCount
			reviewsCount
			createdAt
			featuredAt
			url
			topics {
				edges {
					node {
						name
					}
				}
			}
		}
	}`;

	try {
		const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.PH_ACCESS_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query }),
		});

		if (!res.ok) {
			console.error(`❌ Product Hunt API returned ${res.status}: ${res.statusText}`);
			const text = await res.text();
			console.error(text);
			return;
		}

		const response = await res.json();

		if (response.errors?.length) {
			console.error("❌ Product Hunt API errors:", response.errors);
			return;
		}

		const post = response.data?.post;

		if (!post) {
			console.log(`No product found for slug "${slug}"`);
			console.log("\nTry a different slug, e.g.:");
			console.log("  npx tsx scripts/test-producthunt-monitor.ts notion-so");
			console.log("  npx tsx scripts/test-producthunt-monitor.ts linear");
			return;
		}

		console.log("--- Product Info ---");
		console.log(`Name: ${post.name}`);
		console.log(`Tagline: ${post.tagline}`);
		console.log(`Votes: ${post.votesCount}`);
		console.log(`Reviews: ${post.reviewsCount}`);
		console.log(`Created: ${post.createdAt}`);
		console.log(`Featured: ${post.featuredAt || "Not featured"}`);
		console.log(`URL: ${post.url}`);

		const topics = post.topics?.edges?.map((e: any) => e.node.name) || [];
		if (topics.length > 0) {
			console.log(`Topics: ${topics.join(", ")}`);
		}

		console.log("\n✓ Product Hunt monitor is working correctly!");
	} catch (error: any) {
		console.error("❌ Product Hunt API error:", error.message || error);
	}
}

testProductHuntMonitor().catch(console.error);
