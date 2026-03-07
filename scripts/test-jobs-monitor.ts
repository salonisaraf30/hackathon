import { loadEnvConfig } from "@next/env";
import * as cheerio from "cheerio";

loadEnvConfig(process.cwd());

const USER_AGENT = "Mozilla/5.0 (compatible; CompetitorPulse/1.0)";

// Test Jobs monitor without database dependencies
async function testJobsMonitor() {
	console.log("=== Testing Jobs Monitor ===\n");

	// Test with known company websites
	const testUrls = [
		"https://notion.so",
		"https://linear.app",
		"https://stripe.com",
		"https://vercel.com",
	];

	const testUrl = process.argv[2] || testUrls[0];
	const baseUrl = testUrl.replace(/\/$/, "");

	console.log(`Testing careers page scraping for: ${baseUrl}\n`);

	const careersPaths = ["/careers", "/jobs", "/about/careers", "/company/careers", "/join"];

	for (const path of careersPaths) {
		const url = baseUrl + path;
		console.log(`Trying: ${url}`);

		try {
			const res = await fetch(url, {
				headers: { "User-Agent": USER_AGENT },
				redirect: "follow",
			});

			if (!res.ok) {
				console.log(`  ❌ ${res.status} ${res.statusText}`);
				continue;
			}

			const html = await res.text();
			const $ = cheerio.load(html);

			// Remove non-content elements
			$("nav, footer, header, script, style, noscript, iframe, svg").remove();
			$("[role='navigation'], [role='banner'], [role='contentinfo']").remove();

			const text = $("body").text().replace(/\s+/g, " ").trim();

			// Check if this looks like a careers page
			const looksLikeCareers =
				text.toLowerCase().includes("job") ||
				text.toLowerCase().includes("career") ||
				text.toLowerCase().includes("position") ||
				text.toLowerCase().includes("hiring") ||
				text.toLowerCase().includes("open role");

			if (text.length > 200 && looksLikeCareers) {
				console.log(`  ✓ Found careers page! (${text.length} chars)`);
				console.log(`\n--- Sample content (first 500 chars) ---`);
				console.log(text.substring(0, 500));
				console.log(`\n--- End sample ---\n`);

				// Look for job-related keywords
				const keywords = [
					"engineer",
					"designer",
					"product manager",
					"sales",
					"marketing",
					"remote",
					"full-time",
					"apply",
				];
				const foundKeywords = keywords.filter((k) =>
					text.toLowerCase().includes(k)
				);
				console.log(`Found keywords: ${foundKeywords.join(", ")}`);
				console.log("\n✓ Jobs monitor is working correctly!");
				return;
			} else {
				console.log(`  ⚠ Page exists but doesn't look like careers (${text.length} chars)`);
			}
		} catch (error: any) {
			console.log(`  ❌ Error: ${error.message}`);
		}
	}

	console.log("\n⚠ No careers page found at standard paths");
	console.log("The monitor will return empty results for this competitor");
}

testJobsMonitor().catch(console.error);
