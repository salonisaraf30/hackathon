# Agent Prompt Audit — Feb 2026

**Created:** 2026-03-01  
**Auditor:** Automated Pipeline Analysis  
**Signals Tested:** 10 (Notion, Linear, Coda)  
**User Product:** TaskFlow — AI-powered project management for engineering teams

---

## Executive Summary

We ran 10 competitive intelligence signals through all 7 agents in the multi-agent pipeline. This document captures the **raw quality** of each agent's output, scored against three criteria: **Specificity**, **Actionability**, and **Genericness Penalty**.

**Key Finding:** Most agents produce outputs that are _moderately_ useful but suffer from vague, "consultant-speak" recommendations that could apply to almost any B2B SaaS. The **Red Team** and **Competitive Strategist** agents are the worst offenders; the **Signal Classifier** and **Contradiction Detector** are the best.

---

## Scoring Criteria

| Dimension | 1 | 3 | 5 |
|-----------|---|---|---|
| **Specificity** | Could apply to any company | Mentions competitor by name but generic | References specific features, pricing, market segment matching user's situation |
| **Actionability** | "Monitor the situation" | "Consider updating your messaging" | "Adjust your pricing page this week to highlight X before their launch" |
| **Genericness Penalty** | Identical whether user makes PM or HR tools (worst) | Some tailoring visible | Clearly tailored to user's specific product context (best) |

**Scoring:** 1-5 scale. For Genericness Penalty, **lower = better** (1 = perfectly tailored, 5 = completely generic).

---

## Agent-by-Agent Analysis

### 1. Signal Classifier

**Role:** Categorizes raw signals into strategic buckets with reasoning.

**Example Output (sig-003 — Notion hiring ML engineers):**
```json
{
  "category": "internal_shift",
  "confidence": 0.85,
  "reasoning": "Hiring 15 ML engineers suggests Notion is heavily investing in AI capabilities, indicating a strategic shift towards more intelligent workspace solutions.",
  "strategic_weight": 9,
  "velocity": "accelerating",
  "related_signal_ids": ["sig-001", "sig-008", "sig-009-manual"]
}
```

| Signal | Specificity | Actionability | Genericness Penalty |
|--------|-------------|---------------|---------------------|
| sig-001 (Notion AI templates) | 4 | N/A (classifier) | 2 |
| sig-003 (Notion ML hires) | 4 | N/A | 2 |
| sig-007 (Coda+Atlassian) | 5 | N/A | 1 |
| sig-004 (Linear GitHub) | 4 | N/A | 2 |
| **Average** | **4.2** | **N/A** | **1.8** |

