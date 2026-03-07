import type { SupabaseClient } from "@supabase/supabase-js";

import type { RawSignal, Competitor } from "./types";

interface ProductHuntPost {
	name: string;
	votesCount: number;
	reviewsCount: number;
	tagline: string;
	createdAt: string;
	featuredAt: string | null;
	topics: {
		edges: Array<{ node: { name: string } }>;
	};
}

interface ProductHuntResponse {
	data?: {
		post?: ProductHuntPost;
	};
	errors?: Array<{ message: string }>;
}

export async function monitorProductHunt(
	competitor: Competitor,
	supabaseClient?: SupabaseClient
): Promise<RawSignal[]> {
	if (!competitor.product_hunt_slug) return [];

	const accessToken = process.env.PH_ACCESS_TOKEN;

	if (!accessToken) {
		console.warn("PH_ACCESS_TOKEN is missing; skipping Product Hunt monitoring.");
		return [];
	}

	const query = `{
		post(slug: "${competitor.product_hunt_slug}") {
			name
			votesCount
			reviewsCount
			tagline
			createdAt
			featuredAt
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
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query }),
		});

		if (!res.ok) {
			console.error(`Product Hunt API returned ${res.status}: ${res.statusText}`);
			return [];
		}

		const response: ProductHuntResponse = await res.json();

		if (response.errors?.length) {
			console.error("Product Hunt API errors:", response.errors);
			return [];
		}

		const post = response.data?.post;
		if (!post) return [];

		const signals: RawSignal[] = [];

		// Check if this was recently featured (within last 24 hours)
		if (post.featuredAt) {
			const featuredDate = new Date(post.featuredAt);
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

			if (featuredDate > yesterday) {
				signals.push({
					competitor_id: competitor.id,
					source: "producthunt",
					signal_type: "product_launch",
					title: `${competitor.name} featured on Product Hunt`,
					summary: `${post.name} was featured on Product Hunt with ${post.votesCount} upvotes. ${post.tagline}`,
					importance_score: 8,
					raw_content: JSON.stringify(post).substring(0, 10000),
				});
			}
		}

		// Check vote velocity if we have a previous snapshot
		if (supabaseClient) {
			const { data: lastSnapshot } = await supabaseClient
				.from("producthunt_snapshots")
				.select("votes_count, captured_at")
				.eq("competitor_id", competitor.id)
				.eq("slug", competitor.product_hunt_slug)
				.order("captured_at", { ascending: false })
				.limit(1)
				.maybeSingle();

			// Store current snapshot
			await supabaseClient.from("producthunt_snapshots").insert({
				competitor_id: competitor.id,
				slug: competitor.product_hunt_slug,
				votes_count: post.votesCount,
				reviews_count: post.reviewsCount,
			});

			// Check for significant vote growth
			if (lastSnapshot) {
				const voteGrowth = post.votesCount - lastSnapshot.votes_count;
				const hoursSinceLastCapture =
					(Date.now() - new Date(lastSnapshot.captured_at).getTime()) / (1000 * 60 * 60);

				// If votes grew > 50 in roughly a day, this is significant
				if (voteGrowth > 50 && hoursSinceLastCapture < 48) {
					signals.push({
						competitor_id: competitor.id,
						source: "producthunt",
						signal_type: "content_published",
						title: `${competitor.name} gaining traction on Product Hunt`,
						summary: `${post.name} gained ${voteGrowth} upvotes (now at ${post.votesCount} total). This indicates growing interest in their product.`,
						importance_score: 7,
						raw_content: JSON.stringify({ post, lastSnapshot, voteGrowth }).substring(0, 10000),
					});
				}
			}
		}

		return signals;
	} catch (error) {
		console.error(`Failed to monitor Product Hunt for ${competitor.name}:`, error);
		return [];
	}
}
