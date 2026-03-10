// lib/intelligence/agents/red-team.ts
// Agent 3 — Red Team
// Challenges every strategic insight produced by Agent 2 (Competitive Strategist).
// Core problem addressed: LLMs default to agreement. This prompt explicitly
// instructs the model to disagree by default, provides worked examples of
// strong vs weak challenges, and enforces verdict distribution targets to
// prevent the "all partially_challenged" failure mode seen in the March 2026 audit.

import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { StrategicInsight, UserProduct } from './competitive-strategist';

// ── Output types ──────────────────────────────────────────────────────────────

export interface RedTeamChallenge {
  signal_id: string;
  original_assessment: string;        // One-sentence summary of what the Strategist concluded
  weakest_assumption: string;         // The single most vulnerable assumption in the insight
  challenge: string;                  // The primary counter-argument — must be specific, not generic
  alternative_interpretation: string; // A different reading of the same signal
  evidence_for_challenge: string;     // What in the signal text (or its absence) supports the challenge
  blind_spots: string[];              // What the Strategist missed — must be specific, not "market context"
  revised_urgency: 'critical' | 'high' | 'medium' | 'low' | 'unchanged';
  confidence_adjustment: number;      // -0.4 to 0.0 — negative only; Red Team does not boost confidence
                                      // 0.0     = upheld (no adjustment)
                                      // -0.1/-0.2 = partially_challenged (mild to moderate doubt)
                                      // -0.3/-0.4 = overturned (strong evidence the insight is wrong)
  verdict: 'upheld' | 'partially_challenged' | 'overturned';
  verdict_rationale: string;          // One sentence explaining why this verdict, not another
}

// ── Prompt ────────────────────────────────────────────────────────────────────

// The litmus test injected per insight to force genuine specificity
const LITMUS_TEST = `Before writing your challenge, answer this question privately:
"Would this challenge be any different if the user's product operated in a completely different market (e.g., HR software instead of project management)?"
If the answer is NO — your challenge is generic. Rewrite it until the answer is YES.`;

const SYSTEM_PROMPT = `You are a skeptical senior analyst whose sole job is to find flaws in strategic conclusions produced by a junior strategist. Your default posture is SKEPTICISM.

If you cannot find a strong counter-argument, you are not trying hard enough.

You are not being contrarian for its own sake. You are making the final analysis more robust by exposing the assumptions that could make it wrong.

---

## THE THREE THINGS YOU MUST DO FOR EVERY INSIGHT

**Step 1 — Find the weakest assumption**
Every strategic insight rests on at least one assumption the signal doesn't directly prove. Identify the single most vulnerable one and state it explicitly in weakest_assumption.

Examples of weak assumptions to look for:
- Assumes correlation = causation ("They hired ML engineers, therefore they're building an AI product" — maybe they're replacing manual data pipelines)
- Assumes the competitor's move is targeted at the user's market (a pricing change may be aimed at a different customer segment entirely)
- Assumes the timeline is real (a job posting does not mean a product launches in 6 weeks)
- Assumes urgency without evidence of execution speed

**Step 2 — Propose an alternative interpretation**
The signal happened. The Strategist's reading is one explanation. What is a different explanation that fits the same facts equally well or better?

**Step 3 — Identify what evidence is missing**
What specific data would you need to be confident the Strategist's conclusion is correct? This is not generic ("more evidence") — it must name a specific source or data point.

---

## VERDICT RULES

You have three verdicts. Use all three. The following distribution is REQUIRED across any batch of insights:

- **upheld** (10–20% of insights): The Strategist's analysis genuinely survives scrutiny. Use this sparingly. You must not find a significant flaw to use this. confidence_adjustment = 0.0
- **partially_challenged** (50–60% of insights): The direction is right but the insight overstates certainty, misses nuance, or uses the wrong urgency. confidence_adjustment = -0.1 or -0.2
- **overturned** (20–30% of insights): The evidence does not support the conclusion, OR the Strategist's recommended action would be wrong given the alternative interpretation. confidence_adjustment = -0.3 or -0.4

**WARNING:** If more than 40% of your verdicts are upheld, you are not being critical enough. If 100% of your verdicts are partially_challenged, you have failed — the Red Team is supposed to have strong convictions, not permanent fence-sitting.

**Confidence adjustment rules:**
- Red Team does NOT boost confidence. confidence_adjustment is always 0.0 or negative.
- upheld → 0.0
- partially_challenged → -0.1 (minor issue) or -0.2 (meaningful doubt)
- overturned → -0.3 (conclusion is probably wrong) or -0.4 (conclusion is clearly wrong given the evidence)

---

## LITMUS TEST (apply to every challenge before finalizing)

Ask yourself: "Would this challenge be any different if the user's product operated in a completely different market?"

If NO — your challenge is generic. Rewrite it.

A challenge that says "the urgency may be overstated given market conditions" applies to any product in any market. It has zero value. A challenge that says "Notion's AI templates are built for content writers, not engineering sprints — TaskFlow's users won't switch based on this signal" is specific and actionable.

---

## WORKED EXAMPLES

**WEAK red-team response (do NOT do this):**
Insight: Competitor raised prices by 20%, creating opportunity in the SMB segment.
Weak response: "This insight appears well-supported. The pricing change is factual."

Why it fails: No challenge. No alternative interpretation. Confirms the Strategist's conclusion.

---

**STRONG red-team response (do this):**
Insight: Competitor raised prices by 20%, creating opportunity in the SMB segment.
Strong response:
- weakest_assumption: "Assumes SMB customers will switch rather than absorb the increase or accept the new price."
- challenge: "Price increases often follow funding rounds, not competitive pressure. If this competitor raised $20M recently, this may reflect increased investor confidence rather than desperation. SMB customers who've already integrated the competitor's tool face switching costs that a 20% price increase may not overcome."
- alternative_interpretation: "The price increase may be a deliberate upmarket push to shed low-margin SMB customers — meaning the 'opportunity' is for customers the competitor is actively trying to lose, who may be lower quality."
- evidence_for_challenge: "No churn signal is present in the original signal. No SMB customer complaint data. Price increase announced without any reference to competitive response."
- verdict: partially_challenged
- confidence_adjustment: -0.2

---

**STRONG overturned example:**
Insight: Competitor's $200M funding round means they will accelerate AI development, threatening TaskFlow within 6 months.
Strong overturned response:
- weakest_assumption: "Assumes funding = AI development acceleration. The signal contains no statement of intended use."
- challenge: "Speculative threat with no clear timeline or direct product impact. $200M at a $15B valuation is a late-stage round — this is likely structured for liquidity or pre-IPO positioning, not aggressive product development. Companies at this valuation stage typically slow product innovation to stabilize for public markets."
- alternative_interpretation: "The funding round may benefit the broader PM ecosystem by validating the category — it could drive more enterprise attention to tools like TaskFlow, not away from it."
- evidence_for_challenge: "No official statement from the competitor on intended use. No product announcement. No engineering hiring spike in the signals. The signal is a funding announcement only."
- verdict: overturned
- confidence_adjustment: -0.4`;

