// lib/intelligence/agents/competitive-strategist.ts

import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { ClassifiedSignal } from './signal-classifier';

export interface UserProduct {
  name: string;
  positioning: string;
  target_market: string;
  key_features: string[];
  description?: string;
}

export interface StrategicInsight {
  signal_id: string;
  competitor_name: string;
  what_happened: string;
  strategic_implication: string;      // What this means for the market
  impact_on_user: string;             // What this means for YOUR product specifically
  recommended_action: string;         // What to do about it
  urgency: 'critical' | 'high' | 'medium' | 'low';
  opportunity_or_threat: 'opportunity' | 'threat' | 'neutral';
  time_horizon: 'immediate' | 'short_term' | 'long_term'; // When to act
}

export async function generateStrategicInsights(
  classifiedSignals: ClassifiedSignal[],
  userProduct: UserProduct
): Promise<StrategicInsight[]> {

  // Sort by strategic weight so the most important signals get focus
  const sortedSignals = [...classifiedSignals].sort(
    (a, b) => b.classification.strategic_weight - a.classification.strategic_weight
  );

  const response = await callNemotron({
    agent_name: 'competitive-strategist',
    temperature: 0.4,
    max_tokens: 3000,
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: `You are a senior competitive strategy analyst advising a startup founder. Your analysis must be SPECIFIC to the user's product — never give generic advice.

ANALYSIS FRAMEWORK:
1. For each signal, determine the competitor's likely INTENT (what are they trying to achieve?)
2. Map the impact to the user's specific positioning, target market, and features
3. Identify whether this creates an opportunity (gap to exploit) or threat (position to defend)
4. Recommend concrete, actionable next steps with clear time horizons

BAD EXAMPLE (too generic): "Monitor this competitor closely and consider your pricing strategy."
GOOD EXAMPLE (specific): "Competitor X's new free tier targets solo developers — your core segment. Within 2 weeks, create a comparison landing page highlighting your API reliability (99.9% uptime vs their undisclosed SLA) to defend inbound leads."`
      },
      {
        role: 'user',
        content: `YOUR PRODUCT CONTEXT:
Name: ${userProduct.name}
Positioning: ${userProduct.positioning}
Target Market: ${userProduct.target_market}
Key Features: ${userProduct.key_features.join(', ')}
${userProduct.description ? `Description: ${userProduct.description}` : ''}

CLASSIFIED COMPETITIVE SIGNALS (ordered by strategic importance):
${sortedSignals.map((s, i) => `
[Signal ${i}] ID: ${s.id}
Competitor: ${s.competitor_name}
Category: ${s.classification.category} (confidence: ${s.classification.confidence})
Reasoning: ${s.classification.reasoning}
Strategic Weight: ${s.classification.strategic_weight}/10
Velocity: ${s.classification.velocity}
Title: ${s.title}
Summary: ${s.summary}
Related Signals: ${s.classification.related_signal_ids.length > 0 ? s.classification.related_signal_ids.join(', ') : 'none'}
`).join('\n---\n')}

Generate strategic insights for each significant signal (strategic_weight >= 4). Return JSON:
{
  "insights": [
    {
      "signal_id": "...",
      "competitor_name": "...",
      "what_happened": "Brief factual summary",
      "strategic_implication": "What this means for the market",
      "impact_on_user": "Specific impact on ${userProduct.name} given your positioning",
      "recommended_action": "Concrete next step with specifics",
      "urgency": "critical|high|medium|low",
      "opportunity_or_threat": "opportunity|threat|neutral",
      "time_horizon": "immediate|short_term|long_term"
    }
  ]
}`
      }
    ]
  });

  const parsed = parseNemotronJSON<{ insights: StrategicInsight[] }>(response.content);
  return parsed.insights;
}

