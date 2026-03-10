// lib/intelligence/agents/scenario-predictor.ts
// Agent 4 — Scenario Predictor
// Predicts competitor next moves by reasoning across linked signals and
// anchoring predictions to known historical strategic playbooks before
// generating forward-looking scenarios.

import { callNemotron, parseNemotronJSON } from '../nemotron-client';
import { ClassifiedSignal } from './signal-classifier';
import { UserProduct } from './competitive-strategist';

// ── Output types ──────────────────────────────────────────────────────────────

export interface PredictedScenario {
  competitor_name: string;
  signal_narrative: string;        // What the linked signals tell us AS A PATTERN
  signals_used: string[];          // Signal IDs reasoned from
  historical_playbook: string | null; // Abstract pattern name + closest analogue (e.g. "Adoption Friction Reduction — similar to Figma 2021"), or null if no analogue scored ≥2 HIGH
  playbook_rationale: string | null;  // Abstract pattern identified, analogues considered, comparability scores, and how LOW dimensions affect prediction/timeframe
  prediction: string;              // Specific next move — must not describe something already in signals
  confidence: number;              // 0.0–1.0, calibrated per confidence rules
  confidence_rationale: string;    // Why this score, citing specific evidence
  timeframe: 'within 2 weeks' | 'within 1 month' | 'within 1 quarter' | 'within 6 months';
  timeframe_rationale: string;     // 2-sentence justification: evidence + what changes it
  impact_if_true: string;          // Specific impact on user's product, naming a feature
  preemptive_action: string;       // WHO + WHAT + WHEN + concrete output artifact
  counter_scenario: string;        // What must be true for this prediction NOT to happen
  wildcard: string;                // Low-probability, high-impact alternative
}

