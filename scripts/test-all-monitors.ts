import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Test all monitors at once to verify setup
async function testAllMonitors() {
	console.log("╔════════════════════════════════════════════════════════════╗");
	console.log("║           CompetitorPulse Monitor Test Suite               ║");
	console.log("╚════════════════════════════════════════════════════════════╝\n");

	const results: { name: string; status: "✓" | "⚠" | "❌"; message: string }[] = [];

	// Test 1: Environment Variables Check
	console.log("=== Environment Variables ===\n");

	const envVars = [
		{ name: "NEWS_API_KEY", required: false, for: "News Monitor" },
		{ name: "GITHUB_TOKEN", required: false, for: "GitHub Monitor (higher rate limit)" },
		{ name: "PH_ACCESS_TOKEN", required: false, for: "Product Hunt Monitor" },
		{ name: "ANTHROPIC_API_KEY", required: true, for: "Signal Extraction (Claude)" },
	];

	for (const env of envVars) {
		const isSet = !!process.env[env.name];
		const status = isSet ? "✓" : env.required ? "❌" : "⚠";
		console.log(`${status} ${env.name} - ${env.for}`);
	}

	// Test 2: Website Monitor (multi-page scraping)
	console.log("\n=== Testing Website Monitor (Linear multi-page) ===\n");
	try {
		const pages = ["", "/pricing", "/blog", "/changelog", "/about", "/careers"];
		const baseUrl = "https://linear.app";
		let successCount = 0;
		let totalChars = 0;

		for (const path of pages) {
			try {
				const res = await fetch(`${baseUrl}${path}`, {
					headers: { "User-Agent": "Mozilla/5.0 (compatible; CompetitorPulse/1.0)" },
					signal: AbortSignal.timeout(10000),
				});
				if (res.ok) {
					const text = await res.text();
					successCount++;
					totalChars += text.length;
				}
			} catch {
				// Skip failed pages
			}
		}

		if (successCount > 0) {
			results.push({
				name: "Website Monitor",
				status: "✓",
				message: `Scraped ${successCount}/6 pages (${(totalChars / 1024).toFixed(0)}KB total)`,
			});
			console.log(`✓ Website Monitor working (${successCount}/6 pages, ${(totalChars / 1024).toFixed(0)}KB)`);
		} else {
			results.push({ name: "Website Monitor", status: "❌", message: "No pages fetched" });
			console.log(`❌ Website Monitor failed: No pages could be fetched`);
		}
	} catch (error: any) {
		results.push({ name: "Website Monitor", status: "❌", message: error.message });
		console.log(`❌ Website Monitor error: ${error.message}`);
	}

	// Test 3: Jobs Monitor (no API key needed)
	console.log("\n=== Testing Jobs Monitor (Notion careers page) ===\n");
	try {
		const res = await fetch("https://notion.so/careers", {
			headers: { "User-Agent": "Mozilla/5.0 (compatible; CompetitorPulse/1.0)" },
			redirect: "follow",
		});
		if (res.ok) {
			const text = await res.text();
			results.push({
				name: "Jobs Monitor",
				status: "✓",
				message: `Fetched ${text.length} chars from Notion careers`,
			});
			console.log(`✓ Jobs Monitor working (${text.length} chars fetched)`);
		} else {
			results.push({ name: "Jobs Monitor", status: "❌", message: `HTTP ${res.status}` });
			console.log(`❌ Jobs Monitor failed: HTTP ${res.status}`);
		}
	} catch (error: any) {
		results.push({ name: "Jobs Monitor", status: "❌", message: error.message });
		console.log(`❌ Jobs Monitor error: ${error.message}`);
	}

	// Test 4: GitHub Monitor (works without token but limited)
	console.log("\n=== Testing GitHub Monitor (vercel/next.js) ===\n");
	try {
		const headers: HeadersInit = {
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "CompetitorPulse/1.0",
		};
		if (process.env.GITHUB_TOKEN) {
			headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
		}

		const res = await fetch("https://api.github.com/repos/vercel/next.js/releases?per_page=3", { headers });
		if (res.ok) {
			const releases = await res.json();
			const remaining = res.headers.get("X-RateLimit-Remaining");
			results.push({
				name: "GitHub Monitor",
				status: "✓",
				message: `Found ${releases.length} releases (${remaining} requests remaining)`,
			});
			console.log(`✓ GitHub Monitor working (${releases.length} releases, ${remaining} req remaining)`);
		} else {
			results.push({ name: "GitHub Monitor", status: "❌", message: `HTTP ${res.status}` });
			console.log(`❌ GitHub Monitor failed: HTTP ${res.status}`);
		}
	} catch (error: any) {
		results.push({ name: "GitHub Monitor", status: "❌", message: error.message });
		console.log(`❌ GitHub Monitor error: ${error.message}`);
	}

	// Test 5: News Monitor
	console.log("\n=== Testing News Monitor ===\n");
	if (process.env.NEWS_API_KEY) {
		try {
			const yesterday = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
			const url = `https://newsapi.org/v2/everything?q="OpenAI"&from=${yesterday}&sortBy=relevancy&pageSize=1&apiKey=${process.env.NEWS_API_KEY}`;
			const res = await fetch(url);
			const data = await res.json();
			if (data.status === "ok") {
				results.push({
					name: "News Monitor",
					status: "✓",
					message: `Found ${data.totalResults} articles`,
				});
				console.log(`✓ News Monitor working (${data.totalResults} articles found)`);
			} else {
				results.push({ name: "News Monitor", status: "❌", message: data.message || "Unknown error" });
				console.log(`❌ News Monitor failed: ${data.message}`);
			}
		} catch (error: any) {
			results.push({ name: "News Monitor", status: "❌", message: error.message });
			console.log(`❌ News Monitor error: ${error.message}`);
		}
	} else {
		results.push({ name: "News Monitor", status: "⚠", message: "NEWS_API_KEY not set" });
		console.log("⚠ News Monitor skipped (NEWS_API_KEY not set)");
	}

	// Test 6: Product Hunt Monitor
	console.log("\n=== Testing Product Hunt Monitor ===\n");
	if (process.env.PH_ACCESS_TOKEN) {
		try {
			const query = `{ post(slug: "notion-so") { name votesCount } }`;
			const res = await fetch("https://api.producthunt.com/v2/api/graphql", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.PH_ACCESS_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query }),
			});
			const data = await res.json();
			if (data.data?.post) {
				results.push({
					name: "Product Hunt Monitor",
					status: "✓",
					message: `Found ${data.data.post.name} (${data.data.post.votesCount} votes)`,
				});
				console.log(`✓ Product Hunt Monitor working (${data.data.post.name})`);
			} else {
				const errMsg = data.errors?.[0]?.message || "No data returned";
				results.push({ name: "Product Hunt Monitor", status: "❌", message: errMsg });
				console.log(`❌ Product Hunt Monitor failed: ${errMsg}`);
			}
		} catch (error: any) {
			results.push({ name: "Product Hunt Monitor", status: "❌", message: error.message });
			console.log(`❌ Product Hunt Monitor error: ${error.message}`);
		}
	} else {
		results.push({ name: "Product Hunt Monitor", status: "⚠", message: "PH_ACCESS_TOKEN not set" });
		console.log("⚠ Product Hunt Monitor skipped (PH_ACCESS_TOKEN not set)");
	}

	// Test 7: TechCrunch Monitor (RSS feeds, no API key needed)
	console.log("\n=== Testing TechCrunch Monitor (RSS feeds) ===\n");
	try {
		const res = await fetch("https://techcrunch.com/feed/", {
			headers: { "User-Agent": "CompetitorPulse/1.0 (RSS reader)" },
		});
		if (res.ok) {
			const xml = await res.text();
			const itemCount = (xml.match(/<item>/g) || []).length;
			results.push({
				name: "TechCrunch Monitor",
				status: "✓",
				message: `Found ${itemCount} articles in RSS feed`,
			});
			console.log(`✓ TechCrunch Monitor working (${itemCount} articles in feed)`);
		} else {
			results.push({ name: "TechCrunch Monitor", status: "❌", message: `HTTP ${res.status}` });
			console.log(`❌ TechCrunch Monitor failed: HTTP ${res.status}`);
		}
	} catch (error: any) {
		results.push({ name: "TechCrunch Monitor", status: "❌", message: error.message });
		console.log(`❌ TechCrunch Monitor error: ${error.message}`);
	}

	// Summary
	console.log("\n╔════════════════════════════════════════════════════════════╗");
	console.log("║                        Summary                              ║");
	console.log("╚════════════════════════════════════════════════════════════╝\n");

	const working = results.filter((r) => r.status === "✓").length;
	const skipped = results.filter((r) => r.status === "⚠").length;
	const failed = results.filter((r) => r.status === "❌").length;

	for (const r of results) {
		console.log(`${r.status} ${r.name}: ${r.message}`);
	}

	console.log(`\n${working} working, ${skipped} skipped (missing API keys), ${failed} failed`);

	if (skipped > 0) {
		console.log("\nTo enable skipped monitors, add the required API keys to .env.local");
	}
}

testAllMonitors().catch(console.error);
