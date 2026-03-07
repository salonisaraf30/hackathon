// Shared types for ingestion monitors

export interface RawSignal {
	competitor_id: string;
	source: string;
	signal_type: string;
	title: string;
	summary: string;
	importance_score: number;
	raw_content: string;
}

export interface Competitor {
	id: string;
	name: string;
	website_url: string | null;
	twitter_handle: string | null;
	github_handle: string | null;
	product_hunt_slug: string | null;
}
