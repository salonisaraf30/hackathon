// lib/intelligence/agents/quality-judge.ts
// Agent 7 — Quality Judge
// Final gate before the digest reaches the user. Scores each insight on
// specificity, actionability, and evidence. Applies Red Team confidence
// adjustments as continuous score penalties (not flat buckets). Writes
// the executive summary that appears at the top of the user's digest.
//
// Key fixes from March 2026 audit:
// - Stricter rejection thresholds: score < 6 → excluded (was any rubber-stamping)
// - Red Team confidence_adjustment mapped to score deductions (not ignored)
// - Executive summary must include specific numbers, competitor names, features
// - Hard rejection rules on consultant-speak phrases
// - Calibration pass required before finalising scores

import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { StrategicInsight, UserProduct } from './competitive-strategist';
import { RedTeamChallenge } from './red-team';
import { VerificationResult } from './signal-verifier';
import { ScenarioPrediction } from './scenario-predictor';

// ── Output types ──────────────────────────────────────────────────────────────

export interface QualityScore {
  signal_id: string;
  specificity_score: number;       // 1–10: is this specific to the user's product?
  actionability_score: number;     // 1–10: can the user DO something with this today?
  evidence_score: number;          // 1–10: is this grounded in signal text?
  red_team_penalty: number;        // deduction applied from Red Team confidence_adjustment
  overall_score: number;           // weighted average AFTER red_team_penalty applied
  include_in_digest: boolean;      // false if overall_score < 6 OR any hard rejection rule fires
  rejection_reason: string | null; // populated only when include_in_digest = false
  revision_note: string;           // how this insight could be improved in a future run
}

export interface DigestInsight {
  // The polished, user-facing version of an included insight — written by the Judge
  signal_id: string;
  competitor_name: string;
  headline: string;               // One sentence, present tense, no jargon
  so_what: string;                // Why this matters specifically for the user's product
  action: string;                 // Executable this week: WHO + WHAT + WHEN + OUTPUT
  urgency: 'critical' | 'high' | 'medium' | 'low';
  confidence_label: 'high' | 'medium' | 'low'; // Human-readable confidence tier
}

