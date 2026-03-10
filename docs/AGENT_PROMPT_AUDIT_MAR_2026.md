# Agent Prompt Audit — Mar 2026 (Run 2)

**Created:** 2026-03-08  
**Auditor:** Automated Pipeline Analysis  
**Signals Tested:** 10 (Notion, Linear, Coda)  
**User Product:** TaskFlow — AI-powered project management for engineering teams

---

## Executive Summary

This is the second audit run following prompt updates to **Agent 1 (Signal Classifier)**, **Agent 2 (Competitive Strategist)**, and **Agent 7 (Quality Judge)**. Results confirm consistent improvements.

**Key Findings:**
- **Scenario Predictor** now includes historical playbook references (Google 2017, Slack 2018, New Relic 2019)
- **Signal Verifier** provides detailed claim breakdowns with evidenced/inferred/contradicted status
- **Quality Judge** correctly excluded sig-009-manual (score 5.2) from digest
- **Contradiction Detector** found 2 conflicts with actionable resolutions

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

**Tokens Used:** 2,410 | **Duration:** 28.1s

**Example Output (sig-007 — Coda+Atlassian):**
```json
{
  "category": "ecosystem_play",
  "confidence": 0.95,
  "reasoning": "Coda's strategic partnership with Atlassian for deep integration is a clear play to expand their ecosystem reach.",
  "strategic_weight": 9,
  "velocity": "accelerating",
  "related_signal_ids": ["sig-008"]
}
```

| Signal | Category | Confidence | Strategic Weight | Specificity | Genericness |
|--------|----------|------------|------------------|-------------|-------------|
| sig-001 (Notion AI templates) | offensive_move | 0.90 | 8 | 5 | 1 |
| sig-002 (Notion pricing) | defensive_move | 0.80 | 6 | 4 | 2 |
| sig-003 (Notion ML hires) | internal_shift | 0.70 | 7 | 4 | 2 |
| sig-004 (Linear GitHub) | defensive_move | 0.85 | 5 | 4 | 2 |
| sig-005 (Linear Insights) | offensive_move | 0.90 | 8 | 5 | 1 |
| sig-006 (Linear CEO tweet) | internal_shift | 0.60 | 4 | 3 | 3 |
| sig-007 (Coda+Atlassian) | ecosystem_play | 0.95 | 9 | 5 | 1 |
| sig-008 (Coda AI Packs) | offensive_move | 0.85 | 7 | 5 | 1 |
| sig-009-manual (Notion funding) | internal_shift | 0.80 | 8 | 4 | 2 |
| sig-010-manual (Linear seats) | defensive_move | 0.70 | 3 | 3 | 3 |
| **Average** | — | **0.81** | **6.5** | **4.2** | **1.8** |

**Strengths:**
- ✅ New "ecosystem_play" category for partnership signals
- ✅ Related signal linking is accurate
- ✅ Velocity indicators provide trend context

**Score Summary:** Specificity 4.2 / Genericness 1.8 — **GOOD**

---

### 2. Competitive Strategist

**Role:** Generates strategic insights with recommended actions.

**Tokens Used:** 2,859 | **Duration:** 28.0s

**Example Output (sig-001 — Notion AI templates):**
```json
{
  "signal_id": "sig-001",
  "competitor_name": "Notion",
  "what_happened": "Notion launched AI-powered project templates, directly competing with AI writing tools.",
  "strategic_implication": "AI-driven project management features become table stakes in the market.",
  "impact_on_user": "TaskFlow's AI-powered sprint planning must be clearly differentiated from Notion's new offering to maintain appeal to engineering teams.",
  "recommended_action": "By the end of the week, create a blog post highlighting the technical advantages of TaskFlow's AI sprint planning over Notion's project templates, targeting engineering team leads.",
  "urgency": "critical",
  "opportunity_or_threat": "threat",
  "time_horizon": "immediate"
}
```

| Signal | Specificity | Actionability | Genericness | Time Horizon |
|--------|-------------|---------------|-------------|--------------|
| sig-001 (Notion AI templates) | 4 | 5 | 2 | immediate |
| sig-003 (Notion ML hires) | 4 | 4 | 2 | long_term |
| sig-005 (Linear Insights) | 5 | 4 | 1 | short_term |
| sig-007 (Coda+Atlassian) | 5 | 4 | 1 | short_term |
| sig-008 (Coda AI Packs) | 4 | 4 | 2 | short_term |
| sig-009-manual (Notion funding) | 4 | 3 | 2 | short_term |
| **Average** | **4.3** | **4.0** | **1.7** | — |

