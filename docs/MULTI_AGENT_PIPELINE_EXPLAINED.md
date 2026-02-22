# Multi-Agent Intelligence Pipeline: End-to-End Explanation

This document explains how your current intelligence pipeline works in production:
- where data comes from,
- how Nemotron is called,
- how the five agents collaborate,
- what is stored in Supabase,
- what the UI/API finally returns.

## 1) Current Architecture (Implemented)

Raw competitor signals (Supabase) flow through a multi-agent pipeline:

1. Agent 1: signal-classifier
2. Agent 2: competitive-strategist
3. Agent 3: red-team
4. Agent 4: scenario-predictor
5. Agent 5: quality-judge

Final output is a digest with:
- executive summary,
- vetted insights,
- strategic outlook (forward scenarios + your strategy next),
- pipeline metadata (quality and selection metrics).

Nia usage is currently preserved in code but commented out in active digest/ingestion paths.

## 2) Data Entry and Signal Creation

### 2.1 Onboarding writes product + competitors
- Route: [app/api/onboarding/route.ts](../app/api/onboarding/route.ts)
- Writes/updates:
  - profiles,
  - user_products,
  - competitors.

During onboarding, competitor URLs are normalized and inserted. Newly inserted competitors are crawled immediately.

### 2.2 Ingestion and crawl
- Routes/functions:
  - [app/api/ingest/route.ts](../app/api/ingest/route.ts)
  - [lib/ingestion/run-ingestion.ts](../lib/ingestion/run-ingestion.ts)
  - [lib/ingestion/website-monitor.ts](../lib/ingestion/website-monitor.ts)

Process:
1. Fetch competitor webpage HTML.
2. Clean noisy DOM sections.
3. Hash content and store snapshot in website_snapshots.
4. If content changed (or first useful run), extract signals from content diff.
5. Insert extracted rows into signals.

### 2.3 Signal extraction model
- File: [lib/ingestion/signal-extractor.ts](../lib/ingestion/signal-extractor.ts)
- Uses Anthropic Claude Sonnet for change interpretation.
- Output shape per signal:
  - signal_type,
  - title,
  - summary,
  - importance_score.

So the multi-agent digest pipeline consumes already-structured signals from Supabase.

## 3) Digest Generation Pipeline

### 3.1 Digest entrypoint
- File: [lib/intelligence/digest-generator.ts](../lib/intelligence/digest-generator.ts)

What it does:
1. Loads user product context from user_products.
2. Loads user competitors.
3. Loads recent signals (last 7 days) from signals table.
4. Maps rows to normalized RawSignal input.
5. Calls runIntelligencePipeline(...).
6. Adds a date-range title.

### 3.2 Pipeline orchestrator
- File: [lib/intelligence/pipeline.ts](../lib/intelligence/pipeline.ts)

It executes agents in strict order:

1) Signal Classifier
- File: [lib/intelligence/agents/signal-classifier.ts](../lib/intelligence/agents/signal-classifier.ts)
- Input: product + raw signals
- Output: classified_signals with normalized_type, confidence, reasoning

2) Competitive Strategist
- File: [lib/intelligence/agents/competitive-strategist.ts](../lib/intelligence/agents/competitive-strategist.ts)
- Input: product + raw + classified
- Output: executive_summary + actionable insights

3) Red Team Challenger
- File: [lib/intelligence/agents/red-team.ts](../lib/intelligence/agents/red-team.ts)
- Input: strategist insights
- Output: challenged_insights with revised_action and assumption challenge

4) Scenario Predictor
- File: [lib/intelligence/agents/scenario-predictor.ts](../lib/intelligence/agents/scenario-predictor.ts)
- Input: product + challenged insights
- Output: future predictions with probability + leading indicators

5) Quality Judge
- File: [lib/intelligence/agents/quality-judge.ts](../lib/intelligence/agents/quality-judge.ts)
- Input: challenged insights
- Output: scored insights with keep/drop and overall quality score

Final assembly:
- Keeps only high-quality insights (or all if none marked keep).
- Builds strategic_outlook with:
  - Forward scenarios,
  - Your strategy next (top recommended actions).
