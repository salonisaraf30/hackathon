// lib/intelligence/agents/signal-classifier.ts

import { callNemotron, parseNemotronJSON } from '../nemotron-client';

// Input: raw signals from Supabase
export interface RawSignal {
  id: string;
  competitor_id: string;
  competitor_name: string;
  source: string;
  signal_type: string;
  title: string;
  summary: string;
  raw_content?: string;
  detected_at: string;
}

// Output: enriched, classified signals
export interface ClassifiedSignal extends RawSignal {
  classification: {
    category: 'offensive_move' | 'defensive_move' | 'market_expansion' | 'internal_shift' | 'ecosystem_play';
    confidence: number;        // 0-1
    reasoning: string;         // WHY it was classified this way
    strategic_weight: number;  // 1-10, how much this matters
    velocity: 'accelerating' | 'steady' | 'decelerating'; // Is this part of a trend?
    related_signal_ids: string[]; // Links to other signals that form a pattern
  };
}

export async function classifySignals(signals: RawSignal[]): Promise<ClassifiedSignal[]> {
  if (signals.length === 0) return [];

  const response = await callNemotron({
    agent_name: 'signal-classifier',
    temperature: 0.2, // Low temp for consistent classification
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: `You are a competitive intelligence signal classifier. Your job is to analyze raw competitive signals and produce structured classifications with explicit reasoning.

CLASSIFICATION CATEGORIES:
- offensive_move: Competitor is actively trying to gain market share (new features, aggressive pricing, marketing push)
- defensive_move: Competitor is reacting to threats (matching features, retention offers, pivoting away from weakness)  
- market_expansion: Competitor is entering new segments, geographies, or use cases
- internal_shift: Hiring changes, leadership moves, restructuring that signal future strategy
- ecosystem_play: Partnerships, integrations, platform moves that change competitive dynamics

IMPORTANT RULES:
1. Provide explicit reasoning for EVERY classification — what evidence supports it
2. Identify connections between signals — if Competitor A is hiring ML engineers AND launched an AI feature, those are related
3. Assign strategic_weight based on potential impact, not just newsworthiness
4. Assess velocity — is this an isolated event or part of an accelerating trend?`
      },
      {
        role: 'user',
        content: `Classify these competitive signals. For each signal, determine its strategic category, explain your reasoning, assess its weight, and identify any connections between signals.

SIGNALS:
${signals.map((s, i) => `
[Signal ${i}] ID: ${s.id}
Competitor: ${s.competitor_name}
Source: ${s.source}
Type: ${s.signal_type}
Title: ${s.title}
Summary: ${s.summary}
Detected: ${s.detected_at}
`).join('\n---\n')}

Return a JSON array of classified signals:
{
  "classified_signals": [
    {
      "signal_id": "...",
      "category": "offensive_move|defensive_move|market_expansion|internal_shift|ecosystem_play",
      "confidence": 0.0-1.0,
      "reasoning": "Detailed explanation of WHY this classification...",
      "strategic_weight": 1-10,
      "velocity": "accelerating|steady|decelerating",
      "related_signal_ids": ["other_signal_id", ...]
    }
  ]
}`
      }
    ]
  });

  const parsed = parseNemotronJSON<{
    classified_signals: Array<{
      signal_id: string;
      category: string;
      confidence: number;
      reasoning: string;
      strategic_weight: number;
      velocity: string;
      related_signal_ids: string[];
    }>;
  }>(response.content);

  // Merge classifications back into signal objects
  return signals.map(signal => {
    const classifiedSignals = parsed.classified_signals ?? [];
    const classification = classifiedSignals.find(
      (c: { signal_id: string }) => c.signal_id === signal.id,
    );
    return {
      ...signal,
      classification: classification ? {
        category: classification.category as ClassifiedSignal['classification']['category'],
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        strategic_weight: classification.strategic_weight,
        velocity: classification.velocity as ClassifiedSignal['classification']['velocity'],
        related_signal_ids: classification.related_signal_ids,
      } : {
        category: 'internal_shift' as const,
        confidence: 0.5,
        reasoning: 'Default classification — agent did not return result for this signal',
        strategic_weight: 5,
        velocity: 'steady' as const,
        related_signal_ids: [],
      }
    };
  });
}
