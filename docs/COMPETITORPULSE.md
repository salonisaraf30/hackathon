# CompetitorPulse — Project Documentation

## Overview

**CompetitorPulse** is an AI-powered competitive intelligence platform that automatically monitors competitor websites, extracts strategic signals, and generates analyst-grade intelligence briefs using a multi-agent AI pipeline. Built for startup founders who need to track their competitive landscape without manual effort.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Full-stack React framework with server components and API routes |
| **Language** | TypeScript | End-to-end type safety |
| **Auth** | Supabase Auth + `@supabase/ssr` | Email/password and Google OAuth authentication |
| **Database** | Supabase (PostgreSQL) | User data, competitors, signals, digests, website snapshots |
| **Web Scraping** | Cheerio + native `fetch` | HTML parsing and competitor website monitoring |
| **Signal Extraction** | Claude Sonnet (Anthropic SDK) | Diff-based signal extraction from website content changes |
| **Multi-Agent Pipeline** | NVIDIA Nemotron 70B via OpenRouter | 7-agent intelligence pipeline for strategic analysis |
| **Styling** | Tailwind CSS + Radix UI (shadcn/ui) | Terminal-aesthetic dark UI with glassmorphism |
| **Charts** | Recharts | Radar, Line, Pie, and Bar charts for data visualization |
| **3D Background** | Three.js (WebGL) | Cybernetic grid shader background |
| **Fonts** | Space Mono + IBM Plex Mono | Monospace terminal aesthetic |
| **Deployment** | Vercel | Serverless deployment with edge functions |

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | Yes | Claude API for signal extraction |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API for Nemotron pipeline |
| `OPENROUTER_MODEL` | No | Override model (default: `nvidia/llama-3.1-nemotron-70b-instruct`) |
| `CRON_SECRET` | No | Bearer token for automated ingestion cron jobs |

---

## Database Schema (Supabase / PostgreSQL)

| Table | Purpose |
|---|---|
| `profiles` | User profiles (id, email) |
| `user_products` | User's startup info — name, description, positioning, target_market, key_features |
| `competitors` | Tracked competitors — name, website_url, twitter_handle, description, last_scraped_at |
| `signals` | Extracted competitive signals — signal_type, title, summary, importance_score, source |
| `website_snapshots` | Raw scraped content + content_hash for diff detection |
| `digests` | Generated intelligence briefs — executive_summary, strategic_insights (JSON), period |
| `digest_signals` | Many-to-many relationship linking signals to digests |

---

## Complete Workflow

### Phase 1: User Onboarding

```
User signs up → /auth/sign-up
         │
         ▼
  Supabase Auth (email/password or Google OAuth)
         │
         ▼
  /auth/callback (exchanges code for session)
         │
         ▼
  /api/auth/post-login (checks user_products table)
         │
    ┌────┴────┐
    ▼         ▼
 Has product  No product
    │         │
    ▼         ▼
 /dashboard   /onboarding
```

**Onboarding Steps:**
1. **Startup Name** + one-line description
2. **Stage** — "Just an idea", "Building the MVP", "Live, pre-revenue", "Making money"
3. **Target Audience** — Founders, Developers, Designers, Enterprises, Consumers, Students
4. **Add Competitors** — name + website URL for each
5. **Goal** — Brand awareness, Lead gen, Attract investors, Understand market
6. **Launch** → triggers the full pipeline

**What happens on submit (`POST /api/onboarding`):**
1. Upserts `profiles` row
2. Upserts `user_products` row with positioning = `description | stage | goal`
3. Inserts competitor rows into `competitors` table
4. For each new competitor with a URL: triggers `monitorWebsite()` (initial scrape)
5. Client then calls `POST /api/ingest` → runs full ingestion
6. Client then calls `POST /api/digests/generate` → runs multi-agent pipeline
7. Redirects to `/dashboard`

---

### Phase 2: Web Scraping & Signal Extraction

**Tech:** `fetch` + `Cheerio` (HTML parser) + `Claude Sonnet` (Anthropic)

