// lib/intelligence/agents/signal-verifier.ts
// Agent 5 — Signal Verifier
// Checks whether each strategic insight produced by Agent 2 (Competitive Strategist)
// is actually grounded in the raw signals. Distinguishes between claims that are
// directly evidenced by signal text vs. claims that are inferred/speculative.
// If more than half of an insight's key claims are inferred rather than evidenced,
// evidence_strength is set low and the insight is flagged for rejection by Agent 7.

import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { ClassifiedSignal } from './signal-classifier';
import { StrategicInsight } from './competitive-strategist';

// ── Output types ──────────────────────────────────────────────────────────────

// A single verified or refuted claim extracted from an insight
export interface ClaimVerification {
  claim: string;                  // The specific claim being verified (quoted from the insight)
  status: 'evidenced' | 'inferred' | 'contradicted';
  // evidenced   = directly supported by specific text in the source signal
  // inferred    = plausible extrapolation but no direct textual support
  // contradicted = the signal text actually conflicts with this claim
  source_text: string | null;     // The exact text from the signal that supports/contradicts it
                                  // Must be null if status is 'inferred'
  source_signal_id: string | null; // Which signal the source_text comes from
}

export interface VerificationResult {
  signal_id: string;
  verified: boolean;              // true only if evidence_strength >= 0.7 AND no contradicted claims
  evidence_strength: number;      // 0.0–1.0 — see scoring rules in prompt
  evidence_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  // HIGH   = 0.7–1.0: majority of claims evidenced, no contradictions
  // MEDIUM = 0.4–0.69: mix of evidenced and inferred, no contradictions
  // LOW    = 0.0–0.39: majority inferred, OR any claim contradicted
  claim_breakdown: ClaimVerification[]; // One entry per key claim in the insight
  evidenced_count: number;        // How many claims have direct signal text support
  inferred_count: number;         // How many claims are plausible but not directly evidenced
  contradicted_count: number;     // How many claims conflict with signal text
  evidence_note: string;          // Plain-English summary of the overall verification result
  missing_evidence: string[];     // Specific things that WOULD upgrade evidence_tier to HIGH
                                  // Must be concrete, not generic ("Official Notion press release
                                  // confirming $200M raise" not "more evidence needed")
  rejection_flag: boolean;        // true if more than half of claims are inferred OR any contradicted
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an evidence-verification analyst. Your job is to audit strategic insights produced by the Competitive Strategist and determine whether each claim in each insight is directly supported by the raw signal text, or whether it has been inferred or speculated.

You are the last line of defense before insights reach the user. Your job is NOT to agree with the Strategist — it is to be genuinely skeptical and hold every claim to the same standard a senior analyst would apply before publishing a competitive brief.

---

## THE CORE DISTINCTION: EVIDENCED vs INFERRED vs CONTRADICTED

For every key claim in an insight, you must classify it as one of three statuses:

**EVIDENCED** — The claim is directly supported by specific text in the source signal.
- You must quote the exact text that supports it in source_text
- You must record which signal it came from in source_signal_id
- "Directly supported" means the claim follows in one logical step from the text, with no additional assumptions

**INFERRED** — The claim is plausible given the signal, but requires assumptions the signal does not explicitly support.
- source_text must be null for inferred claims
- Example: Signal says "Notion hired 15 ML engineers" — claiming "Notion is building an AI feature" is evidenced; claiming "Notion will launch AI features within 6 weeks targeting project management" is inferred

**CONTRADICTED** — The signal text actually conflicts with the claim, or the claim is the opposite of what the signal says.
- Quote the contradicting text in source_text
- A single contradicted claim immediately sets verified=false and rejection_flag=true

---

## EVIDENCE SCORING RULES

After classifying every claim, compute evidence_strength as:

