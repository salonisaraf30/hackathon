import { loadEnvConfig } from "@next/env";
import * as cheerio from "cheerio";

loadEnvConfig(process.cwd());

// TechCrunch RSS feeds
const TC_FEEDS = [
	"https://techcrunch.com/feed/",
	"https://techcrunch.com/category/startups/feed/",
	"https://techcrunch.com/category/venture/feed/",
	"https://techcrunch.com/category/artificial-intelligence/feed/",
];

interface TechCrunchArticle {
	title: string;
	description: string;
	link: string;
	pubDate: string;
	categories: string[];
}

async function fetchFeed(feedUrl: string): Promise<TechCrunchArticle[]> {
	try {
		const res = await fetch(feedUrl, {
			headers: { "User-Agent": "CompetitorPulse/1.0 (RSS reader)" },
		});

		if (!res.ok) {
			console.log(`  ❌ ${feedUrl} → ${res.status}`);
			return [];
		}

		const xml = await res.text();
		const $ = cheerio.load(xml, { xmlMode: true });
		const articles: TechCrunchArticle[] = [];

		$("item").each((_, el) => {
			const title = $(el).find("title").text().trim();
			const description = $(el).find("description").text().trim();
			const link = $(el).find("link").text().trim() || $(el).find("guid").text().trim();
			const pubDate = $(el).find("pubDate").text().trim();

			const categories: string[] = [];
			$(el).find("category").each((_, cat) => {
				categories.push($(cat).text().trim());
			});

			if (title) {
				articles.push({ title, description, link, pubDate, categories });
			}
		});

		console.log(`  ✓ ${feedUrl} → ${articles.length} articles`);
		return articles;
	} catch (err: any) {
		console.log(`  ❌ ${feedUrl} → ${err.message}`);
		return [];
	}
}

function isRelevant(article: TechCrunchArticle, searchTerms: string[]): boolean {
	const haystack = [article.title, article.description, ...article.categories]
		.join(" ")
		.toLowerCase();

	return searchTerms.some((term) => haystack.includes(term.toLowerCase()));
}

async function testTechCrunchMonitor() {
	console.log("=== Testing TechCrunch Monitor ===\n");

	// Test competitor - can be passed as CLI arg
	const testCompanies = ["OpenAI", "Stripe", "Notion", "Linear", "Anthropic"];
	const company = process.argv[2] || testCompanies[0];

	console.log(`Target competitor: ${company}\n`);
	console.log("Fetching RSS feeds...");

	// Fetch all feeds
	const feedResults = await Promise.allSettled(TC_FEEDS.map(fetchFeed));

	const seen = new Set<string>();
	const allArticles: TechCrunchArticle[] = [];

	for (const result of feedResults) {
		if (result.status === "fulfilled") {
			for (const article of result.value) {
				if (!seen.has(article.link)) {
					seen.add(article.link);
					allArticles.push(article);
				}
			}
		}
	}

	console.log(`\nTotal unique articles: ${allArticles.length}`);

	// Filter to last 48 hours
	const cutoff = Date.now() - 48 * 60 * 60 * 1000;
	const recent = allArticles.filter((a) => {
		const ts = a.pubDate ? new Date(a.pubDate).getTime() : 0;
		return ts >= cutoff;
	});

	console.log(`Articles from last 48 hours: ${recent.length}`);

	// Search terms from company name
	const searchTerms = [company.toLowerCase()];

	// Filter relevant articles
	const relevant = recent.filter((a) => isRelevant(a, searchTerms));

	console.log(`Articles mentioning "${company}": ${relevant.length}\n`);

	if (relevant.length === 0) {
		console.log(`No TechCrunch articles found for "${company}" in the last 48 hours.`);
		console.log("\nTry testing with a more common company:");
		console.log("  npx tsx scripts/test-techcrunch-monitor.ts OpenAI");
		console.log("  npx tsx scripts/test-techcrunch-monitor.ts Stripe");
		console.log("  npx tsx scripts/test-techcrunch-monitor.ts Google");
		
		// Show some recent articles anyway
		console.log("\n--- Recent TechCrunch Headlines (for reference) ---");
		for (const article of recent.slice(0, 5)) {
			console.log(`• ${article.title}`);
		}
		return;
	}

	console.log(`--- Relevant Articles for "${company}" ---\n`);

	for (const article of relevant.slice(0, 5)) {
		console.log(`Title: ${article.title}`);
		console.log(`Date: ${article.pubDate}`);
		console.log(`Link: ${article.link}`);
		console.log(`Categories: ${article.categories.join(", ") || "N/A"}`);
		console.log(`Description: ${article.description.substring(0, 200)}...`);
		console.log();
	}

	console.log("✓ TechCrunch monitor is working correctly!");
	console.log("\nIn production, these articles would be sent to Claude for signal extraction.");
}

testTechCrunchMonitor().catch(console.error);
