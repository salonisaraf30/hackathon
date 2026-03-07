import type { SupabaseClient } from "@supabase/supabase-js";

import { extractSignalsFromText } from "./signal-extractor";
import type { RawSignal, Competitor } from "./types";

interface NewsArticle {
	title: string;
	description: string | null;
	content: string | null;
	publishedAt: string;
	source: { name: string };
	url: string;
}

interface NewsApiResponse {
	status: string;
	totalResults: number;
	articles: NewsArticle[];
}

export async function monitorNews(
	competitor: Competitor,
	_supabaseClient?: SupabaseClient
): Promise<RawSignal[]> {
	const apiKey = process.env.NEWS_API_KEY;

	if (!apiKey) {
		console.warn("NEWS_API_KEY is missing; skipping news monitoring.");
		return [];
	}

	try {
		// Build query: search for competitor name or domain
		const domain = competitor.website_url
			?.replace("https://", "")
			.replace("http://", "")
			.split("/")[0];
		const query = domain
			? `"${competitor.name}" OR "${domain}"`
			: `"${competitor.name}"`;

		// Get articles from the last 24 hours
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
		const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${yesterday}&sortBy=relevancy&apiKey=${apiKey}`;

		const response = await fetch(url);

		if (!response.ok) {
			console.error(`NewsAPI returned ${response.status}: ${response.statusText}`);
			return [];
		}

		const data: NewsApiResponse = await response.json();

		if (!data.articles?.length) return [];

		// Take top 5 most relevant articles
		const topArticles = data.articles.slice(0, 5);
		const text = topArticles
			.map((a) => `${a.title}\n${a.description ?? ""}`)
			.join("\n\n");

		// Pass to Claude for signal extraction
		const signals = await extractSignalsFromText(text, competitor.name, "news");

		return signals.map((signal) => ({
			competitor_id: competitor.id,
			source: "news",
			signal_type: signal.signal_type,
			title: signal.title,
			summary: signal.summary,
			importance_score: signal.importance_score,
			raw_content: text.substring(0, 10000),
		}));
	} catch (error) {
		console.error(`Failed to monitor news for ${competitor.name}:`, error);
		return [];
	}
}
