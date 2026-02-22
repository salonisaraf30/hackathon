import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { StrategicInsight } from './competitive-strategist';

export interface InsightContradiction {
  signal_id: string;
  conflicts_with_signal_id: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  recommended_resolution: string;
}

export async function detectInsightContradictions(
  insights: StrategicInsight[]
): Promise<InsightContradiction[]> {
  if (insights.length < 2) return [];

  const response = await callNemotron({
    agent_name: 'contradiction-detector',
    temperature: 0.15,
    max_tokens: 1800,
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: `You are a contradiction detector. Find direct or meaningful conflicts between insights.

Look for contradictions in:
- market interpretation
- urgency
- recommended actions
- assumptions about customer impact

Only report meaningful conflicts; if none exist return an empty list.`,
      },
      {
        role: 'user',
        content: `INSIGHTS:
${insights.map((ins) => `
Signal: ${ins.signal_id}
Competitor: ${ins.competitor_name}
What happened: ${ins.what_happened}
Strategic implication: ${ins.strategic_implication}
Impact: ${ins.impact_on_user}
Action: ${ins.recommended_action}
Urgency: ${ins.urgency}`).join('\n---\n')}

Return JSON:
{
  "contradictions": [
    {
      "signal_id": "...",
      "conflicts_with_signal_id": "...",
      "severity": "low|medium|high",
      "explanation": "...",
      "recommended_resolution": "..."
    }
  ]
}`,
      },
    ],
  });

  const parsed = parseNemotronJSON<{ contradictions: InsightContradiction[] }>(response.content);
  return parsed.contradictions ?? [];
}
