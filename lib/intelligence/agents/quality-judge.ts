// lib/intelligence/agents/quality-judge.ts

import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { StrategicInsight } from './competitive-strategist';
import { RedTeamChallenge } from './red-team';
import { ScenarioPrediction } from './scenario-predictor';
import { UserProduct } from './competitive-strategist';

export interface QualityScore {
  signal_id: string;
  specificity_score: number;      // 1-10: Is this specific to the user's product?
  actionability_score: number;     // 1-10: Can the user actually DO something with this?
  evidence_score: number;          // 1-10: Is this supported by the signals?
  overall_score: number;           // 1-10: Weighted average
  include_in_digest: boolean;      // Final verdict: show to user or filter out
  revision_note: string;           // If partially included, what should be tweaked
}

export interface QualityReport {
  scores: QualityScore[];
  executive_summary_draft: string; // Judge writes the final exec summary
  digest_quality_grade: 'A' | 'B' | 'C' | 'D'; // Overall digest quality
  improvement_notes: string;       // Meta-feedback for prompt tuning
}

export async function judgeQuality(
  insights: StrategicInsight[],
  challenges: RedTeamChallenge[],
  scenarios: ScenarioPrediction,
  userProduct: UserProduct
): Promise<QualityReport> {

  const response = await callNemotron({
    agent_name: 'quality-judge',
    temperature: 0.2, // Very low temp — we want consistent judgment
    max_tokens: 3000,
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: `You are a quality assurance analyst for a competitive intelligence product. You evaluate AI-generated insights and decide what's good enough to show a busy founder and what should be filtered out.

SCORING CRITERIA:

SPECIFICITY (1-10):
- 1-3: Generic advice that could apply to any company ("monitor competitors closely")
- 4-6: Mentions the user's product but advice is still broad
- 7-10: References specific features, positioning, or market segments of the user's product

ACTIONABILITY (1-10):
- 1-3: Vague direction ("consider your pricing")
- 4-6: Clear direction but missing specifics ("update your pricing page")
- 7-10: Concrete step with details ("Create a comparison table on /pricing showing your free tier includes X, Y, Z which Competitor's new free tier lacks")

EVIDENCE (1-10):
- 1-3: Speculation with no signal backing
- 4-6: Loosely supported by signals
- 7-10: Directly supported by specific, verifiable signals

INCLUSION THRESHOLD: overall_score >= 6

Also consider the Red Team's challenges. If an insight was "overturned" by the Red Team, it should be excluded or heavily revised. If "partially_challenged", incorporate the nuance.

Finally, write a crisp executive summary (2-3 sentences) that captures the SINGLE most important takeaway from all insights.`
      },
      {
        role: 'user',
        content: `USER'S PRODUCT: ${userProduct.name} — ${userProduct.positioning}

STRATEGIST'S INSIGHTS:
${insights.map((ins, i) => `
[${i}] Signal: ${ins.signal_id} | Competitor: ${ins.competitor_name}
What: ${ins.what_happened}
Impact: ${ins.impact_on_user}
Action: ${ins.recommended_action}
Urgency: ${ins.urgency}
`).join('\n')}

RED TEAM CHALLENGES:
${challenges.map((ch, i) => `
[${i}] Signal: ${ch.signal_id} | Verdict: ${ch.verdict}
Challenge: ${ch.challenge}
Alt interpretation: ${ch.alternative_interpretation}
Blind spots: ${ch.blind_spots.join('; ')}
`).join('\n')}

SCENARIO PREDICTIONS:
Market Direction: ${scenarios.market_direction}
Predictions: ${scenarios.scenarios.map(s => `${s.competitor_name}: ${s.prediction} (${s.confidence} confidence)`).join('; ')}
Wildcards: ${scenarios.wildcards.join('; ')}

Score each insight, write the executive summary, and grade the overall digest quality.

Return JSON:
{
  "scores": [
    {
      "signal_id": "...",
      "specificity_score": 1-10,
      "actionability_score": 1-10,
      "evidence_score": 1-10,
      "overall_score": 1-10,
      "include_in_digest": true/false,
      "revision_note": "..."
    }
  ],
  "executive_summary_draft": "2-3 sentence summary of the most important takeaway",
  "digest_quality_grade": "A|B|C|D",
  "improvement_notes": "Meta-feedback on what could be better"
}`
      }
    ]
  });

  return parseNemotronJSON<QualityReport>(response.content);
}

