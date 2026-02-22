// lib/intelligence/agents/red-team.ts

import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { StrategicInsight } from './competitive-strategist';
import { UserProduct } from './competitive-strategist';

export interface RedTeamChallenge {
  signal_id: string;
  original_assessment: string;       // What the strategist said
  challenge: string;                 // The counter-argument
  alternative_interpretation: string; // A different way to read the signal
  blind_spots: string[];             // What the strategist might have missed
  revised_urgency: 'critical' | 'high' | 'medium' | 'low' | 'unchanged';
  confidence_adjustment: number;     // -0.3 to +0.3, how much to adjust confidence
  verdict: 'upheld' | 'partially_challenged' | 'overturned';
}

export async function redTeamInsights(
  insights: StrategicInsight[],
  userProduct: UserProduct
): Promise<RedTeamChallenge[]> {

  const response = await callNemotron({
    agent_name: 'red-team',
    temperature: 0.6, // Higher temp for more creative challenges
    max_tokens: 3000,
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: `You are a devil's advocate analyst on a competitive intelligence team. Your SOLE job is to challenge the primary strategist's conclusions. You are not trying to be contrarian for its own sake — you are trying to make the final analysis more robust.

YOUR METHODS:
1. ALTERNATIVE INTERPRETATIONS: Could this signal mean something entirely different? (e.g., "They're hiring ML engineers" might mean AI product, OR it could mean improving internal tooling)
2. OVER-REACTION CHECK: Is the urgency too high? Are we treating noise as signal?
3. BLIND SPOTS: What did the strategist miss? Second-order effects? Market context?
4. UNDER-REACTION CHECK: Is the urgency too LOW? Are we dismissing something important?
5. CONFIRMATION BIAS: Is the strategist seeing what they want to see based on the user's positioning?

VERDICT OPTIONS:
- upheld: The strategist's analysis is solid, challenge didn't find major issues
- partially_challenged: Valid points but some aspects need revision
- overturned: The strategist's conclusion is likely wrong or significantly misleading`
      },
      {
        role: 'user',
        content: `CONTEXT — The user's product is "${userProduct.name}" (${userProduct.positioning}).

THE STRATEGIST PRODUCED THESE INSIGHTS. Challenge each one:

${insights.map((insight, i) => `
[Insight ${i}] Signal: ${insight.signal_id}
Competitor: ${insight.competitor_name}
What happened: ${insight.what_happened}
Strategist's implication: ${insight.strategic_implication}
Strategist's impact assessment: ${insight.impact_on_user}
Strategist's action: ${insight.recommended_action}
Strategist's urgency: ${insight.urgency}
Strategist's framing: ${insight.opportunity_or_threat}
`).join('\n---\n')}

Return JSON:
{
  "challenges": [
    {
      "signal_id": "...",
      "original_assessment": "Brief summary of what the strategist concluded",
      "challenge": "Your primary counter-argument",
      "alternative_interpretation": "A different way to read this signal",
      "blind_spots": ["Thing the strategist missed 1", "Thing 2"],
      "revised_urgency": "critical|high|medium|low|unchanged",
      "confidence_adjustment": -0.3 to 0.3,
      "verdict": "upheld|partially_challenged|overturned"
    }
  ]
}`
      }
    ]
  });

  const parsed = parseNemotronJSON<{ challenges: RedTeamChallenge[] }>(response.content);
  return parsed.challenges;
}
