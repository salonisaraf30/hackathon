# CompetitorPulse — Tech Stack & Architecture

## Overview

CompetitorPulse is an AI-powered competitive intelligence platform that monitors competitor websites, extracts strategic signals using Claude Sonnet 4, and generates weekly intelligence digests via a 7-agent pipeline powered by NVIDIA Nemotron 70B.

---

## Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 16** (App Router) | React framework — server-side rendering, static generation, API routes |
| **TypeScript** | Type safety across the entire codebase |
| **Tailwind CSS** | Utility-first styling — dark terminal aesthetic with 3-color palette (`#00FF41`, `#FF00FF`, `#00FFFF`) |
| **shadcn/ui** (Radix UI) | Accessible, composable UI primitives — buttons, dialogs, cards, checkboxes, dropdowns |
| **Recharts** | Data visualization — signal trend charts, threat score gauges on the dashboard |
| **Three.js (WebGL)** | Animated cybernetic grid background shader on the landing page |
| **Space Mono + IBM Plex Mono** | Monospaced terminal-style fonts loaded via `next/font/google` |

---

## Backend & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Supabase (PostgreSQL)** | Database — stores users, competitors, signals, snapshots, digests |
| **Supabase Auth** (`@supabase/ssr`) | Email/password authentication with cookie-based server-side sessions |
| **Vercel** | Hosting — serverless API routes, edge deployment, automatic CI/CD |
| **Vercel Cron** | Scheduled ingestion jobs (configured in `vercel.json`) |

### Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profile metadata |
| `user_products` | User's startup info (name, description, positioning) — set during onboarding |
| `competitors` | Tracked competitors with name, URL, threat score, category |
| `signals` | Extracted competitive signals (type, title, summary, importance score) |
| `website_snapshots` | Raw scraped content + content hash for diff detection |
| `digests` | Generated intelligence reports (weekly briefs) |
| `digest_signals` | Junction table linking digests to their source signals |

---

## AI Models

### 1. Claude Sonnet 4 (Anthropic) — Signal Extraction

| Property | Value |
|----------|-------|
| **Provider** | Anthropic (`api.anthropic.com`) |
| **SDK** | `@anthropic-ai/sdk` |
| **Model** | `claude-sonnet-4-20250514` |
| **Temperature** | 0.2 (low creativity, high consistency) |
| **Max tokens** | 1,024 |
| **Env variable** | `ANTHROPIC_API_KEY` |

**Used in**: `lib/ingestion/signal-extractor.ts`

**What it does**:
- Receives 2,000 chars of old website content + 2,000 chars of new content
- Analyzes changes and extracts competitive signals
- Returns a JSON array of signals, each containing:
  - `signal_type` — one of: `product_launch`, `pricing_change`, `hiring`, `funding`, `feature_update`, `content_published`, `partnership`, `social_post`
  - `title` — short headline (under 15 words)
  - `summary` — 2-3 sentence explanation
  - `importance_score` — 1 to 10

**Example output**:
```json
[
  {
    "signal_type": "feature_update",
    "title": "Cursor Launches AI Agents for Autonomous Code Development",
    "summary": "Cursor has introduced an agent mode that allows AI to autonomously write entire features. This represents a significant expansion of their AI capabilities.",
    "importance_score": 8
  }
]
```

---

### 2. NVIDIA Nemotron 70B (via OpenRouter) — Multi-Agent Digest Pipeline

| Property | Value |
|----------|-------|
| **Provider** | OpenRouter (`openrouter.ai/api/v1`) |
| **Model** | `nvidia/llama-3.1-nemotron-70b-instruct` |
| **Temperature** | Varies per agent (0.3–0.7) |
| **Env variable** | `OPENROUTER_API_KEY` |

**Used in**: `lib/intelligence/nemotron-client.ts` → `lib/intelligence/pipeline.ts`

**What it does**: Runs a sequential **7-agent pipeline** that transforms raw signals into a structured weekly intelligence digest.

#### The 7 Agents

Each agent is defined in `lib/intelligence/agents/` and runs sequentially, with each agent receiving the output of all previous agents as context.

