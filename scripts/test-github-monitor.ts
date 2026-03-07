import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const GITHUB_API_BASE = "https://api.github.com";

// Test GitHub monitor without database dependencies
async function testGitHubMonitor() {
	console.log("=== Testing GitHub Monitor ===\n");

	const token = process.env.GITHUB_TOKEN;

	if (token) {
		console.log("✓ GITHUB_TOKEN is set (authenticated mode - 5000 req/hr)");
	} else {
		console.log("⚠ GITHUB_TOKEN not set (unauthenticated mode - 60 req/hr)");
		console.log("  Add GITHUB_TOKEN=your-token to .env.local for higher rate limits\n");
	}

	// Test with known repos
	const testHandles = ["linear", "notion-so"];
	const handle = process.argv[2] || testHandles[0];

	const headers: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "CompetitorPulse/1.0",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const isFullRepo = handle.includes("/");

	console.log(`Testing GitHub API for: ${handle}`);
	console.log(`Mode: ${isFullRepo ? "Single repo" : "Organization"}\n`);

	try {
		if (isFullRepo) {
			// Test single repo
			const [releasesRes, repoRes] = await Promise.all([
				fetch(`${GITHUB_API_BASE}/repos/${handle}/releases?per_page=5`, { headers }),
				fetch(`${GITHUB_API_BASE}/repos/${handle}`, { headers }),
			]);

			// Check rate limit
			const remaining = releasesRes.headers.get("X-RateLimit-Remaining");
			console.log(`Rate limit remaining: ${remaining}\n`);

			if (!releasesRes.ok) {
				console.error(`❌ Releases API returned ${releasesRes.status}`);
				const text = await releasesRes.text();
				console.error(text);
				return;
			}

			const releases = await releasesRes.json();
			const repo = repoRes.ok ? await repoRes.json() : null;

			if (repo) {
				console.log("--- Repository Info ---");
				console.log(`Name: ${repo.full_name}`);
				console.log(`Stars: ${repo.stargazers_count}`);
				console.log(`Forks: ${repo.forks_count}`);
				console.log(`Last push: ${repo.pushed_at}`);
				console.log();
			}

			if (releases.length === 0) {
				console.log("No releases found for this repo");
			} else {
				console.log(`--- Recent Releases (${releases.length}) ---`);
				for (const release of releases) {
					console.log(`\n${release.tag_name} (${release.prerelease ? "prerelease" : "stable"})`);
					console.log(`  Published: ${release.published_at}`);
					console.log(`  Name: ${release.name || "N/A"}`);
					console.log(`  Body: ${release.body?.substring(0, 150) || "N/A"}...`);
				}
			}
		} else {
			// Test organization
			const reposRes = await fetch(
				`${GITHUB_API_BASE}/orgs/${handle}/repos?sort=pushed&per_page=5`,
				{ headers }
			);

			const remaining = reposRes.headers.get("X-RateLimit-Remaining");
			console.log(`Rate limit remaining: ${remaining}\n`);

			if (!reposRes.ok) {
				console.error(`❌ Org repos API returned ${reposRes.status}`);
				const text = await reposRes.text();
				console.error(text);
				return;
			}

			const repos = await reposRes.json();

			console.log(`--- Organization: ${handle} ---`);
			console.log(`Found ${repos.length} recently pushed repos:\n`);

			for (const repo of repos) {
				console.log(`${repo.name}`);
				console.log(`  Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count}`);
				console.log(`  Last push: ${repo.pushed_at}`);
				console.log();
			}
		}

		console.log("✓ GitHub monitor is working correctly!");
	} catch (error: any) {
		console.error("❌ GitHub API error:", error.message || error);
	}
}

testGitHubMonitor().catch(console.error);
