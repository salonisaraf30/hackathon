export interface NemotronResponse {
	executive_summary: string;
	insights: Array<{
		competitor: string;
		signal_type: string;
		what_happened: string;
		why_it_matters: string;
		recommended_action: string;
		urgency: "high" | "medium" | "low";
	}>;
	strategic_outlook: string;
}

type Urgency = NemotronResponse["insights"][number]["urgency"];

const FALLBACK_RESPONSE: NemotronResponse = {
	executive_summary: "Unable to generate summary. Please try again.",
	insights: [],
	strategic_outlook: "",
};

function extractFirstJsonObject(text: string): string {
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fenced?.[1]) {
		return fenced[1].trim();
	}

	const firstBrace = text.indexOf("{");
	if (firstBrace < 0) {
		return text.trim();
	}

	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let index = firstBrace; index < text.length; index += 1) {
		const char = text[index];

		if (inString) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (char === "\\") {
				escaped = true;
				continue;
			}
			if (char === '"') {
				inString = false;
			}
			continue;
		}

		if (char === '"') {
			inString = true;
			continue;
		}

		if (char === "{") {
			depth += 1;
		} else if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				return text.slice(firstBrace, index + 1).trim();
			}
		}
	}

	return text.slice(firstBrace).trim();
}

function sanitizeNemotronResponse(value: unknown): NemotronResponse {
	if (!value || typeof value !== "object") {
		return FALLBACK_RESPONSE;
	}

	const obj = value as Record<string, unknown>;
	const executiveSummary =
		typeof obj.executive_summary === "string"
			? obj.executive_summary
			: FALLBACK_RESPONSE.executive_summary;
	const strategicOutlook =
		typeof obj.strategic_outlook === "string" ? obj.strategic_outlook : "";

	const insights = Array.isArray(obj.insights)
		? obj.insights
				.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
				.map((item) => {
					const urgency: Urgency =
						item.urgency === "high" || item.urgency === "medium" || item.urgency === "low"
							? item.urgency
							: "low";

					return {
						competitor: typeof item.competitor === "string" ? item.competitor : "",
						signal_type: typeof item.signal_type === "string" ? item.signal_type : "",
						what_happened: typeof item.what_happened === "string" ? item.what_happened : "",
						why_it_matters: typeof item.why_it_matters === "string" ? item.why_it_matters : "",
						recommended_action:
							typeof item.recommended_action === "string" ? item.recommended_action : "",
						urgency,
					};
				})
				.filter((item) => item.competitor && item.what_happened)
		: [];

	return {
		executive_summary: executiveSummary,
		insights,
		strategic_outlook: strategicOutlook,
	};
}

export async function callNemotron(prompt: string): Promise<NemotronResponse> {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) {
		console.error("OPENROUTER_API_KEY is missing.");
		return FALLBACK_RESPONSE;
	}

	try {
		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "nvidia/llama-3.1-nemotron-70b-instruct",
				messages: [{ role: "user", content: prompt }],
				temperature: 0.3,
				response_format: { type: "json_object" },
			}),
		});

		if (!response.ok) {
			console.error("Nemotron request failed with status", response.status);
			return FALLBACK_RESPONSE;
		}

		const data = (await response.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		const text = data.choices?.[0]?.message?.content ?? "";
		const candidate = extractFirstJsonObject(text);
		const parsed = JSON.parse(candidate) as unknown;
		return sanitizeNemotronResponse(parsed);
	} catch (error) {
		console.error("Failed to parse Nemotron response:", error);
		return FALLBACK_RESPONSE;
	}
}
