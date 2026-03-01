# CompetitorPulse NEW

AI-powered competitive intelligence platform that monitors competitor websites, extracts strategic signals, and generates analyst-grade intelligence briefs — all automatically.

Built at **NYU Buildathon 2025** by **Saloni Saraf**, **Shreyam Borah**, **Tansin Taj**, and **Chiraj Dhiwar**.

![Terminal UI](https://img.shields.io/badge/UI-Terminal%20Aesthetic-00FF41?style=flat-square&labelColor=0D0D0D)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square)

**Live Demo:** [https://hackathon-qgp2.vercel.app](https://hackathon-qgp2.vercel.app/)

---

## How It Works

1. **Onboard** — Name your startup, describe it, pick your stage/audience/goals, and add competitors with their URLs
2. **Scrape** — Competitor websites are fetched and parsed with Cheerio. Content is hashed (MD5) to detect changes
3. **Extract Signals** — When content changes, Claude Sonnet analyzes the diff and extracts competitive signals (product launches, pricing changes, hiring, funding, etc.)
4. **7-Agent Pipeline** — Signals are processed through a multi-agent Nemotron 70B pipeline:

   | Agent | Role |
   |---|---|
   | Signal Classifier | Categorizes signals (offensive, defensive, market expansion, etc.) |
   | Competitive Strategist | Generates strategic insights personalized to your product |
   | Red Team | Challenges insights — finds blind spots and counter-arguments |
   | Scenario Predictor | Predicts future competitor moves and market direction |
   | Signal Verifier | Checks if insights are grounded in actual evidence |
   | Contradiction Detector | Finds conflicts between insights |
   | Quality Judge | Scores insights, writes executive summary, grades the digest |

5. **Intelligence Brief** — A scored, filtered digest with executive summary, key insights, forward scenarios, and quality grade

---

## Multi-Agent Architecture

CompetitorPulse uses a **7-agent pipeline** where each AI agent has a specialized role, mimicking how a real competitive intelligence team operates. Agents run on **NVIDIA Nemotron 70B** via OpenRouter.

**Why multi-agent instead of a single prompt?**
- Each agent focuses on one task → higher quality output
- Agents check each other's work (Red Team challenges the Strategist, Verifier checks evidence, Contradiction Detector catches conflicts).
- The Quality Judge acts as a final gate — only well-scored, evidence-backed insights make it into the digest
- Stages 3–6 run **in parallel** for speed

**Pipeline flow:**

```
Raw Signals
    │
    ▼
Signal Classifier ──► Competitive Strategist
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          Red Team    Scenario       Signal Verifier +
          Agent       Predictor      Contradiction Detector
              └─────────────┼─────────────┘
                            ▼
                      Quality Judge
                            │
                            ▼
                    Intelligence Brief
```

- **Signal Classifier** (temp 0.3) — Tags each signal as offensive move, defensive move, market expansion, internal shift, or ecosystem play. Assigns confidence and strategic weight.
- **Competitive Strategist** (temp 0.3) — Maps each classified signal to your product's positioning. Outputs what happened, why it matters to you, and what to do about it.
- **Red Team** (temp 0.6) — Plays devil's advocate. Finds counter-arguments, blind spots, and alternative interpretations. Can mark an insight as upheld, partially challenged, or overturned.
- **Scenario Predictor** (temp 0.3) — Looks at signal patterns to predict what competitors will do next. Includes confidence levels, evidence, preemptive actions, and wildcard scenarios.
- **Signal Verifier** (temp 0.1) — Checks whether the Strategist's insights are actually grounded in the signal data. Flags weak evidence.
- **Contradiction Detector** (temp 0.15) — Scans all insights for logical conflicts (e.g., one says "competitor is expanding" while another says "competitor is retreating").
- **Quality Judge** (temp 0.3) — Scores each insight on specificity, actionability, and evidence strength. Writes the executive summary. Assigns an A–D quality grade. Only approved insights make the final digest.

Every LLM call is traced to `logs/multiagent-trace.jsonl` with agent name, token usage, duration, and call ID for full observability.

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Web Scraping | Cheerio + native fetch |
| Signal Extraction | Claude Sonnet 4 (Anthropic) |
| Intelligence Pipeline | NVIDIA Nemotron 70B (via OpenRouter) |
| UI | Tailwind CSS, Radix UI (shadcn/ui), Recharts, Three.js |
| Deployment | Vercel |

---

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your keys (see below)
npm run dev
```

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/auth/login` | Sign in |
| `/auth/sign-up` | Create account |
| `/onboarding` | 6-step startup setup |
| `/dashboard` | Overview — stats, competitors, signals, digest CTA |
| `/competitors` | Tracked competitors with threat levels |
| `/competitors/[id]` | Competitor detail — signals, radar chart, settings |
| `/signals` | Full signal feed with filters |
| `/digest` | Intelligence briefs with insights and scenarios |
| `/settings` | Profile, notifications, preferences |

---

## Scripts

```bash
npm run dev                  # Start dev server
npm run build                # Production build
npm run test:ingestion       # Test web scraping pipeline
npm run test:digest          # Test digest generation
npm run seed:demo            # Seed sample data
npm run analyze:multiagent   # Analyze pipeline traces
```
