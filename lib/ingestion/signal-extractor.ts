import Anthropic from "@anthropic-ai/sdk";

// Lazy-loaded Anthropic client - created on first use so env vars are loaded
let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic | null {
	if (_anthropic) return _anthropic;
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) return null;
	_anthropic = new Anthropic({ apiKey });
	return _anthropic;
}

const ALLOWED_SIGNAL_TYPES = [
	"product_launch",
	"pricing_change",
	"hiring",
	"funding",
	"feature_update",
	"content_published",
	"partnership",
	"social_post",
] as const;

type AllowedSignalType = (typeof ALLOWED_SIGNAL_TYPES)[number];

export interface ExtractedSignal {
	signal_type: AllowedSignalType;
	title: string;
	summary: string;
	importance_score: number;
}

function sanitizeSignals(value: unknown): ExtractedSignal[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
		.map((item) => {
			const signalType =
				typeof item.signal_type === "string" &&
				(ALLOWED_SIGNAL_TYPES as readonly string[]).includes(item.signal_type)
					? (item.signal_type as AllowedSignalType)
					: "content_published";

			const title = typeof item.title === "string" ? item.title.trim() : "";
			const summary = typeof item.summary === "string" ? item.summary.trim() : "";

			let importance =
				typeof item.importance_score === "number"
					? item.importance_score
					: Number(item.importance_score ?? 0);
			if (!Number.isFinite(importance)) {
				importance = 1;
			}

			return {
				signal_type: signalType,
				title,
				summary,
				importance_score: Math.max(1, Math.min(10, Math.round(importance))),
			};
		})
		.filter((item) => item.title.length > 0 && item.summary.length > 0);
}

export async function extractSignalsFromDiff(
	competitorName: string,
	oldContent: string,
	newContent: string,
): Promise<ExtractedSignal[]> {
	const anthropic = getAnthropicClient();
	if (!anthropic) {
		console.error("ANTHROPIC_API_KEY is missing; skipping signal extraction.");
		return [];
	}
// check if this prompt needs to be changed
	try {
		const response = await anthropic.messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 1024,
			temperature: 0.2,
			messages: [
				{
					role: "user",
					content: `You are a competitive intelligence analyst. A competitor's website has changed.


COMPETITOR: ${competitorName}

PREVIOUS CONTENT (summary):
${oldContent.substring(0, 2000)}

NEW CONTENT (summary):
${newContent.substring(0, 2000)}


Analyze the changes and extract competitive signals. For each meaningful change, return:
- signal_type: one of [product_launch, pricing_change, hiring, funding, feature_update, content_published, partnership, social_post]
- title: a short headline (under 15 words)
- summary: 2-3 sentences explaining the change and its significance
- importance_score: 1-10
  - 9-10: Funding, acquisition, major pivot, exec departure, IPO
  - 7-8: New product launch, major pricing change, large hiring wave
  - 5-6: Feature update, partnership announcement, new office
  - 3-4: Blog post, minor hire, small feature
  - 1-2: Trivial update, routine content

Ignore trivial changes like typo fixes, minor CSS changes, or footer updates.

Return ONLY a JSON array. If no meaningful changes, return [].
Example: [{"signal_type": "pricing_change", "title": "...", "summary": "...", "importance_score": 7}]`,
				},
			],
		});

		const textBlock = response.content.find((item) => item.type === "text");
		const text = textBlock?.type === "text" ? textBlock.text : "";
		// Strip markdown fences and try to extract the JSON array
		let cleaned = text.replace(/```json\s*|```/g, "").trim();

		// If the response contains extra text around the JSON, extract the array
		const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
		if (arrayMatch) {
			cleaned = arrayMatch[0];
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(cleaned);
		} catch {
			console.warn("Signal extractor: Claude returned non-JSON, returning []");
			return [];
		}
		return sanitizeSignals(parsed);
	} catch (error) {
		console.error("Failed to extract signals from Claude:", error);
		return [];
	}
}

export type SourceType = "news" | "jobs" | "github" | "producthunt" | "reviews" | "techcrunch"

const SOURCE_CONTEXT: Record<SourceType, string> = {
	news: "These are news articles about the competitor. Look for funding, partnerships, executive changes, expansions, or major product news.",
	jobs: "These are job postings from the competitor. Look for signs of expansion, new product areas, technology stack changes, or strategic initiatives.",
	github:
		"These are GitHub activities from the competitor. Look for new repositories, major releases, technology changes, or open source initiatives.",
	producthunt:
		"These are Product Hunt launches from the competitor. Look for new products, major updates, pivots, or market positioning.",
	reviews:
		"These are customer reviews about the competitor. Look for common complaints, praised features, pricing feedback, or competitive comparisons.",
	// might need to change this based on what the TechCrunch feed actually returns - if it's just article titles, the context would be more like 'These are TechCrunch article titles about the competitor. Look for signals of funding announcements, product launches, executive moves, partnerships, or market expansions.'
	techcrunch: "These are TechCrunch articles about the competitor. Look for funding announcements, product launches, executive moves, partnerships, or market expansions.",
};

export async function extractSignalsFromText(
	text: string,
	competitorName: string,
	source: 'news' | 'jobs' | 'github' | 'producthunt' | 'reviews' | 'techcrunch',
): Promise<ExtractedSignal[]> {
	const anthropic = getAnthropicClient();
	if (!anthropic) {
		console.error("ANTHROPIC_API_KEY is missing; skipping signal extraction.");
		return [];
	}

	const sourceContext = SOURCE_CONTEXT[source];

	try {
		const response = await anthropic.messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 1024,
			temperature: 0.2,
			messages: [
				{
					role: "user",
					content: `You are a competitive intelligence analyst.

${sourceContext}

COMPETITOR: ${competitorName}

CONTENT:
${text.substring(0, 4000)}

Analyze this content and extract competitive signals. For each meaningful signal, return:
- signal_type: one of [product_launch, pricing_change, hiring, funding, feature_update, content_published, partnership, social_post]
- title: a short headline (under 15 words)
- summary: 2-3 sentences explaining the signal and its significance
- importance_score: 1-10 (10 = major strategic move, 1 = trivial update)

Ignore trivial content like retweets, generic marketing, or routine updates.

Return ONLY a JSON array. If no meaningful signals, return [].
Example: [{"signal_type": "product_launch", "title": "...", "summary": "...", "importance_score": 7}]`,
				},
			],
		});

		const textBlock = response.content.find((item) => item.type === "text");
		const responseText = textBlock?.type === "text" ? textBlock.text : "";
		// Strip markdown fences and try to extract the JSON array
		let cleaned = responseText.replace(/```json\s*|```/g, "").trim();

		// If the response contains extra text around the JSON, extract the array
		const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
		if (arrayMatch) {
			cleaned = arrayMatch[0];
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(cleaned);
		} catch {
			console.warn("Signal extractor: Claude returned non-JSON, returning []");
			return [];
		}
		return sanitizeSignals(parsed);
	} catch (error) {
		console.error("Failed to extract signals from Claude:", error);
		return [];
	}
}