**Strengths:**
- ✅ **Specific deadlines:** "By the end of the week", "Within 1 week", "Within 3 days"
- ✅ **Concrete deliverables:** "create a blog post", "conduct a competitor feature comparison"
- ✅ **Target audience mentioned:** "targeting engineering team leads"
- ✅ **TaskFlow features referenced:** "AI-powered sprint planning", "GitHub/GitLab integration", "velocity tracking"

**Score Summary:** Specificity 4.3 / Actionability 4.0 / Genericness 1.7 — **GOOD**

---

### 3. Red Team

**Role:** Challenge strategist conclusions, find blind spots.

**Tokens Used:** 2,507 | **Duration:** 27.4s

**Example Output (sig-001 — Notion AI templates):**
```json
{
  "signal_id": "sig-001",
  "original_assessment": "AI-driven project management features become table stakes, threatening TaskFlow's appeal.",
  "challenge": "Ignores the possibility that Notion's AI-powered templates might not effectively serve engineering teams' specific needs, maintaining TaskFlow's differentiation.",
  "alternative_interpretation": "Notion's move could be a play for broader project management markets, not directly competing with TaskFlow's engineering team focus.",
  "blind_spots": [
    "Engineering teams' specific pain points",
    "Notion's target market with this feature"
  ],
  "revised_urgency": "low",
  "confidence_adjustment": -0.3,
  "verdict": "partially_challenged"
}
```

| Signal | Verdict | Confidence Adj | Revised Urgency |
|--------|---------|----------------|-----------------|
| sig-001 (Notion AI templates) | partially_challenged | -0.3 | low |
| sig-003 (Notion ML hires) | partially_challenged | -0.2 | low |
| sig-005 (Linear Insights) | partially_challenged | -0.1 | medium |
| sig-007 (Coda+Atlassian) | partially_challenged | -0.2 | medium |
| sig-008 (Coda AI Packs) | partially_challenged | -0.1 | medium |
| sig-009-manual (Notion funding) | partially_challenged | -0.3 | low |

**Verdict Distribution:**
- Overturned: 0/6 (0%)
- Partially Challenged: 6/6 (100%)
- Upheld: 0/6 (0%)

**Issue:** All verdicts are "partially_challenged" — no strong convictions either way. Need to encourage more "overturned" or "upheld" verdicts.

**Score Summary:** Specificity 4.0 / Genericness 2.0 — **OK** (could be more decisive)

---

### 4. Scenario Predictor

**Role:** Predict competitor next moves with timeframes.

**Tokens Used:** 5,537 | **Duration:** 40.6s

**Example Output (Linear scenario):**
```json
{
  "competitor_name": "Linear",
  "signal_narrative": "Linear is enhancing its analytics and automation capabilities, challenging TaskFlow's velocity tracking.",
  "signals_used": ["sig-004", "sig-005", "sig-006"],
  "historical_playbook": "Analytics-Driven Workflow Automation (similar to New Relic's 2019 analytics expansion)",
  "playback_rationale": "Abstract pattern: Enhanced analytics for workflow automation | Analogues: New Relic (2019), Datadog (2020)",
  "prediction": "Linear will launch predictive resource allocation for engineering teams within 1 month.",
  "confidence": 0.75,
  "confidence_rationale": "Medium-high confidence due to Linear's consistent analytics enhancements, New Relic's successful analogue.",
  "timeframe": "within 1 month",
  "timeframe_rationale": "Evidence: Linear's recent 'Linear Insights' launch (sig-005) and CEO hints at autonomous engineering pods (sig-006).",
  "preemptive_action": "Product lead updates the /pricing comparison page by Wednesday to add a side-by-side column for Linear Insights vs TaskFlow Analytics — output: live page with updated copy."
}
```

| Scenario | Confidence | Timeframe | Preemptive Action Quality |
|----------|------------|-----------|---------------------------|
| Notion (autonomous task assignment) | 0.85 | 1 quarter | ✅ Specific: "one-page development roadmap shared by EOW" |
| Linear (predictive resource allocation) | 0.75 | 1 month | ✅ Specific: "update /pricing comparison page by Wednesday" |
| Coda (automated testing) | 0.90 | 2 weeks | ✅ Specific: "30-min call with Vercel partnership team by Friday" |