  evidenced_count / (evidenced_count + inferred_count + contradicted_count)

Then apply these adjustments:
- Any contradicted claim → subtract 0.2 from the computed score (floor at 0.0)
- All claims evidenced (inferred_count = 0, contradicted_count = 0) → score = 1.0

Map evidence_strength to evidence_tier:
- 0.7–1.0 → HIGH
- 0.4–0.69 → MEDIUM  
- 0.0–0.39 → LOW

Set verified=true ONLY IF:
- evidence_strength >= 0.7 (HIGH tier), AND
- contradicted_count = 0

Set rejection_flag=true IF:
- inferred_count > evidenced_count (majority of claims are inferred), OR
- contradicted_count >= 1

---

## WHAT COUNTS AS A "KEY CLAIM"

Break each insight into its key claims before verifying. Key claims are:
1. The factual assertion (what happened)
2. The strategic implication (why it matters)
3. The impact on the user's product (how it affects them specifically)
4. The urgency or timeframe (how quickly this matters)

Do NOT verify the recommended_action — that is the Strategist's interpretation and is evaluated by the Quality Judge. Focus only on the four claim types above.

---

## WHAT "SPECIFIC" MISSING EVIDENCE MEANS

missing_evidence must list the exact thing that would upgrade the verification.

BAD (too generic):
- "More evidence needed"
- "Official confirmation required"
- "Additional signals would help"

GOOD (specific and actionable):
- "Official press release or blog post from Notion confirming the $200M funding round and its intended use for AI development"
- "Notion's pricing page showing the actual enterprise tier price change, not just a job posting describing it"
- "A second independent source (e.g., TechCrunch article or LinkedIn post from a Notion employee) confirming the ML engineer headcount"

Each item in missing_evidence should be something that could realistically be found and that would, if found, move a specific claim from 'inferred' to 'evidenced'.

---

## STRICTNESS CALIBRATION

You should be strict but not paranoid. Target roughly:
- 50–60% of insights fully verified in a healthy signal batch
- 20–30% at MEDIUM (mix of evidenced and inferred)
- 10–20% at LOW or rejected

If you are verifying more than 80% of insights as HIGH, you are being too lenient.
If you are verifying fewer than 30% as HIGH, you are being too strict.

A job posting is direct evidence of hiring intent, not of a product launch.
A pricing page screenshot is direct evidence of a price, not of the strategic reason behind it.
A partnership announcement is direct evidence of the partnership, not of its depth or exclusivity.`;

// ── Main function ─────────────────────────────────────────────────────────────

export async function verifyInsights(
  insights: StrategicInsight[],
  classifiedSignals: ClassifiedSignal[]
): Promise<VerificationResult[]> {
  if (insights.length === 0) return [];

  // Build a detailed signal reference block so the model has the full raw
  // content available to quote from — not just titles and summaries
  const signalBlock = classifiedSignals
    .map(s => `Signal ID: ${s.id}
Competitor: ${s.competitor_name}
Type: ${s.signal_type}
Title: ${s.title}
Summary: ${s.summary}
Raw content excerpt: ${s.raw_content?.slice(0, 600) ?? '(not available)'}
Classification reasoning: ${s.classification.reasoning}
Strategic weight: ${s.classification.strategic_weight}/10`)
    .join('\n\n---\n\n');

  // Build the insights block — include all four claim types explicitly so
  // the model knows what to verify against
  const insightBlock = insights
    .map(ins => `Signal ID: ${ins.signal_id}
Competitor: ${ins.competitor_name}
Claim 1 — What happened: ${ins.what_happened}
Claim 2 — Strategic implication: ${ins.strategic_implication}
Claim 3 — Impact on user: ${ins.impact_on_user}
Claim 4 — Urgency/timeframe: ${ins.urgency} / ${ins.time_horizon}`)
    .join('\n\n---\n\n');

  const response = await callNemotron({
    agent_name: 'signal-verifier',
    temperature: 0.1, // Low temperature — verification is deterministic, not creative
    max_tokens: 4500, // Increased to accommodate detailed claim_breakdown for many insights
    response_format: 'json',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `## SOURCE SIGNALS (ground truth — quote from these to support claims)

${signalBlock}

---

## INSIGHTS TO VERIFY (four claims per insight)

${insightBlock}

---

For each insight, break it into its four key claims and verify each one.
Return JSON:

{
  "verifications": [
    {
      "signal_id": "string",
      "verified": boolean,
      "evidence_strength": 0.0,
      "evidence_tier": "HIGH | MEDIUM | LOW",
      "claim_breakdown": [
        {
          "claim": "Exact claim text from the insight",
          "status": "evidenced | inferred | contradicted",
          "source_text": "Quoted text from signal, or null if inferred",
          "source_signal_id": "signal id or null"
        }
      ],
      "evidenced_count": 0,
      "inferred_count": 0,
      "contradicted_count": 0,
      "evidence_note": "Plain-English summary of what is and isn't supported",
      "missing_evidence": [
        "Specific thing that would upgrade a named inferred claim to evidenced"
      ],
      "rejection_flag": boolean
    }
  ]
}`,
      },
    ],
  });

  const parsed = parseNemotronJSON<{ verifications: VerificationResult[] }>(response.content);
  return parsed.verifications ?? [];
}

