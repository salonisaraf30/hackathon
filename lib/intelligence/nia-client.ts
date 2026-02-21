import { createAdminClient } from "@/lib/supabase/admin";

const NIA_BASE_URL = process.env.NIA_BASE_URL ?? "https://api.nozomio.com/v1";

export interface NiaSignalPayload {
	id: string;
	competitor_id: string;
	signal_type: string;
	title: string;
	summary: string;
	detected_at: string;
	importance_score: number;
}

interface NiaSearchResult {
	[key: string]: unknown;
}

export async function indexSignalInNia(signal: NiaSignalPayload): Promise<boolean> {
	const apiKey = process.env.NIA_API_KEY;
	if (!apiKey) {
		console.warn("NIA_API_KEY is missing; skipping Nia indexing.");
		return false;
	}

	try {
		const response = await fetch(`${NIA_BASE_URL}/index`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				document: `${signal.title}\n${signal.summary}`,
				metadata: {
					signal_id: signal.id,
					competitor_id: signal.competitor_id,
					signal_type: signal.signal_type,
					detected_at: signal.detected_at,
					importance_score: signal.importance_score,
				},
			}),
		});

		return response.ok;
	} catch (error) {
		console.error("Failed to index signal in Nia:", error);
		return false;
	}
}

export async function retrieveRelevantSignals(
	query: string,
	competitorIds: string[],
	limit = 20,
): Promise<NiaSearchResult[]> {
	const apiKey = process.env.NIA_API_KEY;
	if (!apiKey) {
		return retrieveRelevantSignalsFallback(competitorIds, 7);
	}

	try {
		const response = await fetch(`${NIA_BASE_URL}/search`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query,
				filters: {
					competitor_id: { $in: competitorIds },
				},
				limit,
			}),
		});

		if (!response.ok) {
			console.error("Nia search failed with status", response.status);
			return retrieveRelevantSignalsFallback(competitorIds, 7);
		}

		const data = (await response.json()) as { results?: NiaSearchResult[] };
		return data.results ?? [];
	} catch (error) {
		console.error("Failed to retrieve signals from Nia:", error);
		return retrieveRelevantSignalsFallback(competitorIds, 7);
	}
}

export async function retrieveRelevantSignalsFallback(
	competitorIds: string[],
	daysSince = 7,
) {
	const supabase = createAdminClient();
	const since = new Date();
	since.setDate(since.getDate() - daysSince);

	const { data, error } = await supabase
		.from("signals")
		.select("*, competitors(name)")
		.in("competitor_id", competitorIds)
		.gte("detected_at", since.toISOString())
		.order("importance_score", { ascending: false })
		.limit(20);

	if (error) {
		console.error("Fallback signal retrieval failed:", error);
		return [];
	}

	return data ?? [];
}
