import type { SupabaseClient } from "@supabase/supabase-js";

import type { RawSignal, Competitor } from "./types";

interface GitHubRelease {
	tag_name: string;
	name: string;
	body: string | null;
	published_at: string;
	prerelease: boolean;
	html_url: string;
}

interface GitHubRepo {
	stargazers_count: number;
	forks_count: number;
	open_issues_count: number;
	description: string | null;
	pushed_at: string;
}

const GITHUB_API_BASE = "https://api.github.com";

export async function monitorGitHub(
	competitor: Competitor,
	_supabaseClient?: SupabaseClient
): Promise<RawSignal[]> {
	if (!competitor.github_handle) return [];

	const token = process.env.GITHUB_TOKEN;
	const headers: HeadersInit = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "CompetitorPulse/1.0",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const signals: RawSignal[] = [];
	const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

	try {
		// Handle both org/repo and org formats
		const handle = competitor.github_handle;
		const isFullRepo = handle.includes("/");

		if (isFullRepo) {
			// Monitor a specific repo
			const [releasesRes, repoRes] = await Promise.all([
				fetch(`${GITHUB_API_BASE}/repos/${handle}/releases?per_page=5`, { headers }),
				fetch(`${GITHUB_API_BASE}/repos/${handle}`, { headers }),
			]);

			if (releasesRes.ok) {
				const releases: GitHubRelease[] = await releasesRes.json();

				for (const release of releases) {
					const publishedAt = new Date(release.published_at);
					if (publishedAt > yesterday) {
						signals.push({
							competitor_id: competitor.id,
							source: "github",
							signal_type: "product_launch",
							title: `${competitor.name} released ${release.tag_name}`,
							summary: release.body?.slice(0, 500) || `New release ${release.name || release.tag_name} published.`,
							importance_score: release.prerelease ? 5 : 7,
							raw_content: JSON.stringify(release).substring(0, 10000),
						});
					}
				}
			}

			if (repoRes.ok) {
				const repo: GitHubRepo = await repoRes.json();
				// Check for significant recent activity
				const pushedAt = new Date(repo.pushed_at);
				if (pushedAt > yesterday && repo.stargazers_count > 100) {
					// Repo had recent activity - could indicate active development
					// This is lower importance as it's just activity, not a release
				}
			}
		} else {
			// Monitor an organization - get recent releases across public repos
			const reposRes = await fetch(
				`${GITHUB_API_BASE}/orgs/${handle}/repos?sort=pushed&per_page=10`,
				{ headers }
			);

			if (reposRes.ok) {
				const repos = await reposRes.json();

				// Check releases for top repos
				for (const repo of repos.slice(0, 5)) {
					try {
						const releasesRes = await fetch(
							`${GITHUB_API_BASE}/repos/${repo.full_name}/releases?per_page=3`,
							{ headers }
						);

						if (releasesRes.ok) {
							const releases: GitHubRelease[] = await releasesRes.json();

							for (const release of releases) {
								const publishedAt = new Date(release.published_at);
								if (publishedAt > yesterday) {
									signals.push({
										competitor_id: competitor.id,
										source: "github",
										signal_type: "product_launch",
										title: `${competitor.name} released ${release.tag_name} (${repo.name})`,
										summary: release.body?.slice(0, 500) || `New release ${release.name || release.tag_name} published.`,
										importance_score: release.prerelease ? 5 : 7,
										raw_content: JSON.stringify(release).substring(0, 10000),
									});
								}
							}
						}
					} catch {
						// Skip repos that fail
						continue;
					}
				}
			}
		}
	} catch (error) {
		console.error(`Failed to monitor GitHub for ${competitor.name}:`, error);
	}

	return signals;
}