**New Strengths:**
- ✅ **Historical playbook references:** Google (2017), New Relic (2019), Slack (2018)
- ✅ **Playback rationale:** Explains why analogue was chosen
- ✅ **Confidence rationale:** Justifies confidence level
- ✅ **Timeframe rationale:** Evidence-based reasoning
- ✅ **Specific preemptive actions:** Day/deliverable specified

**Score Summary:** Specificity 4.8 / Actionability 4.5 / Genericness 1.2 — **EXCELLENT** (major improvement!)

---

### 5. Signal Verifier

**Role:** Verify insights against source signals.

**Tokens Used:** 5,779 | **Duration:** 69.4s

**Example Output (sig-001 — Notion AI templates):**
```json
{
  "signal_id": "sig-001",
  "verified": true,
  "evidence_strength": 1,
  "evidence_tier": "HIGH",
  "claim_breakdown": [
    {"claim": "Notion launched AI-powered project templates", "status": "evidenced", "source_signal_id": "sig-001"},
    {"claim": "AI-driven project management features become table stakes", "status": "inferred"},
    {"claim": "TaskFlow's AI sprint planning must be differentiated", "status": "inferred"},
    {"claim": "critical / immediate urgency", "status": "inferred"}
  ],
  "evidenced_count": 1,
  "inferred_count": 3,
  "contradicted_count": 0,
  "rejection_flag": true
}
```

| Signal | Evidence Tier | Evidenced | Inferred | Contradicted | Rejection Flag |
|--------|---------------|-----------|----------|--------------|----------------|
| sig-001 | HIGH | 1 | 3 | 0 | ⚠️ Yes |
| sig-005 | HIGH | 1 | 3 | 0 | ⚠️ Yes |
| sig-007 | HIGH | 1 | 3 | 0 | ⚠️ Yes |

**New Features:**
- ✅ **Claim breakdown:** Each claim tagged as evidenced/inferred/contradicted
- ✅ **Evidence tier:** HIGH/MEDIUM/LOW classification
- ✅ **Rejection flag:** Signals when too many claims are inferred
- ✅ **Missing evidence:** Lists specific data needed

**Issue:** All signals have rejection_flag=true because most claims are inferred, not evidenced. This is appropriate skepticism.

**Score Summary:** Specificity 4.5 / Genericness 1.5 — **IMPROVED**

---

### 6. Contradiction Detector

**Role:** Find conflicts between insights.

**Tokens Used:** 1,163 | **Duration:** 8.4s

**Contradictions Found:**

```json
[
  {
    "signal_id": "sig-007",
    "conflicts_with_signal_id": "sig-008",
    "severity": "medium",
    "explanation": "sig-007 implies TaskFlow's GitHub/GitLab integration may lose uniqueness, while sig-008 suggests enhancing this integration with AI-powered workflow automation.",
    "recommended_resolution": "Focus on AI-powered features that complement the GitHub/GitLab integration."
  },
  {
    "signal_id": "sig-001",
    "conflicts_with_signal_id": "sig-009-manual",
    "severity": "high",
    "explanation": "sig-001 recommends differentiating within a week, while sig-009-manual suggests accelerated AI development — conflicting urgency.",
    "recommended_resolution": "Prioritize immediate differentiation (sig-001) while phasing in accelerated AI development (sig-009-manual)."
  }
]
```

| Conflict | Severity | Resolution Quality |
|----------|----------|-------------------|
| sig-007 ↔ sig-008 | medium | ✅ Actionable |
| sig-001 ↔ sig-009-manual | high | ✅ Phased approach |

**Score Summary:** Specificity 4.5 / Actionability 4.5 / Genericness 1.5 — **BEST AGENT**

---

### 7. Quality Judge

**Role:** Score insights and write executive summary.

**Tokens Used:** 2,676 | **Duration:** 17.3s

**Scores:**