```
POST /api/ingest
      │
      ▼
┌─────────────────────────────────┐
│  run-ingestion.ts               │
│  Fetches all competitors with   │
│  website_url from Supabase      │
└──────────────┬──────────────────┘
               │ for each competitor
               ▼
┌─────────────────────────────────┐
│  website-monitor.ts             │
│                                 │
│  1. fetch(url) with User-Agent  │
│  2. cheerio.load(html)          │
│  3. Strip nav/footer/scripts    │
│  4. Extract body text content   │
│  5. MD5 hash the content        │
│  6. Fetch last snapshot from DB │
│  7. Store new snapshot          │
│  8. Compare hashes:             │
│     Same → no changes, return   │
│     Different → extract signals │
└──────────────┬──────────────────┘
               │ if content changed
               ▼
┌─────────────────────────────────┐
│  signal-extractor.ts            │
│                                 │
│  LLM: Claude Sonnet 4           │
│  (Anthropic API)                │
│                                 │
│  Prompt:                        │
│  - Old content (2000 chars)     │
│  - New content (2000 chars)     │
│  - Extract signal_type, title,  │
│    summary, importance_score    │
│                                 │
│  Signal types:                  │
│  product_launch, pricing_change │
│  hiring, funding, feature_update│
│  content_published, partnership │
│  social_post                    │
│                                 │
│  Output: JSON array             │
│  Sanitized + validated          │
└──────────────┬──────────────────┘
               │
               ▼
  Signals stored in `signals` table
```

**Key details:**
- Content is hashed (MD5) to detect changes — if hash matches previous snapshot, no LLM call is made
- Cheerio strips nav, footer, header, script, style, noscript, iframe, SVG to get clean body text
- Signals are sanitized: type validated against allowlist, importance clamped to 1-10, empty title/summary filtered out
- Each signal includes: `competitor_id`, `source: "website"`, `signal_type`, `title`, `summary`, `importance_score`, `raw_content`

---

### Phase 3: Multi-Agent Intelligence Pipeline (Nemotron)

**Tech:** NVIDIA Nemotron 70B (via OpenRouter API) — 7 specialized AI agents

```
POST /api/digests/generate
            │
            ▼
┌───────────────────────────────────────┐
│  digest-generator.ts                  │
│                                       │
│  1. Fetch user_products (positioning) │
│  2. Fetch signals (last 7 days)       │
│  3. Transform to RawSignal format     │
│  4. Run multi-agent pipeline ──────────┼──►  pipeline.ts
│  5. Store digest in Supabase          │
│  6. Link signals via digest_signals   │
└───────────────────────────────────────┘
```

#### The 7-Agent Pipeline (`pipeline.ts`)

```
Raw Signals + User Product
            │
            ▼
  ┌─────────────────────┐
  │  STAGE 1             │
  │  Signal Classifier   │  Nemotron 70B  |  temp: 0.3
  │  ─────────────────── │
  │  Categorizes each    │
  │  signal into:        │
  │  • offensive_move    │
  │  • defensive_move    │
  │  • market_expansion  │
  │  • internal_shift    │
  │  • ecosystem_play    │
  │  + confidence score  │
  │  + strategic weight  │
  │  + velocity          │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  STAGE 2             │
  │  Competitive         │  Nemotron 70B  |  temp: 0.3
  │  Strategist          │
  │  ─────────────────── │
  │  For each signal:    │
  │  • what_happened     │
  │  • strategic impact  │
  │  • impact on USER    │
  │  • recommended_action│
  │  • urgency level     │
  │  • threat or chance  │
  │  • time_horizon      │
  └──────────┬──────────┘
             │
             ▼
  ┌──────────┴──────────────────────────────────────┐
  │         STAGES 3-6 (RUN IN PARALLEL)            │
  │                                                  │
  │  ┌──────────────┐  ┌─────────────────┐          │
  │  │ Red Team      │  │ Scenario        │          │
  │  │ Agent         │  │ Predictor       │          │
  │  │               │  │                 │          │
  │  │ Nemotron 70B  │  │ Nemotron 70B    │          │
  │  │ temp: 0.6     │  │ temp: 0.3       │          │
  │  │               │  │                 │          │
  │  │ Challenges    │  │ Predicts future │          │
  │  │ each insight  │  │ competitor      │          │
  │  │ • counter-    │  │ moves:          │          │
  │  │   arguments   │  │ • predictions   │          │
  │  │ • blind spots │  │ • confidence    │          │
  │  │ • alternative │  │ • evidence      │          │
  │  │   interpret.  │  │ • preemptive    │          │
  │  │ • verdict:    │  │   actions       │          │
  │  │   upheld /    │  │ • wildcards     │          │
  │  │   challenged /│  │ • market        │          │
  │  │   overturned  │  │   direction     │          │
  │  └──────┬───────┘  └────────┬────────┘          │
  │         │                   │                    │
  │  ┌──────┴───────┐  ┌───────┴─────────┐          │
  │  │ Signal       │  │ Contradiction   │          │
  │  │ Verifier     │  │ Detector        │          │
  │  │              │  │                 │          │
  │  │ Nemotron 70B │  │ Nemotron 70B    │          │
  │  │ temp: 0.1    │  │ temp: 0.15      │          │
  │  │              │  │                 │          │
  │  │ Checks if    │  │ Finds conflicts │          │
  │  │ insights are │  │ between         │          │
  │  │ grounded in  │  │ insights:       │          │
  │  │ actual data: │  │ • severity      │          │
  │  │ • verified   │  │ • explanation   │          │
  │  │ • evidence   │  │ • recommended   │          │
  │  │   strength   │  │   resolution    │          │
  │  │ • missing    │  │                 │          │
  │  │   evidence   │  │                 │          │
  │  └──────┬───────┘  └────────┬────────┘          │
  └─────────┴───────────────────┴───────────────────┘
             │
             ▼
  ┌─────────────────────┐
  │  STAGE 7             │
  │  Quality Judge       │  Nemotron 70B  |  temp: 0.3
  │  ─────────────────── │
  │  Final quality gate: │
  │  • Specificity score │
  │  • Actionability     │
  │  • Evidence score    │
  │  • Overall score     │
  │  • Include in digest?│
  │  • Executive summary │
  │  • Quality grade A-D │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │  FINAL ASSEMBLY      │
  │  ─────────────────── │
  │  • Filter insights   │
  │    that passed gate  │
  │  • Remove unverified │
  │  • Penalty if high   │
  │    contradiction     │
  │  • Sort by quality   │
  │  • Package digest    │
  └─────────────────────┘
```

