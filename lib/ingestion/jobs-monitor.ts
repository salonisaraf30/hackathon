import * as cheerio from "cheerio";
import type { SupabaseClient } from "@supabase/supabase-js";

import { extractSignalsFromText } from "./signal-extractor";
import type { RawSignal, Competitor } from "./types";

const USER_AGENT = "Mozilla/5.0 (compatible; CompetitorPulse/1.0)";

// Keywords that indicate strategic/important hires
const HIGH_IMPORTANCE_KEYWORDS = [
	"head of product",
	"vp engineering",
	"vp of engineering",
	"vice president",
	"machine learning",
	"ai engineer",
	"artificial intelligence",
	"enterprise sales",
	"general counsel",
	"chief revenue",
	"chief product",
	"chief technology",
	"cto",
	"cpo",
	"cro",
	"director of",
	"senior director",
	"staff engineer",
	"principal engineer",
    "developer"
];

export async function monitorJobs(
	competitor: Competitor,
	_supabaseClient?: SupabaseClient
): Promise<RawSignal[]> {
	if (!competitor.website_url) return [];

	// Try common careers page paths
	const baseUrl = competitor.website_url.replace(/\/$/, "");
	const careersPaths = ["/careers", "/jobs", "/about/careers", "/company/careers", "/join"];

	let jobText = "";
	let successUrl = "";

	for (const path of careersPaths) {
		try {
			const url = baseUrl + path;
			const res = await fetch(url, {
				headers: { "User-Agent": USER_AGENT },
				redirect: "follow",
			});

			if (!res.ok) continue;

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
				jobText = text.slice(0, 4000);
				successUrl = url;
				break;
			}
		} catch {
			// Careers page may not exist at this path
			continue;
		}
	}

	if (!jobText.trim()) return [];

	// Pass to signal extractor with source: 'jobs'
	const signals = await extractSignalsFromText(jobText, competitor.name, "jobs");

	// Boost importance for strategic hires
	return signals.map((signal) => {
		const titleLower = signal.title.toLowerCase();
		const summaryLower = signal.summary.toLowerCase();
		const combinedText = titleLower + " " + summaryLower;

		const isStrategicHire = HIGH_IMPORTANCE_KEYWORDS.some((k) =>
			combinedText.includes(k)
		);

		return {
			competitor_id: competitor.id,
			source: "jobs",
			signal_type: signal.signal_type,
			title: signal.title,
			summary: signal.summary,
			importance_score: isStrategicHire
				? Math.min(signal.importance_score + 2, 10)
				: signal.importance_score,
			raw_content: jobText.substring(0, 10000),
		};
	});
}
