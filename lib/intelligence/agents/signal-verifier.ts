import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { ClassifiedSignal } from './signal-classifier';
import { StrategicInsight } from './competitive-strategist';

export interface VerificationResult {
  signal_id: string;
  verified: boolean;
  evidence_strength: number; // 0.0 - 1.0
  evidence_note: string;
  missing_evidence: string[];
}

export async function verifyInsights(
  insights: StrategicInsight[],
  classifiedSignals: ClassifiedSignal[]
): Promise<VerificationResult[]> {
  if (insights.length === 0) return [];

  const response = await callNemotron({
    agent_name: 'signal-verifier',
    temperature: 0.1,
    max_tokens: 2200,
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: `You are an evidence-verification agent. Your job is to verify whether each strategic insight is grounded in the provided classified signals.

RULES:
- Be strict: mark verified=false when key claims have weak support.
- evidence_strength must be 0.0 to 1.0.
- If an insight is weakly grounded, explain exactly what evidence is missing.
- Return one verification item per insight signal_id.`,
      },
      {
        role: 'user',
        content: `CLASSIFIED SIGNALS:
${classifiedSignals.map((s) => `
Signal: ${s.id}
Competitor: ${s.competitor_name}
Type: ${s.signal_type}
Title: ${s.title}
Summary: ${s.summary}
Reasoning: ${s.classification.reasoning}
Weight: ${s.classification.strategic_weight}/10`).join('\n---\n')}

INSIGHTS TO VERIFY:
${insights.map((ins) => `
Signal: ${ins.signal_id}
Competitor: ${ins.competitor_name}
What happened: ${ins.what_happened}
Strategic implication: ${ins.strategic_implication}
Impact on user: ${ins.impact_on_user}
Recommended action: ${ins.recommended_action}`).join('\n---\n')}

Return JSON:
{
  "verifications": [
    {
      "signal_id": "...",
      "verified": true,
      "evidence_strength": 0.0,
      "evidence_note": "...",
      "missing_evidence": ["..."]
    }
  ]
}`,
      },
    ],
  });

  const parsed = parseNemotronJSON<{ verifications: VerificationResult[] }>(response.content);
  return parsed.verifications ?? [];
}