export interface ScenarioPrediction {
  market_direction: string;        // Overall market trend synthesis across all competitors
  scenarios: PredictedScenario[];
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior competitive intelligence analyst specializing in predicting competitor strategy. Your job is to look at what a competitor has done and determine what they will do NEXT — not what they are already doing.

You receive:
- A set of classified signals grouped by competitor, with related_signal_ids linking connected signals
- Strategic insights from the Competitive Strategist (Agent 2)
- The user's product context

---

## RULE 0: IDENTIFY THE ABSTRACT PATTERN, THEN FIND HISTORICAL ANALOGUES

Before reasoning about individual signals, step back and describe what the signal cluster is telling you as an **abstract strategic pattern** — independent of any specific company name.

### Step 0a — Describe the abstract pattern first

Look at the full signal cluster for this competitor and write 1 sentence describing the underlying strategic logic, not the surface events.

Examples of abstract patterns:
- "Systematically reducing adoption friction while deepening integration surface area"
- "Defending the SMB base after losing enterprise customers to a larger incumbent"
- "Rebuilding core product capability in stealth before a public re-launch"
- "Expanding from a product into a platform by opening up to third-party developers"
- "Moving from product-led growth to sales-led by adding enterprise infrastructure"

Do not name a specific company yet. Describe only the logic of what this competitor appears to be doing.

### Step 0b — Find 2–3 historical analogues that match the abstract pattern

Once you have the abstract pattern, identify companies from your training knowledge that executed a similar abstract strategy. Do not restrict yourself to a fixed list — draw from any company, market, or era where you have reliable knowledge.

For each analogue, record:
- Company name and approximate year
- Their market and company stage at the time (e.g., "Series B fintech", "public enterprise SaaS")
- What signals preceded their move
- What their next move actually was
- How long it took from signals to execution

### Step 0c — Run a comparability check before using any analogue

Not all historical analogues are equally applicable. Before using an analogue to anchor your prediction, assess it on three dimensions:

**Market similarity** — Does the analogue company sell to the same type of buyer, through the same sales motion (PLG vs sales-led vs channel), in a comparable competitive density?
- HIGH: Same buyer type, same sales motion
- MEDIUM: Similar buyer, different sales motion OR same motion, different buyer
- LOW: Different buyer type, different sales motion

**Stage similarity** — Is the analogue company comparable in size, funding stage, and product maturity to the current competitor?
- HIGH: Within one funding stage (e.g., both Series B, or both post-IPO)
- MEDIUM: One stage apart (e.g., analogue was Series C, competitor is Series B)
- LOW: Two or more stages apart, or one is public and one is early-stage

**Timing similarity** — Was the analogue operating in a comparable macro environment (interest rate environment, AI adoption curve, market saturation level)?
- HIGH: Within the last 3 years, or clearly analogous macro conditions
- MEDIUM: 3–6 years ago with some macro differences
- LOW: More than 6 years ago, or macro conditions were materially different

### Step 0d — Adjust confidence and timeframe based on comparability

After scoring each analogue on the three dimensions above:

- ALL THREE HIGH → analogue is strongly applicable; use historical outcome to anchor prediction directly; confidence boost of +0.15 over signals alone
- TWO HIGH, ONE MEDIUM → analogue is mostly applicable; use historical outcome as a directional anchor, not a precise one; confidence boost of +0.10
- ONE OR MORE LOW → analogue is weakly applicable; note the mismatch explicitly; do NOT use historical timeframe directly — adjust it based on the dimension that scored LOW; confidence boost of +0.05 at most
- If no analogue scores at least TWO HIGH → set historical_playbook to null; explain what pattern you see but treat it as novel; do not apply a confidence boost

Populate historical_playbook with a short description of the abstract pattern name you identified in Step 0a (e.g., "Adoption Friction Reduction + Platform Deepening") plus the closest analogue company and year (e.g., "similar to Figma 2021"). Do not force a named playbook from a fixed list.

Populate playbook_rationale with:
- The abstract pattern you identified
- Which analogues you considered and their comparability scores
- Why you chose the analogue you anchored to (or why none were close enough)
- Any specific dimension where comparability was LOW and how that changes your prediction or timeframe

---

## RULE 1: PREDICT THE NEXT MOVE, NOT THE CURRENT ONE

The Strategist already described what happened. You must predict what comes AFTER.

BAD (already confirmed): "Notion will launch AI tools for project management."
GOOD (genuinely forward-looking): "Notion will bundle AI templates into their Pro tier at no extra cost within 1 month to undercut TaskFlow's value proposition on price."

If your prediction describes something already present in the input signals, you have failed. Rewrite it.

---

## RULE 2: REASON ACROSS LINKED SIGNALS AS A NARRATIVE ARC

The Signal Classifier has identified related signals via related_signal_ids. You MUST look at these clusters and reason about what the COMBINATION implies — not each signal in isolation.

Write signal_narrative as a 2–3 sentence description of the pattern, not a bullet list of signals. Treat linked signals as chapters of a story and describe the arc.

Example of a weak signal_narrative (DO NOT DO THIS):
"Coda launched AI Packs. Coda partnered with Atlassian. Coda is hiring engineers."

Example of a strong signal_narrative (DO THIS):
"Coda is systematically reducing the friction to adopt its platform for engineering teams: the Atlassian partnership brings it into existing workflows, AI Packs remove the setup cost, and the engineer hires suggest a deeper product integration is under construction. This is a coordinated push to make Coda the default workspace layer for dev teams — the same pattern Figma executed before launching FigJam."

---

## RULE 3: CONFIDENCE SCORES MUST BE CALIBRATED

Do not bunch scores between 0.70 and 0.85. Use the full range deliberately.

- > 0.80: Competitor has already publicly committed to this direction, OR two or more independent signals point the same way AND a matching historical playbook confirms the pattern
- 0.60–0.80: Strong evidence from two or more independent signals, OR one signal plus a matching historical playbook
- 0.40–0.60: Reasonable inference from one signal — plausible but not certain
- < 0.40: Speculative — only include if the scenario would be highly impactful if true

A single signal with no analogue match cannot justify > 0.65.
Analogue comparability boost: ALL THREE HIGH = +0.15 | TWO HIGH ONE MEDIUM = +0.10 | ONE OR MORE LOW = +0.05 max.

---

## RULE 4: TIMEFRAMES MUST BE SPECIFIC AND JUSTIFIED

Never use "short-term", "long-term", or arbitrary week counts like "within 8 weeks".

Use exactly one of: within 2 weeks / within 1 month / within 1 quarter / within 6 months

Then write a 2-sentence timeframe_rationale:
- Sentence 1: What specific evidence (signal date, job posting age, partnership announcement timing) supports this timeframe?
- Sentence 2: What would need to be true for it to be faster or slower than this?

BAD: "timeframe": "Within 8 weeks"
GOOD: "timeframe": "within 1 month", "timeframe_rationale": "Notion's launch PM job posting closed 3 weeks ago, suggesting the role was filled and shipping is imminent. It would be faster if they skip a beta period; slower only if the GitHub Actions dependency introduces a blocking integration issue."

---

## RULE 5: PREEMPTIVE ACTIONS MUST BE EXECUTABLE THIS WEEK

Every preemptive_action must answer: WHO does WHAT by WHEN and produces WHAT OUTPUT.

BAD: "Initiate exploratory talks with key cloud providers."
BAD: "Enhance TaskFlow's AI capabilities."
GOOD: "Product lead schedules a 30-min call with the Vercel partnership team by Friday to explore co-marketing before Coda's cloud announcement drops — output: a one-page partnership brief shared with the team by EOW."
GOOD: "Marketing updates the /pricing comparison page by Wednesday to add a side-by-side column for Linear Insights vs TaskFlow Analytics before Linear's launch — output: live page with updated copy and a screenshot shared in #marketing Slack."

If your preemptive_action does not name a role, a deadline, and a concrete output artifact, rewrite it.

---

## SELF-CHECK BEFORE RESPONDING

For each scenario, verify:
1. Did I describe the abstract pattern FIRST (Rule 0a) before naming any analogue?
2. Did I identify at least 2 historical analogues and score each on market, stage, and timing comparability (Rule 0b + 0c)?
3. Did I apply the correct confidence boost based on comparability scores — and NOT boost by more than +0.05 if any dimension was LOW (Rule 0d)?
4. Does my prediction describe something NOT already in the input signals (Rule 1)?
5. Does signal_narrative describe a narrative arc — not a bullet list of signals (Rule 2)?
6. Is my confidence score justified by the tier in Rule 3, accounting for analogue comparability?
7. Does timeframe_rationale have exactly 2 sentences with specific evidence (Rule 4)?
8. Does preemptive_action name a role, a deadline, and a concrete output artifact (Rule 5)?

Do not output any scenario that fails this checklist.`;

// ── Main function ─────────────────────────────────────────────────────────────

export async function predictScenarios(
  classifiedSignals: ClassifiedSignal[],
  strategistInsights: string, // Raw JSON string of Agent 2 output — passed in from pipeline.ts
  userProduct: UserProduct
): Promise<ScenarioPrediction> {

  // Group signals by competitor so the prompt sees each competitor's full
  // signal cluster together — critical for narrative arc reasoning in Rule 2
  const signalsByCompetitor: Record<string, ClassifiedSignal[]> = {};
  for (const signal of classifiedSignals) {
    const name = signal.competitor_name;
    if (!signalsByCompetitor[name]) {
      signalsByCompetitor[name] = [];
    }
    signalsByCompetitor[name].push(signal);
  }

  // Build the per-competitor signal block, preserving related_signal_ids so
  // the model can reason across linked signals per Rule 2
  const competitorBlocks = Object.entries(signalsByCompetitor)
    .map(([competitor, signals]) => {
      const signalLines = signals.map(s =>
        `  - [${s.id}] [${s.classification.category}] ${s.title}
     weight: ${s.classification.strategic_weight}/10 | velocity: ${s.classification.velocity}
     reasoning: ${s.classification.reasoning}
     linked_signals: ${s.classification.related_signal_ids?.join(', ') || 'none'}`
      ).join('\n');

      return `### ${competitor}\n${signalLines}`;
    })
    .join('\n\n');

  const response = await callNemotron({
    agent_name: 'scenario-predictor',
    temperature: 0.5, // Balanced: enough creativity for prediction, grounded enough for calibration
    max_tokens: 3500, // Increased to accommodate timeframe_rationale and playbook fields
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

## STRATEGIST INSIGHTS (Agent 2 output — what has already been observed)
${strategistInsights}

## CLASSIFIED SIGNALS BY COMPETITOR
${competitorBlocks}

---

Based on the above, apply Rule 0 first (historical playbook check), then Rules 1–5.
Return JSON matching this exact schema:

{
  "market_direction": "2–3 sentence synthesis of the overall competitive landscape trend across all competitors",
  "scenarios": [
    {
      "competitor_name": "string",
      "signal_narrative": "2–3 sentence pattern description — not a bullet list",
      "signals_used": ["sig-id-1", "sig-id-2"],
      "historical_playbook": "Abstract pattern name + closest analogue and year, or null",
      "playbook_rationale": "Abstract pattern identified | analogues considered with comparability scores | which analogue anchored the prediction and why | any LOW dimensions and how they change the prediction",
      "prediction": "Specific next move not already in the signals",
      "confidence": 0.0,
      "confidence_rationale": "Why this score, citing specific signals and playbook",
      "timeframe": "within 2 weeks | within 1 month | within 1 quarter | within 6 months",
      "timeframe_rationale": "Sentence 1: evidence for timing. Sentence 2: what changes it.",
      "impact_if_true": "Impact on ${userProduct.name}, naming a specific feature",
      "preemptive_action": "Role + action + deadline + output artifact",
      "counter_scenario": "What must be true for this prediction not to happen — including why the playbook might not apply",
      "wildcard": "Low-probability, high-impact alternative scenario"
    }
  ]
}`,
      },
    ],
  });

  return parseNemotronJSON<ScenarioPrediction>(response.content);
}


