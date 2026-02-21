import { createAdminClient } from "@/lib/supabase/admin";

import {
	retrieveRelevantSignals,
	retrieveRelevantSignalsFallback,
} from "./nia-client";
import { callNemotron, type NemotronResponse } from "./nemotron-client";

type ProductRow = {
	name: string;
	positioning: string | null;
	target_market: string | null;
	key_features: string[] | null;
	description: string | null;
};

type CompetitorRow = {
	id: string;
	name: string;
};

type SignalLike = {
	competitor_id?: string;
	signal_type?: string;
	title?: string;
	summary?: string;
	detected_at?: string;
	competitors?: {
		name?: string;
	} | null;
};

export async function generateDigest(
	userId: string,
): Promise<NemotronResponse & { title: string }> {
	const supabase = createAdminClient();

	const { data: product } = await supabase
		.from("user_products")
		.select("*")
		.eq("user_id", userId)
		.single<ProductRow>();

	if (!product) {
		throw new Error("User has no product info. Complete onboarding first.");
	}

	const { data: competitors } = await supabase
		.from("competitors")
		.select("id, name")
		.eq("user_id", userId)
		.returns<CompetitorRow[]>();

	if (!competitors?.length) {
		throw new Error("No competitors to analyze.");
	}

	const competitorIds = competitors.map((competitor) => competitor.id);
	const competitorNameMap = Object.fromEntries(
		competitors.map((competitor) => [competitor.id, competitor.name]),
	);

	let signals: SignalLike[];
	try {
		const retrieved = await retrieveRelevantSignals(
			`competitive intelligence ${product.name} ${product.target_market ?? ""}`,
			competitorIds,
		);
		signals = retrieved as SignalLike[];
	} catch {
		console.warn("Nia retrieval failed, falling back to Supabase");
		signals = (await retrieveRelevantSignalsFallback(competitorIds, 7)) as SignalLike[];
	}

	if (!signals?.length) {
		return {
			title: "Weekly Intelligence Brief",
			executive_summary:
				"No new competitive signals detected this week. Your competitors have been quiet.",
			insights: [],
			strategic_outlook:
				"Continue monitoring. Quiet periods often precede major announcements.",
		};
	}

	const signalText = signals
		.map((signal) => {
			const competitorName =
				signal.competitors?.name ||
				(signal.competitor_id ? competitorNameMap[signal.competitor_id] : undefined) ||
				"Competitor";

			return `
[${signal.signal_type ?? "signal"}] ${competitorName} — ${signal.title ?? "Untitled signal"}
${signal.summary ?? ""}
Detected: ${signal.detected_at ?? "Unknown"}
`;
		})
		.join("\n");

	const prompt = `You are a strategic competitive intelligence analyst.

CONTEXT — THE USER'S PRODUCT:
Name: ${product.name}
Positioning: ${product.positioning || "Not specified"}
Target Market: ${product.target_market || "Not specified"}
Key Features: ${(product.key_features || []).join(", ") || "Not specified"}
Description: ${product.description || "Not specified"}

RECENT COMPETITIVE SIGNALS:
${signalText}

Generate a weekly competitive intelligence brief with:
1. EXECUTIVE SUMMARY (2-3 sentences, what's the biggest story this week)
2. KEY INSIGHTS (for each major signal or cluster of related signals):
	 - What happened
	 - Why it matters FOR THIS SPECIFIC USER'S PRODUCT (reference their positioning, target market, and features)
	 - Recommended action (specific and actionable, not generic advice)
	 - Urgency level: high, medium, or low
3. STRATEGIC OUTLOOK (what to watch next week, 2-3 sentences)

CRITICAL INSTRUCTIONS:
- Be SPECIFIC. Reference the user's product by name. Compare directly to competitors.
- Don't give generic advice like "monitor the situation." Give concrete next steps.
- If a competitor is entering the user's target market, say so explicitly.
- If a pricing change creates an opportunity, quantify it if possible.
- The user should read this and immediately know what to DO, not just what happened.

Format as JSON:
{
	"executive_summary": "...",
	"insights": [
		{
			"competitor": "...",
			"signal_type": "...",
			"what_happened": "...",
			"why_it_matters": "...",
			"recommended_action": "...",
			"urgency": "high|medium|low"
		}
	],
	"strategic_outlook": "..."
}`;

	const result = await callNemotron(prompt);

	const today = new Date();
	const weekAgo = new Date(today);
	weekAgo.setDate(weekAgo.getDate() - 7);

	const title = `Intelligence Brief: ${weekAgo.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	})} – ${today.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	})}`;

	return { title, ...result };
}