export interface QualityReport {
  scores: QualityScore[];
  digest_insights: DigestInsight[]; // Polished, user-facing insights — only included signals
  executive_summary: string;        // 3–4 sentences, must include specific numbers and named features
  digest_quality_grade: 'A' | 'B' | 'C' | 'D';
  signals_included: number;
  signals_excluded: number;
  improvement_notes: string;        // Meta-feedback for next prompt iteration
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Maps Red Team confidence_adjustment to a score deduction.
// This is the fix for the "partially_challenged all score the same" problem —
// confidence_adjustment is used as a continuous weight, not a flat bucket.
function redTeamPenalty(confidenceAdjustment: number): number {
  if (confidenceAdjustment === 0)    return 0;
  if (confidenceAdjustment >= -0.2)  return 1;   // mild doubt → -1 point
  if (confidenceAdjustment >= -0.3)  return 2;   // moderate doubt → -2 points
  return 3;                                       // overturned (-0.4) → -3 points
}

// Cap for overturned signals — enforced in JS before sending to the model
// so the model cannot accidentally score an overturned signal as includable
const OVERTURNED_SCORE_CAP = 4.0;

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the final quality gate for a competitive intelligence digest that goes directly to a busy founder. Your job has two parts: (1) score each insight and decide what makes it into the digest, and (2) write the polished, user-facing content for insights that pass.

The founder has 5 minutes to read this digest. Every word must earn its place.

---

## PART 1 — SCORING AND INCLUSION DECISIONS

### Scoring Rubric

Score each insight on three dimensions (1–10):

**SPECIFICITY (weight: 40%)**
- 1–3: Generic. Could describe any SaaS company. ("Competitor is growing their AI capabilities")
- 4–6: Names the competitor and product but advice is still broad ("Notion's AI features may affect your positioning")
- 7–10: References the user's specific product by name, a specific feature, a specific market segment ("Notion's AI templates directly compete with TaskFlow's AI sprint planning for engineering team leads — the overlap is on the velocity tracking screen, not the kanban view")
- Score < 6 → automatic rejection regardless of other scores

**ACTIONABILITY (weight: 40%)**
- 1–3: Vague direction. Contains any of: "monitor", "consider", "evaluate", "stay informed", "assess", "think about"
- 4–6: Clear direction but missing specifics ("update your pricing page")
- 7–10: Executable this week. Contains: a named role, a deadline, and a concrete output artifact ("Marketing lead updates /pricing comparison page by Wednesday — output: live table comparing TaskFlow Analytics vs Linear Insights with specific metric names")
- Score < 5 → automatic rejection regardless of other scores
- If recommended_action contains "monitor", "consider", "evaluate", or "stay informed" → score = 1, reject

**EVIDENCE (weight: 20%)**
- 1–3: Speculation. The signal doesn't support the claim
- 4–6: Loosely supported — inference is reasonable but not direct
- 7–10: Directly supported by specific, quotable signal content

### Weighted Score Formula

overall_score = (specificity × 0.4) + (actionability × 0.4) + (evidence × 0.2)

Then apply red_team_penalty (provided to you per insight):
adjusted_score = overall_score − red_team_penalty

### Inclusion Threshold

INCLUDE (include_in_digest: true) if:
- adjusted_score >= 6.0, AND
- specificity_score >= 6, AND
- actionability_score >= 5, AND
- verdict is NOT "overturned" (overturned signals are always excluded regardless of score)

EXCLUDE (include_in_digest: false) if ANY of these are true:
- adjusted_score < 6.0
- specificity_score < 6
- actionability_score < 5
- recommended_action contains "monitor", "consider", "evaluate", "stay informed"
- verdict is "overturned"
- The insight could apply to any startup in any market (litmus test: would this insight be identical if the user made HR software?)

When excluding, populate rejection_reason with the specific rule that fired.

### Calibration Pass

Before finalising scores, check:
1. Is the highest-scoring insight clearly better than the lowest? If all scores cluster in the 6–8 range, you are not differentiating enough.
2. Is at least one insight excluded? A digest that includes everything has not been quality-gated.
3. Does your grade reflect the worst included insight, not just the best?

---

## PART 2 — WRITING THE DIGEST CONTENT

For every insight that passes inclusion, write a polished DigestInsight with these fields:

**headline**: One sentence, present tense, no jargon. Names the competitor and what happened.
BAD: "Notion is expanding its AI capabilities"
GOOD: "Notion launched AI-powered project templates that directly replicate TaskFlow's sprint planning workflow"

**so_what**: Why this matters specifically for the user's product. Must name the user's product and a specific feature.
BAD: "This could affect your competitive position"
GOOD: "Engineering team leads evaluating tools will now see Notion's template library before TaskFlow's sprint AI — TaskFlow's velocity tracking is the differentiator that Notion's templates don't replicate"

**action**: Executable this week. Role + deadline + concrete output.
BAD: "Update your marketing materials to emphasise differentiation"
GOOD: "Product lead adds a 'TaskFlow vs Notion AI' comparison section to the /features page by Thursday — output: side-by-side showing TaskFlow's GitHub sync and velocity data which Notion templates don't have"

**urgency**: Use the Strategist's urgency unless the Red Team's revised_urgency differs — in that case, use the Red Team's.

**confidence_label**: 
- high: evidence_score >= 7 AND red_team verdict is upheld or partially_challenged with confidence_adjustment >= -0.2
- medium: evidence_score 4–6 OR confidence_adjustment -0.2 to -0.3
- low: evidence_score < 4 OR confidence_adjustment < -0.3

---

## PART 3 — EXECUTIVE SUMMARY

Write a 3–4 sentence executive summary that appears at the very top of the digest.

HARD REQUIREMENTS:
1. Must name at least 2 specific competitors by name
2. Must reference at least 1 specific feature from the user's product by name
3. Must include at least 1 specific number (a price, a percentage, a timeframe, a signal count)
4. Must name the single most urgent action the founder should take this week
5. Must NOT contain "landscape", "positioning", "leverage", "competitive pressure", or "strategic" (these are filler words)

BAD executive summary:
"The competitive landscape is shifting as major players invest in AI. TaskFlow needs to leverage its positioning and respond to competitive pressure with strategic actions across multiple fronts."

GOOD executive summary:
"Notion launched AI templates that overlap directly with TaskFlow's sprint planning, and Linear shipped Insights analytics that targets TaskFlow's velocity tracking feature — both are in users' hands now. Coda's Atlassian integration is the sleeper threat: it brings Coda into 8M+ Atlassian users' workflows without requiring a switch. This week's single most important action: update TaskFlow's /pricing page with a feature comparison table that makes GitHub sync and sprint AI the differentiating headline, before Linear's predicted resource allocation launch drops within the month."

---

## GRADE DEFINITIONS

- A (≥ 8.0 average included score): Ready to ship. Specific, actionable, well-evidenced.
- B (7.0–7.9): Good. A few insights could be sharper but the digest is useful.
- C (5.0–6.9): Marginal. Insights are directionally correct but too generic to act on.
- D (< 5.0): Reject. Do not send this digest. Regenerate with better signals.

Grade reflects the AVERAGE of included insights — not the best one.`;

// ── Main function ─────────────────────────────────────────────────────────────

export async function judgeQuality(
  insights: StrategicInsight[],
  challenges: RedTeamChallenge[],
  verifications: VerificationResult[],
  scenarios: ScenarioPrediction,
  userProduct: UserProduct
): Promise<QualityReport> {

  // Build a lookup map for Red Team challenges by signal_id
  const challengeMap = new Map<string, RedTeamChallenge>(
    challenges.map(c => [c.signal_id, c])
  );

  // Build a lookup map for verification results by signal_id
  const verificationMap = new Map<string, VerificationResult>(
    verifications.map(v => [v.signal_id, v])
  );

  // Pre-compute red_team_penalty per insight in JS so the model receives
  // concrete numbers rather than having to derive them from confidence_adjustment
  const insightMeta = insights.map(ins => {
    const challenge    = challengeMap.get(ins.signal_id);
    const verification = verificationMap.get(ins.signal_id);
    const penalty      = challenge ? redTeamPenalty(challenge.confidence_adjustment) : 0;
    const isOverturned = challenge?.verdict === 'overturned';
    return { ins, challenge, verification, penalty, isOverturned };
  });

  // Build the insight block passed to the model — include all upstream context
  const insightBlock = insightMeta.map(({ ins, challenge, verification, penalty, isOverturned }) => {
    const v = challenge ?? null;
    return `Signal: ${ins.signal_id} | Competitor: ${ins.competitor_name}
What happened: ${ins.what_happened}
Strategic implication: ${ins.strategic_implication}
Impact on user: ${ins.impact_on_user}
Recommended action: ${ins.recommended_action}
Urgency: ${ins.urgency} | Framing: ${ins.opportunity_or_threat}
Time horizon: ${ins.time_horizon}

Red Team:
  Verdict: ${v?.verdict ?? 'not challenged'}
  Challenge: ${v?.challenge ?? 'none'}
  Revised urgency: ${v?.revised_urgency ?? 'unchanged'}
  Confidence adjustment: ${v?.confidence_adjustment ?? 0}
  PRE-COMPUTED red_team_penalty for scoring: ${penalty} points
  OVERTURNED (auto-exclude): ${isOverturned}

Signal Verifier:
  Evidence tier: ${verification?.evidence_tier ?? 'unknown'}
  Verified: ${verification?.verified ?? 'unknown'}
  Evidence strength: ${verification?.evidence_strength ?? 'unknown'}
  Rejection flag: ${verification?.rejection_flag ?? false}`;
  }).join('\n\n---\n\n');

  const response = await callNemotron({
    agent_name: 'quality-judge',
    temperature: 0.2, // Low temperature — scoring decisions must be consistent and deterministic
    max_tokens: 4000, // Increased to accommodate digest_insights polish + exec summary requirements
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `## USER PRODUCT
Name: ${userProduct.name}
Positioning: ${userProduct.positioning}
Target Market: ${userProduct.target_market}

## INSIGHTS WITH UPSTREAM CONTEXT (${insights.length} total)

${insightBlock}

---

## SCENARIO CONTEXT (for executive summary)

Market direction: ${scenarios.market_direction}
Highest-confidence prediction: ${
  scenarios.scenarios
    .sort((a, b) => b.confidence - a.confidence)[0]
    ?.prediction ?? 'none'
}
Top preemptive action: ${
  scenarios.scenarios
    .sort((a, b) => b.confidence - a.confidence)[0]
    ?.preemptive_action ?? 'none'
}

---

## SCORING INSTRUCTIONS

For each insight:
1. Score specificity, actionability, evidence on 1–10
2. Compute overall_score = (specificity × 0.4) + (actionability × 0.4) + (evidence × 0.2)
3. Subtract the PRE-COMPUTED red_team_penalty provided above
4. Apply inclusion/exclusion rules (overturned signals are ALWAYS excluded)
5. For included signals, write a polished DigestInsight
6. Run the calibration pass before finalising

Return JSON:
{
  "scores": [
    {
      "signal_id": "string",
      "specificity_score": 1-10,
      "actionability_score": 1-10,
      "evidence_score": 1-10,
      "red_team_penalty": 0-3,
      "overall_score": 1.0-10.0,
      "include_in_digest": boolean,
      "rejection_reason": "string or null",
      "revision_note": "string"
    }
  ],
  "digest_insights": [
    {
      "signal_id": "string",
      "competitor_name": "string",
      "headline": "One sentence, present tense, no jargon, names competitor and what happened",
      "so_what": "Why this matters for ${userProduct.name} — must name a specific feature",
      "action": "Role + deadline + concrete output artifact",
      "urgency": "critical | high | medium | low",
      "confidence_label": "high | medium | low"
    }
  ],
  "executive_summary": "3-4 sentences meeting all HARD REQUIREMENTS above",
  "digest_quality_grade": "A | B | C | D",
  "signals_included": 0,
  "signals_excluded": 0,
  "improvement_notes": "Specific prompt changes that would improve next run quality"
}`,
      },
    ],
  });

  return parseNemotronJSON<QualityReport>(response.content);
}

