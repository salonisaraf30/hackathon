// lib/intelligence/agents/scenario-predictor.ts

import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { ClassifiedSignal } from './signal-classifier';
import { UserProduct } from './competitive-strategist';

export interface PredictedScenario {
  competitor_name: string;
  prediction: string;             // What they'll likely do next
  confidence: number;             // 0-1
  evidence: string[];             // Which signals support this prediction
  timeframe: string;              // "Within 2 weeks", "Next quarter", etc.
  impact_if_true: string;         // What it means for the user
  preemptive_action: string;      // What to do NOW before it happens
  counter_scenario: string;       // The alternative — what if the opposite happens?
}

export interface ScenarioPrediction {
  market_direction: string;       // Overall market trend synthesis
  scenarios: PredictedScenario[];
  wildcards: string[];            // Low-probability, high-impact events to watch
}

export async function predictScenarios(
  classifiedSignals: ClassifiedSignal[],
  userProduct: UserProduct
): Promise<ScenarioPrediction> {

  // Group signals by competitor for pattern detection
  const signalsByCompetitor: Record<string, ClassifiedSignal[]> = {};
  for (const signal of classifiedSignals) {
    if (!signalsByCompetitor[signal.competitor_name]) {
      signalsByCompetitor[signal.competitor_name] = [];
    }
    signalsByCompetitor[signal.competitor_name].push(signal);
  }

  const response = await callNemotron({
    agent_name: 'scenario-predictor',
    temperature: 0.5, // Balance between creativity and grounding
    max_tokens: 3000,
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: `You are a competitive intelligence forecaster. Your job is to look at patterns in competitive signals and predict what competitors will do NEXT.

PREDICTION METHODOLOGY:
1. PATTERN RECOGNITION: What sequence of moves is this competitor making? (e.g., hire → build → launch)
2. INDUSTRY PLAYBOOK: What do companies typically do after these types of moves? (e.g., after raising a Series A, companies usually expand their team and launch 2-3 new features within 6 months)
3. MARKET TIMING: Given the current competitive landscape, what's the optimal next move?
4. SIGNAL CLUSTERING: Multiple signals from one competitor often tell a unified story

ALWAYS PROVIDE:
- A specific prediction (not vague "they might do something")
- A clear timeframe
- The counter-scenario (what if the opposite happens?)
- A preemptive action the user can take NOW

You should also identify "wildcards" — low-probability but high-impact events that would change the game entirely.`
      },
      {
        role: 'user',
        content: `YOUR PRODUCT: ${userProduct.name} — ${userProduct.positioning}
Target Market: ${userProduct.target_market}

COMPETITIVE SIGNALS GROUPED BY COMPETITOR:
${Object.entries(signalsByCompetitor).map(([competitor, signals]) => `
## ${competitor}
${signals.map(s => `- [${s.classification.category}] ${s.title} (weight: ${s.classification.strategic_weight}/10, velocity: ${s.classification.velocity})
  Reasoning: ${s.classification.reasoning}`).join('\n')}
`).join('\n')}

Based on these signal patterns, predict what each competitor will likely do next. Also identify the overall market direction and any wildcards.

Return JSON:
{
  "market_direction": "One paragraph synthesizing the overall competitive landscape trend",
  "scenarios": [
    {
      "competitor_name": "...",
      "prediction": "Specific prediction of their next move",
      "confidence": 0.0-1.0,
      "evidence": ["Signal that supports this", "Another signal"],
      "timeframe": "e.g., Within 4 weeks",
      "impact_if_true": "What this means for ${userProduct.name}",
      "preemptive_action": "What to do NOW",
      "counter_scenario": "What if the opposite happens instead"
    }
  ],
  "wildcards": ["Low-prob high-impact event 1", "Event 2"]
}`
      }
    ]
  });

  return parseNemotronJSON<ScenarioPrediction>(response.content);
}