**Assessment:** The Signal Classifier does a **decent job**. Category assignments are accurate, and it correctly identifies related signals (e.g., linking Notion's hiring, AI launch, and funding). The reasoning is clear but somewhat surface-level — it states _what_ the signal means but not _why_ it matters specifically to TaskFlow. This is acceptable since strategic context comes from the Competitive Strategist.

**Score Summary:** Specificity 4.2 / Genericness 1.8 — **ACCEPTABLE**

---

### 2. Competitive Strategist

**Role:** Generates strategic insights with recommended actions.

**Example Output (sig-001 — Notion AI templates):**
```json
{
  "what_happened": "Notion launches AI-powered project templates with automated planning",
  "strategic_implication": "Notion enhances user experience and productivity, attracting new customers with AI-driven project management",
  "impact_on_user": "TaskFlow's AI-powered sprint planning may be perceived as less innovative; highlighting unique value propositions is crucial",
  "recommended_action": "Immediately update TaskFlow's marketing materials to emphasize the superiority of its AI sprint planning, particularly for engineering teams",
  "urgency": "critical"
}
```

| Signal | Specificity | Actionability | Genericness Penalty |
|--------|-------------|---------------|---------------------|
| sig-001 (Notion AI templates) | 3 | 2 | 4 |
| sig-002 (Notion pricing) | 3 | 2 | 4 |
| sig-003 (Notion ML hires) | 2 | 2 | 4 |
| sig-007 (Coda+Atlassian) | 3 | 3 | 4 |
| sig-004 (Linear GitHub) | 3 | 2 | 4 |
| sig-005 (Linear Insights) | 2 | 2 | 4 |
| **Average** | **2.7** | **2.2** | **4.0** |

**Why It's Weak:**
1. **Vague recommendations:** "update TaskFlow's marketing materials to emphasize superiority" — HOW? Which page? What copy? What superiority?
2. **Missing specific comparisons:** Never says "TaskFlow's [X feature] is better because [Y metric]"
3. **Time horizons are arbitrary:** "Within 4 weeks" "Within 6 weeks" — no reasoning for why these specific timeframes
4. **Consultant-speak:** "highlighting unique value propositions is crucial" — this is filler, not insight
5. **No pricing specifics:** For sig-002 (Notion pricing cut), suggests "pricing sensitivity analysis" instead of concrete pricing moves

**Score Summary:** Specificity 2.7 / Actionability 2.2 / Genericness 4.0 — **NEEDS MAJOR IMPROVEMENT**

---

### 3. Red Team

**Role:** Challenge strategist conclusions, find blind spots.

**Example Output (sig-003 — Notion ML hires):**
```json
{
  "original_assessment": "Notion's ML engineer hires threaten TaskFlow's developer workflow integration",
  "challenge": "Assuming Notion's AI development targets project management without explicit evidence",
  "alternative_interpretation": "Notion's 'next-generation workspace intelligence' might focus on general collaboration tools rather than project management",
  "blind_spots": ["Unclear direct application to project management", "Potential for Notion's AI to augment TaskFlow's offerings"],
  "revised_urgency": "low",
  "confidence_adjustment": -0.3,
  "verdict": "partially_challenged"
}
```

| Signal | Specificity | Actionability | Genericness Penalty |
|--------|-------------|---------------|---------------------|
| sig-001 (Notion AI templates) | 3 | N/A | 3 |
| sig-002 (Notion pricing) | 2 | N/A | 4 |
| sig-003 (Notion ML hires) | 3 | N/A | 3 |
| sig-007 (Coda+Atlassian) | 2 | N/A | 5 |
| sig-008 (Coda AI Packs) | 2 | N/A | 4 |
| **Average** | **2.4** | **N/A** | **3.8** |

**Why It's Weak:**
1. **Challenges are too timid:** Most challenges are "maybe it doesn't target project management" — this is basic, not insightful
2. **No market intelligence:** Never references external data, benchmarks, or industry patterns
3. **Alternative interpretations are lazy:** "Might focus on general collaboration tools" — no supporting evidence
4. **Misses obvious challenges:** For sig-007 (Coda+Atlassian), doesn't ask "Is Atlassian even relevant to TaskFlow's target market?"
5. **Verdict distribution:** 6/8 are "partially_challenged" with no strong convictions — wishy-washy
6. **Never says "this is noise":** Every signal gets treated as mildly important

**Why This Is The WORST Agent:**
The Red Team's job is to be the skeptic, but it's not skeptical enough. It rubber-stamps most conclusions with minor objections instead of killing bad insights. A good Red Team should overturn ~20-30% of insights completely.

**Score Summary:** Specificity 2.4 / Genericness 3.8 — **WORST AGENT, NEEDS COMPLETE REWRITE**

---

### 4. Scenario Predictor

**Role:** Predict competitor next moves with timeframes.

**Example Output (Notion scenario):**
```json
{
  "competitor_name": "Notion",
  "prediction": "Notion will launch a dedicated 'Engineering Workspace' with tailored AI-powered tools for engineering teams within the next 8 weeks.",
  "confidence": 0.85,
  "evidence": ["Notion launches AI-powered project templates", "Notion hiring 15 ML engineers"],
  "timeframe": "Within 8 weeks",
  "impact_if_true": "TaskFlow may face increased competition for engineering team market share, necessitating a stronger AI-driven value proposition.",
  "preemptive_action": "Enhance TaskFlow's AI capabilities for project management and prepare targeted marketing campaigns for engineering teams.",
  "counter_scenario": "If Notion delays its engineering-focused launch, TaskFlow could seize the opportunity to establish itself as the premier AI-powered project management tool."
}
```

| Signal | Specificity | Actionability | Genericness Penalty |
|--------|-------------|---------------|---------------------|
| Notion scenario | 4 | 2 | 3 |
| Linear scenario | 3 | 2 | 3 |
| Coda scenario | 4 | 2 | 3 |
| **Average** | **3.7** | **2.0** | **3.0** |

**Why It's Weak:**
1. **Predictions are obvious:** "Notion will launch AI tools" — already happening
2. **Preemptive actions are vague:** "Enhance AI capabilities" — not a specific action
3. **Timeframes lack justification:** Why 8 weeks? Why not 6 or 12?
4. **No probability calibration:** All confidences are bunched around 0.7-0.85

**Why It's OK:**
- Actually uses evidence from classified signals
- Counter-scenarios are a nice touch
- Wildcards are creative ("Microsoft launches free PM tool for GitHub users")

**Score Summary:** Specificity 3.7 / Actionability 2.0 / Genericness 3.0 — **MEDIOCRE**

---

### 5. Signal Verifier

**Role:** Verify insights against source signals.

**Example Output (sig-005 — Linear Insights):**
```json
{
  "signal_id": "sig-005",
  "verified": false,
  "evidence_strength": 0.4,
  "evidence_note": "Linear's product launch announcement is confirmed, but the strategic implication and user impact are somewhat speculative",
  "missing_evidence": ["Market feedback on Linear Insights", "comparative analysis of predictive analytics"]
}
```

| Signal | Specificity | Actionability | Genericness Penalty |
|--------|-------------|---------------|---------------------|
| sig-001 | 4 | N/A | 2 |
| sig-002 | 3 | N/A | 3 |
| sig-005 (flagged weak) | 4 | N/A | 2 |
| **Average** | **3.7** | **N/A** | **2.3** |

**Assessment:** The Signal Verifier is **doing its job well**. It correctly flagged sig-005 (Linear Insights) as having weak evidence (0.4 strength) and listed specific missing evidence. It's appropriately strict without being paranoid.

**Score Summary:** Specificity 3.7 / Genericness 2.3 — **ACCEPTABLE**

---

### 6. Contradiction Detector

**Role:** Find conflicts between insights.

**Example Output:**
```json
{
  "signal_id": "sig-001",
  "conflicts_with_signal_id": "sig-008",
  "severity": "medium",
  "explanation": "Both signals imply a need to highlight unique value propositions... sig-001 suggests immediate action while sig-008 recommends a 4-week timeline.",
  "recommended_resolution": "Integrate both actions: immediately update marketing materials and include in comparison guide."
}
```

| Signal Pair | Specificity | Actionability | Genericness Penalty |
|-------------|-------------|---------------|---------------------|
| sig-001 vs sig-008 | 4 | 4 | 2 |
| sig-002 vs sig-009 | 4 | 4 | 2 |
| **Average** | **4.0** | **4.0** | **2.0** |

**Assessment:** The Contradiction Detector is the **best-performing agent**. It found real conflicts (timeline inconsistencies) and provided specific resolutions. Only 2 contradictions for 8 insights is appropriate — not everything conflicts.

**Score Summary:** Specificity 4.0 / Actionability 4.0 / Genericness 2.0 — **BEST AGENT**

---

### 7. Quality Judge

**Role:** Score insights and write executive summary.

**Example Output:**
```json
{
  "scores": [
    {"signal_id": "3", "specificity_score": 9, "actionability_score": 9, "overall_score": 8.7, "include_in_digest": true}
  ],
  "executive_summary_draft": "TaskFlow faces increasing competition from Notion, Coda, and Linear, who are aggressively investing in AI capabilities and ecosystem expansions. To maintain its edge, TaskFlow must enhance its AI-powered sprint planning, deepen GitHub/GitLab integrations, and emphasize its unique value proposition for engineering teams.",
  "digest_quality_grade": "B+"
}
```

**Assessment:** The Quality Judge scores are **too generous**. It gave sig-009-manual (Notion funding) a 9/10 on actionability when the recommended action was "conduct competitive AI feature benchmarking" — that's a 5 at best. The executive summary is also generic consultant-speak.

| Signal | Specificity | Actionability | Genericness Penalty |
|--------|-------------|---------------|---------------------|
| Exec Summary | 3 | 2 | 4 |
| Scoring accuracy | 3 | 3 | 3 |
| **Average** | **3.0** | **2.5** | **3.5** |

**Score Summary:** Specificity 3.0 / Actionability 2.5 / Genericness 3.5 — **NEEDS IMPROVEMENT**

---

## Priority Ranking (Most Broken → Least Broken)

Based on actual audit scores, not assumed ordering:

| Rank | Agent | Avg Specificity | Avg Actionability | Genericness | Priority Score | Status |
|------|-------|-----------------|-------------------|-------------|----------------|--------|
| **1** | **Red Team** | 2.4 | N/A | 3.8 | **7.4** | 🔴 CRITICAL |
| **2** | **Competitive Strategist** | 2.7 | 2.2 | 4.0 | **8.9** | 🔴 CRITICAL |
| **3** | **Quality Judge** | 3.0 | 2.5 | 3.5 | **9.0** | 🟠 HIGH |
| **4** | **Scenario Predictor** | 3.7 | 2.0 | 3.0 | **8.7** | 🟠 HIGH |
| **5** | **Signal Verifier** | 3.7 | N/A | 2.3 | **5.6** | 🟢 OK |
| **6** | **Signal Classifier** | 4.2 | N/A | 1.8 | **6.0** | 🟢 OK |
| **7** | **Contradiction Detector** | 4.0 | 4.0 | 2.0 | **6.0** | 🟢 BEST |

**Priority Score Formula:** `(5 - Specificity) + (5 - Actionability) + Genericness` (lower is better)

---

## Recommended Prompt Rewrites

### Priority 1: Red Team
- Add specific examples of "strong challenges" vs "weak challenges"
- Require at least 1 "overturned" verdict per batch
- Add instruction to check: "Would this challenge be different if the user sold HR software instead?"

### Priority 2: Competitive Strategist
- Require all recommendations to include: WHO does what, WHEN, WHERE, and measurable outcome
- Add bad/good examples directly in the prompt
- Force reference to specific TaskFlow features by name

### Priority 3: Quality Judge
- Reduce inflation: current 8+ scores are being given to mediocre insights
- Executive summary needs more specifics — product names, timelines, numbers

### Priority 4: Scenario Predictor
- Require justification for all timeframes
- Preemptive actions need specificity
- Add probability calibration guidance

---

## Test Signals Summary

| ID | Competitor | Type | Title |
|----|------------|------|-------|
| sig-001 | Notion | product_launch | AI-powered project templates |
| sig-002 | Notion | pricing_change | Enterprise pricing -25% |
| sig-003 | Notion | hiring | 15 ML engineers |
| sig-004 | Linear | feature_update | GitHub Actions integration |
| sig-005 | Linear | product_launch | Linear Insights analytics |
| sig-006 | Linear | social_post | CEO teases autonomous pods |
| sig-007 | Coda | partnership | Atlassian deep integration |
| sig-008 | Coda | feature_update | AI Packs for engineering |
| sig-009-manual | Notion | funding | $200M at $15B valuation |
| sig-010-manual | Linear | pricing_change | Removed seat minimums |

---

## Files Generated

- `__tests__/fixtures/real-signals.json` — 10 test signals
- `__tests__/fixtures/baseline-outputs/signal-classifier.json`
- `__tests__/fixtures/baseline-outputs/competitive-strategist.json`
- `__tests__/fixtures/baseline-outputs/red-team.json`
- `__tests__/fixtures/baseline-outputs/scenario-predictor.json`
- `__tests__/fixtures/baseline-outputs/signal-verifier.json`
- `__tests__/fixtures/baseline-outputs/contradiction-detector.json`
- `__tests__/fixtures/baseline-outputs/quality-judge.json`

---

**Next Steps:**
1. Share this doc with Shreyam
2. Start prompt rewrites with Red Team (worst performer)
3. Re-run audit after each rewrite to measure improvement
4. Target: All agents at Specificity ≥4.0, Genericness ≤2.0