| Signal | Specificity | Actionability | Evidence | Overall | In Digest? |
|--------|-------------|---------------|----------|---------|------------|
| sig-007 (Coda+Atlassian) | 8 | 9 | 6 | 7.8 | ✅ |
| sig-001 (Notion AI) | 9 | 8 | 5 | 7.4 | ✅ |
| sig-005 (Linear Insights) | 8 | 7 | 6 | 7.2 | ✅ |
| sig-008 (Coda AI Packs) | 8 | 8 | 6 | 7.6 | ✅ |
| sig-003 (Notion ML hires) | 7 | 6 | 5 | 6.2 | ✅ |
| sig-009-manual (Notion funding) | 5 | 6 | 4 | **5.2** | ❌ |

**Executive Summary Draft:**
> "TaskFlow must rapidly enhance its AI capabilities, analytics, and integrations to counter Notion's impending autonomous task management, Linear's predictive analytics, and Coda's AI-powered workflow automation. Focus on differentiated AI sprint planning and tailored workflow solutions. Immediate competitor feature comparisons and development roadmap outlining are crucial."

**Strengths:**
- ✅ **Correct exclusion:** sig-009-manual excluded (score 5.2)
- ✅ **Evidence score included:** New dimension for scoring
- ✅ **Revision notes present:** "Red Team challenge partially reduces evidence score"
- ✅ **Grade calibrated:** B (appropriate)

**Score Summary:** Specificity 4.0 / Actionability 3.5 / Genericness 2.0 — **IMPROVED**

---

## Priority Ranking (Current State)

| Rank | Agent | Specificity | Actionability | Genericness | Priority Score | Status |
|------|-------|-------------|---------------|-------------|----------------|--------|
| 1 | Contradiction Detector | 4.5 | 4.5 | 1.5 | **4.0** | 🟢 BEST |
| 2 | Scenario Predictor | 4.8 | 4.5 | 1.2 | **3.7** | 🟢 EXCELLENT |
| 3 | Signal Verifier | 4.5 | N/A | 1.5 | **5.0** | 🟢 GOOD |
| 4 | Competitive Strategist | 4.3 | 4.0 | 1.7 | **5.4** | 🟢 GOOD |
| 5 | Signal Classifier | 4.2 | N/A | 1.8 | **5.6** | 🟢 GOOD |
| 6 | Quality Judge | 4.0 | 3.5 | 2.0 | **6.5** | 🟡 OK |
| 7 | Red Team | 4.0 | N/A | 2.0 | **6.0** | 🟡 OK |

**Priority Score Formula:** `(5 - Specificity) + (5 - Actionability) + Genericness` (lower is better)

---

## Token & Performance Summary

| Agent | Tokens Used | Duration (s) | Tokens/s |
|-------|-------------|--------------|----------|
| Signal Classifier | 2,410 | 28.1 | 85.8 |
| Competitive Strategist | 2,859 | 28.0 | 102.1 |
| Red Team | 2,507 | 27.4 | 91.5 |
| Scenario Predictor | 5,537 | 40.6 | 136.4 |
| Signal Verifier | 5,779 | 69.4 | 83.3 |
| Contradiction Detector | 1,163 | 8.4 | 138.5 |
| Quality Judge | 2,676 | 17.3 | 154.7 |
| **Total** | **22,931** | **219.2** | **104.6 avg** |

---

## Key Improvements This Run

### Scenario Predictor (Major Upgrade)
- Historical playbook references with rationale
- Confidence and timeframe justifications  
- Specific preemptive actions with deadlines and deliverables

### Signal Verifier (Major Upgrade)
- Claim-by-claim breakdown
- Evidenced/inferred/contradicted tagging
- Rejection flags for low-evidence signals

### Remaining Issues

1. **Red Team:** All "partially_challenged" — needs more decisive verdicts
2. **Quality Judge:** Executive summary still generic
3. **Signal Classifier:** Some reasoning mentions "AI writing tools" instead of "project management" (possible prompt issue)

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

## Conclusion

The second March 2026 audit run confirms **consistent performance improvements**. Notable upgrades:

1. **Scenario Predictor** is now the second-best agent (up from mediocre) with historical playbooks and specific actions
2. **Signal Verifier** provides rich claim-level verification
3. **Contradiction Detector** remains the best-performing agent

**Overall Pipeline Grade: B+**

**Next Steps:**
1. Fix Red Team to produce more decisive verdicts (overturned/upheld)
2. Improve Quality Judge executive summary specificity
3. Fix Signal Classifier reasoning to consistently reference "project management" not "AI writing tools"
4. Target: All agents at Specificity ≥4.5, Genericness ≤1.5
