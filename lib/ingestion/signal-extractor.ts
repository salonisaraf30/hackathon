import Anthropic from "@anthropic-ai/sdk";

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicApiKey
	? new Anthropic({ apiKey: anthropicApiKey })
	: null;

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
	if (!anthropic) {
		console.error("ANTHROPIC_API_KEY is missing; skipping signal extraction.");
		return [];
	}

	try {
		const response = await anthropic.messages.create({
			model: "claude-sonnet-4-20250514",
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
- importance_score: 1-10 (10 = major strategic move, 1 = trivial update)

Ignore trivial changes like typo fixes, minor CSS changes, or footer updates.

Return ONLY a JSON array. If no meaningful changes, return [].
Example: [{"signal_type": "pricing_change", "title": "...", "summary": "...", "importance_score": 7}]`,
				},
			],
		});

		const textBlock = response.content.find((item) => item.type === "text");
		const text = textBlock?.type === "text" ? textBlock.text : "";
		const cleaned = text.replace(/```json|```/g, "").trim();
		const parsed = JSON.parse(cleaned);
		return sanitizeSignals(parsed);
	} catch (error) {
		console.error("Failed to extract signals from Claude:", error);
		return [];
	}
}