#### Nemotron Client Details

| Setting | Value |
|---|---|
| **Model** | `nvidia/llama-3.1-nemotron-70b-instruct` (configurable via `OPENROUTER_MODEL`) |
| **Provider** | OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) |
| **Default Temperature** | 0.3 (analytical) — varies by agent |
| **Max Tokens** | 2048 per call |
| **JSON Mode** | Appends "CRITICAL: Respond ONLY with valid JSON" instruction |
| **Token Tracking** | Per-agent session usage tracked for cost monitoring |
| **Tracing** | Every LLM call logged to `logs/multiagent-trace.jsonl` with call_id, duration, tokens |

#### Final Digest Output (stored in Supabase `digests` table)

```json
{
  "executive_summary": "...",
  "strategic_insights": {
    "user_context": {
      "product_name": "...",
      "positioning": "...",
      "target_market": "...",
      "key_features": ["..."],
      "description": "..."
    },
    "insights": [
      {
        "signal_id": "...",
        "competitor_name": "...",
        "what_happened": "...",
        "strategic_implication": "...",
        "impact_on_user": "...",
        "recommended_action": "...",
        "urgency": "high|medium|low",
        "red_team_note": "...",
        "verification_note": "...",
        "consistency_note": "...",
        "quality_score": 8
      }
    ],
    "scenarios": {
      "market_direction": "...",
      "predictions": [...],
      "wildcards": [...]
    },
    "quality_grade": "A"
  }
}
```

---

### Phase 4: Dashboard Rendering

The frontend reads all data from Supabase and renders it across these pages:

| Page | Route | What it Shows |
|---|---|---|
| **Dashboard** | `/dashboard` | Stats bar, competitor roster, latest digest CTA, live signal feed, threat radar |
| **Competitors** | `/competitors` | All tracked competitors with threat level, signal count, search + filter |
| **Competitor Detail** | `/competitors/[id]` | Full profile, signal history, radar chart (competitor vs your product), settings |
| **Signals** | `/signals` | Complete signal feed with competitor toggles, type filters, importance scores, stats sidebar |
| **Digest** | `/digest` | Intelligence briefs — executive summary, key insights with urgency, forward scenarios, source signals |
| **Settings** | `/settings` | Profile, notification preferences, auto-ingest toggle, danger zone |

---