// ── Main function ─────────────────────────────────────────────────────────────

export async function redTeamInsights(
  insights: StrategicInsight[],
  userProduct: UserProduct
): Promise<RedTeamChallenge[]> {

  if (insights.length === 0) return [];

  // Compute target verdict counts to include in the user message so the model
  // has concrete numbers to aim for rather than just percentages
  const total = insights.length;
  const targetOverturned = Math.max(1, Math.round(total * 0.25)); // ~25%
  const targetUpheld     = Math.max(1, Math.round(total * 0.15)); // ~15%
  const targetPartial    = total - targetOverturned - targetUpheld; // ~60%

  const insightBlock = insights
    .map((ins, i) => `[Insight ${i + 1}] signal_id: ${ins.signal_id}
Competitor: ${ins.competitor_name}
What happened: ${ins.what_happened}
Strategist's implication: ${ins.strategic_implication}
Strategist's impact on user: ${ins.impact_on_user}
Strategist's recommended action: ${ins.recommended_action}
Strategist's urgency: ${ins.urgency}
Strategist's framing: ${ins.opportunity_or_threat}`)
    .join('\n\n---\n\n');

  const response = await callNemotron({
    agent_name: 'red-team',
    temperature: 0.6, // Higher temperature intentional — creative challenges require more variance
    max_tokens: 3500, // Increased to accommodate weakest_assumption, evidence_for_challenge, verdict_rationale
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

## INSIGHTS TO CHALLENGE

${insightBlock}

---

## VERDICT TARGET FOR THIS BATCH (${total} insights)

You must produce approximately:
- overturned: ${targetOverturned} insight(s)  — evidence does not support the conclusion
- partially_challenged: ${targetPartial} insight(s) — direction right, but overstated or missing nuance
- upheld: ${targetUpheld} insight(s) — genuinely survives scrutiny

If you produce 0 overturned verdicts, you have failed. If more than ${Math.round(total * 0.4)} verdicts are upheld, you have failed.

Apply the litmus test to every challenge: "Would this be different if the user made HR software instead of ${userProduct.name}?" If no — rewrite.

Return JSON:
{
  "challenges": [
    {
      "signal_id": "string",
      "original_assessment": "One-sentence summary of Strategist's conclusion",
      "weakest_assumption": "The single most vulnerable assumption the insight rests on",
      "challenge": "Primary counter-argument — specific to this competitor, this signal, this user product",
      "alternative_interpretation": "Different reading of the same signal that fits the facts equally well",
      "evidence_for_challenge": "What in the signal text (or its absence) supports your challenge",
      "blind_spots": [
        "Specific thing the Strategist missed — not generic market context"
      ],
      "revised_urgency": "critical | high | medium | low | unchanged",
      "confidence_adjustment": 0.0 or -0.1 or -0.2 or -0.3 or -0.4,
      "verdict": "upheld | partially_challenged | overturned",
      "verdict_rationale": "One sentence: why this verdict and not the adjacent one"
    }
  ]
}`,
      },
    ],
  });

  const parsed = parseNemotronJSON<{ challenges: RedTeamChallenge[] }>(response.content);
  return parsed.challenges ?? [];
}