- Produces pipeline_meta:
  - agents,
  - quality_score,
  - accepted_insights,
  - rejected_insights,
  - predictions_generated,
  - selected_signal_ids.

## 4) Nemotron Details

### 4.1 Where Nemotron is called
- File: [lib/intelligence/nemotron-client.ts](../lib/intelligence/nemotron-client.ts)
- Transport: OpenRouter Chat Completions endpoint
- Model: nvidia/llama-3.1-nemotron-70b-instruct

### 4.2 How it receives data
Each agent builds a JSON-structured prompt from upstream artifacts and sends it through callNemotronJson(...).

Nemotron input is not raw DB SQL rows directly from route code; it is curated per stage:
- signal classifier gets raw signals + product context,
- strategist gets classified + raw,
- red-team gets strategist insights,
- predictor gets challenged insights,
- judge gets challenged insights.

### 4.3 Output parsing and safety
nemotron-client does:
1. request JSON output format,
2. extract first JSON object from text,
3. parse JSON,
4. fallback to deterministic defaults when parsing/network fails.

So failures degrade gracefully instead of crashing your digest pipeline.

## 5) API Route and DB Writes

### 5.1 Generate route
- File: [app/api/digests/generate/route.ts](../app/api/digests/generate/route.ts)

Flow:
1. Validate user auth with server client.
2. Generate digest via multi-agent pipeline.
3. Store digest row in digests table.
4. Link digest_signals using pipeline_meta.selected_signal_ids.
5. Return digest + generation metadata.

Why this matters:
- digest_signals now represent quality-selected, pipeline-vetted evidence,
  not just all recent signals.

### 5.2 Read route
- File: [app/api/digests/route.ts](../app/api/digests/route.ts)
- Returns digests plus linked digest_signals + signal details.

## 6) What the UI Shows

### Digest page
- File: [app/digest/page.tsx](../app/digest/page.tsx)

Displays:
- Executive Summary,
- Key Insights,
- Strategic Outlook,
- Source signals linked to digest,
- Pipeline Health block with:
  - quality score,
  - accepted/rejected insight counts,
  - prediction count,
  - linked signal count,
  - full agent chain.

This is the primary place where multi-agent quality is reflected for end users.

## 7) Final Output Contract (Conceptual)

Digest output contains:
- title
- executive_summary
- insights[]
  - competitor
  - signal_type
  - what_happened
  - why_it_matters
  - recommended_action
  - urgency
- strategic_outlook
  - forward competitor scenarios
  - your strategy next actions
- pipeline_meta
  - agents
  - quality_score
  - accepted_insights
  - rejected_insights
  - predictions_generated
  - selected_signal_ids

## 8) Why Results May Be Empty (and What to Check)

1. No recent signals in last 7 days
- Check signals table records and detected_at timestamps.

2. Crawl succeeded but no meaningful diff
- website-monitor skips insertion when content hash unchanged.

3. Signal extraction model unavailable
- Ensure ANTHROPIC_API_KEY is valid.

4. Nemotron/API issue
- Ensure OPENROUTER_API_KEY is valid.
- Fallback logic may reduce output quality but should still return structured response.

5. Digest links empty
- Verify pipeline_meta.selected_signal_ids is non-empty.
- Route links only selected IDs, by design.

## 9) Nia Status in This Build

- Nia file remains present: [lib/intelligence/nia-client.ts](../lib/intelligence/nia-client.ts)
- Active usage in digest/ingestion is commented out (not deleted), per your requested migration strategy.

## 10) Practical “How to Verify It’s Working” Checklist

1. Add/update competitor URL and run ingestion.
2. Confirm new rows appear in signals.
3. Trigger digest generation.
4. Confirm:
   - new digests row,
   - digest_signals rows linked,
   - strategic_insights JSON contains pipeline_meta.
5. Open Digest UI and confirm Pipeline Health values and source signals are visible.

---

If you want, the next step is adding a debug API endpoint that returns each intermediate agent artifact (classifier output, strategist output, red-team output, etc.) for a specific digest run.