## API Routes Summary

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/auth/post-login` | GET | Determines redirect (onboarding vs dashboard) | Cookie |
| `/auth/callback` | GET | Exchanges OAuth/email code for session | None (code-based) |
| `/api/onboarding` | POST | Saves startup profile + competitors + triggers initial scrape | Cookie |
| `/api/competitors` | GET | List all competitors with signal counts | Cookie |
| `/api/competitors` | POST | Add new competitor + trigger initial scrape | Cookie |
| `/api/ingest` | POST | Trigger web scraping for one or all competitors | Cookie or CRON_SECRET |
| `/api/signals` | GET | Fetch signals (filterable by competitor, type, date) | Cookie |
| `/api/digests` | GET | Fetch generated intelligence digests | Cookie |
| `/api/digests/generate` | POST | Run the full 7-agent Nemotron pipeline | Cookie |

---

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout (fonts, DashboardShell)
├── globals.css                 # Terminal aesthetic, glassmorphism, scanlines
├── auth/
│   ├── callback/route.ts       # OAuth/email code exchange
│   ├── confirm/route.ts        # Email OTP verification
│   ├── login/page.tsx          # Login page
│   ├── sign-up/page.tsx        # Sign-up page
│   ├── sign-up-success/page.tsx
│   ├── forgot-password/page.tsx
│   ├── update-password/page.tsx
│   └── error/page.tsx
├── onboarding/page.tsx         # 6-step onboarding wizard
├── dashboard/page.tsx          # Main dashboard
├── competitors/
│   ├── page.tsx                # Competitor list
│   └── [id]/page.tsx           # Competitor detail
├── signals/page.tsx            # Signal feed
├── digest/page.tsx             # Intelligence briefs
├── settings/page.tsx           # User settings
└── api/
    ├── auth/post-login/        # Post-login routing
    ├── competitors/            # CRUD competitors
    ├── signals/                # Read signals
    ├── digests/                # Read digests
    ├── digests/generate/       # Trigger pipeline
    ├── ingest/                 # Trigger scraping
    └── onboarding/             # Save onboarding data

lib/
├── supabase/
│   ├── client.ts               # Browser Supabase client
│   ├── server.ts               # Server Supabase client (cookie-based)
│   ├── admin.ts                # Admin client (service role, bypasses RLS)
│   └── types.ts                # Database types
├── ingestion/
│   ├── run-ingestion.ts        # Orchestrates scraping for all competitors
│   ├── website-monitor.ts      # Cheerio-based scraper + diff detection
│   ├── signal-extractor.ts     # Claude Sonnet signal extraction
│   └── twitter-monitor.ts      # (placeholder)
└── intelligence/
    ├── nemotron-client.ts      # OpenRouter API client for Nemotron 70B
    ├── pipeline.ts             # 7-agent orchestration pipeline
    ├── digest-generator.ts     # Fetches data + runs pipeline + stores digest
    ├── trace-logger.ts         # JSONL trace logging
    ├── trace-context.ts        # AsyncLocalStorage request context
    └── agents/
        ├── signal-classifier.ts       # Agent 1: Categorize signals
        ├── competitive-strategist.ts  # Agent 2: Strategic insights
        ├── red-team.ts                # Agent 3: Challenge insights
        ├── scenario-predictor.ts      # Agent 4: Predict future moves
        ├── signal-verifier.ts         # Agent 5: Evidence checking
        ├── contradiction-detector.ts  # Agent 6: Find conflicts
        └── quality-judge.ts           # Agent 7: Quality gate + summary

components/
├── dashboard/
│   ├── DashboardShell.tsx      # Layout wrapper (sidebar vs auth routes)
│   ├── DashboardSidebar.tsx    # 240px glass sidebar navigation
│   └── PipelineTrace.tsx       # Pipeline visualization component
├── ui/                         # shadcn/ui components (button, card, dialog, etc.)
│   └── cybernetic-grid-shader.tsx  # Three.js WebGL background
├── login-form.tsx
├── sign-up-form.tsx
├── forgot-password-form.tsx
└── update-password-form.tsx

data/
└── mock-data.ts                # Demo data for development

scripts/
├── seed-demo-data.ts           # Seed Supabase with sample data
├── test-ingestion.ts           # Test scraping pipeline
├── test-signal-extractor.ts    # Test signal extraction
├── test-digest-generator.ts    # Test digest generation
├── run-website-monitor.ts      # Manual website monitoring
└── analyze-multiagent.ts       # Analyze pipeline traces
```

---

## Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run ingestion manually
npm run test:ingestion

# Generate a digest
npm run test:digest

# Seed demo data
npm run seed:demo

# Analyze pipeline traces
npm run analyze:multiagent
```

---

## End-to-End Flow Summary

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER ONBOARDS                                 │
│  Sign up → Name/Desc → Stage → Audience → Competitors → Goal        │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     INITIAL SCRAPE                                    │
│  For each competitor URL:                                            │
│  fetch → Cheerio parse → MD5 hash → store snapshot → Claude extract  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 MULTI-AGENT PIPELINE (Nemotron 70B)                  │
│                                                                      │
│  Classifier → Strategist → [Red Team | Scenarios | Verifier |       │
│                              Contradiction Detector] → Quality Judge │
│                                                                      │
│  7 agents, 7+ LLM calls, token tracking, JSONL tracing              │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     DIGEST STORED                                     │
│  Executive summary, scored insights, forward scenarios, quality grade │
│  Stored in Supabase `digests` table with linked signals              │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     DASHBOARD RENDERED                                │
│  Dashboard → Competitors → Signals → Digest → Settings               │
│  Terminal aesthetic, 3-color scheme (#00FF41, #FF00FF, #00FFFF)      │
└──────────────────────────────────────────────────────────────────────┘
```
end
