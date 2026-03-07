import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Test News monitor without database dependencies
async function testNewsMonitor() {
	console.log("=== Testing News Monitor ===\n");

	// Check for required env var
	if (!process.env.NEWS_API_KEY) {
		console.error("❌ NEWS_API_KEY is not set");
		console.log("\nTo test News monitoring:");
		console.log("1. Sign up at https://newsapi.org");
		console.log("2. Add NEWS_API_KEY=your-key to .env.local");
		return;
	}

	console.log("✓ NEWS_API_KEY is set");

	// Test with a known company
	const testCompanies = ["Notion", "Linear", "Stripe", "OpenAI"];
	const company = process.argv[2] || testCompanies[0];

	console.log(`\nSearching news for "${company}"...\n`);

	try {
		const yesterday = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // Last 7 days for testing
		const query = `"${company}"`;
		const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${yesterday}&sortBy=relevancy&apiKey=${process.env.NEWS_API_KEY}`;

		const response = await fetch(url);

		if (!response.ok) {
			const text = await response.text();
			console.error(`❌ NewsAPI returned ${response.status}: ${text}`);
			return;
		}

		const data = await response.json();

		if (data.status !== "ok") {
			console.error("❌ NewsAPI error:", data.message || data);
			return;
		}

		if (!data.articles?.length) {
			console.log(`No news articles found for "${company}" in the last 7 days`);
			return;
		}

		console.log(`Found ${data.totalResults} articles (showing top 5):\n`);

		for (const article of data.articles.slice(0, 5)) {
			console.log("---");
			console.log(`Source: ${article.source?.name || "Unknown"}`);
			console.log(`Title: ${article.title}`);
			console.log(`Published: ${article.publishedAt}`);
			console.log(`Description: ${article.description?.substring(0, 150) || "N/A"}...`);
			console.log(`URL: ${article.url}`);
			console.log();
		}

		console.log("✓ News monitor is working correctly!");
	} catch (error: any) {
		console.error("❌ News API error:", error.message || error);
	}
}

testNewsMonitor().catch(console.error);