| # | Agent | Input | Output | Temperature |
|---|-------|-------|--------|-------------|
| 1 | **Signal Analyst** | Raw signals from DB | Clustered themes, patterns, trend analysis | 0.3 |
| 2 | **Threat Assessor** | Signals + analysis | Threat scores (0-100) per competitor, top threats | 0.3 |
| 3 | **Opportunity Finder** | Signals + analysis + threats | Market gaps, competitor weaknesses, opportunities | 0.5 |
| 4 | **Strategic Advisor** | All above | Recommended actions with timelines and priorities | 0.5 |
| 5 | **Fact Checker** | All above | Verification notes, flags unsupported claims | 0.2 |
| 6 | **Consistency Checker** | All above | Contradiction detection between agent outputs | 0.2 |
| 7 | **Report Compiler** | All above | Final structured digest (JSON) | 0.4 |

#### Pipeline execution flow:
```
Signals from DB
  → Agent 1: Signal Analyst (clusters & patterns)
  → Agent 2: Threat Assessor (threat scores)
  → Agent 3: Opportunity Finder (gaps & weaknesses)
  → Agent 4: Strategic Advisor (action items)
  → Agent 5: Fact Checker (verification)
  → Agent 6: Consistency Checker (contradiction detection)
  → Agent 7: Report Compiler (final digest JSON)
  → Store in Supabase digests table
```

---

## Web Scraping Pipeline

| Technology | Purpose |
|------------|---------|
| **Node fetch** | HTTP client — fetches raw HTML from competitor URLs |
| **Cheerio** | HTML parser — strips boilerplate, extracts visible text |
| **crypto (MD5)** | Content hashing — detects changes between scrapes |

### Scraping flow (`lib/ingestion/website-monitor.ts`):

```
1. fetch(competitor_url)
   → Raw HTML response

2. Cheerio processing:
   → Remove: <nav>, <footer>, <header>, <script>, <style>,
     <noscript>, <iframe>, <svg>, [role='navigation'],
     [role='banner'], [role='contentinfo']
   → Extract: $("body").text() → collapsed whitespace

3. MD5 hash of cleaned text

4. Store snapshot in website_snapshots table
   (raw_content capped at 50,000 chars)

5. Compare hash with previous snapshot:
   → Same hash = no change → return []
   → Different hash = content changed → continue

6. Send to Claude Sonnet 4:
   → First 2,000 chars of old content
   → First 2,000 chars of new content
   → Extract signals

7. Store signals in signals table
8. Update competitors.last_scraped_at
```

### Limitation
Cheerio parses **raw HTML only** — it does not execute JavaScript. Single-page apps (React, Angular) that render content client-side will return near-empty text and produce 0 signals. Static/SSR sites work well.

---

## API Routes

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/auth/post-login` | GET | Check if user needs onboarding or dashboard | Session cookie |
| `/api/onboarding` | POST | Save startup info, competitors, goals | Session cookie |
| `/api/ingest` | POST | Trigger web scraping for one or all competitors | Session cookie or `CRON_SECRET` |
| `/api/competitors` | GET/POST/DELETE | CRUD for tracked competitors | Session cookie |
| `/api/signals` | GET | Fetch signals for dashboard display | Session cookie |
| `/api/digests/generate` | POST | Run 7-agent pipeline → generate weekly digest | Session cookie |
| `/api/digests` | GET | Fetch stored digests | Session cookie |

---

## Environment Variables

| Variable | Service | Required |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Claude Sonnet 4 (signal extraction) | Yes |
| `OPENROUTER_API_KEY` | NVIDIA Nemotron 70B via OpenRouter (digest pipeline) | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public/anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-side only) | Yes |
| `CRON_SECRET` | Auth token for automated cron ingestion | Optional |

---

## End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                      USER ONBOARDING                     │
│  Startup name → Competitors → Goals → Save to Supabase  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    WEB SCRAPING                           │
│  For each competitor:                                    │
│    fetch(url) → Cheerio parse → MD5 hash → Store snapshot│
│    If content changed → Claude Sonnet 4 → Extract signals│
│    Store signals in Supabase                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              7-AGENT DIGEST PIPELINE                     │
│  Nemotron 70B via OpenRouter                             │
│                                                          │
│  Signals → Analyst → Threat Assessor → Opportunity       │
│  Finder → Strategic Advisor → Fact Checker →             │
│  Consistency Checker → Report Compiler → Final Digest    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     DASHBOARD                            │
│  /dashboard  — Overview, charts, threat scores           │
│  /competitors — Competitor cards with signals             │
│  /signals    — All signals feed                          │
│  /digest     — Weekly intelligence brief                 │
└─────────────────────────────────────────────────────────┘
```

---

Built at **NYU Buildathon 2025** by **Saloni Saraf**, **Shreyam Borah**, **Tansin Taj**, and **Chiraj Dhiwar**.
