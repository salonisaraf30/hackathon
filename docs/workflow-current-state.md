# CompetitorPulse – Current Workflow (As Implemented)

## 1) High-level architecture

There are two main pipelines currently in code:

1. **Signal Ingestion Pipeline**
   - Scrapes competitor websites
   - Detects changes
   - Extracts structured signals using Claude
   - Stores snapshots + signals in Supabase
   - Attempts to index signals in Nia

2. **Digest Generation Pipeline**
   - Reads product context + competitor signals
   - Builds strategic brief using LLM
   - Returns structured intelligence output

---

## 2) Main entry points and what they do

- `POST /api/ingest` in `app/api/ingest/route.ts`
  - Trigger ingestion for one competitor or all
  - Scrapes websites, stores snapshots, extracts signals
  - Calls Nia indexing for inserted signals

- `POST /api/generate` in `app/api/generate/route.ts`
  - Authenticated user digest endpoint
  - Uses Supabase signals + optional Nia context
  - Calls Anthropic to generate final digest JSON
  - Saves digest into Supabase tables

- `generateDigest(userId)` in `lib/intelligence/digest-generator.ts`
  - Independent digest module (used in script testing)
  - Uses Nia retrieval + fallback + Nemotron
  - Returns title + structured brief

---

## 3) Ingestion flow (detailed)

### 3.1 Trigger
`app/api/ingest/route.ts` receives POST:
- with body `{ competitor_id }` => single competitor
- without body => cron mode (checks `CRON_SECRET`)

### 3.2 Competitor selection
- Reads competitor rows from Supabase table: `competitors`

### 3.3 Scraping
For each competitor:
- Scrapes main website URL
- Tries common pricing URLs (`/pricing`, `/plans`)
- Uses `cheerio` to remove boilerplate content (nav/footer/scripts)
- Hashes normalized text (`md5`) to detect changes

### 3.4 Snapshot handling
- Reads last snapshot from `website_snapshots`
- Inserts latest snapshot always
- If first scrape or hash changed => continue to AI extraction

### 3.5 Signal extraction (Claude)
- Calls Anthropic in `extractSignalsWithAI(...)` inside `app/api/ingest/route.ts`
- Prompt asks for structured JSON signals (`signal_type`, `title`, `summary`, `importance_score`)
- Parses model output JSON

### 3.6 Signal persistence
- Inserts parsed signals into Supabase table: `signals`

### 3.7 Nia indexing
- For each inserted signal, calls `indexSignalInNia(...)` from `lib/intelligence/nia-client.ts`
- Index request body includes:
  - `document`: title + summary
  - `metadata`: signal ID, competitor ID, signal type, detected date, score
- Indexing is non-blocking (failures logged, ingestion still succeeds)

### 3.8 Ingestion summary
- Updates `competitors.last_scraped_at`
- Returns per-competitor result summary

---

## 4) Digest generation flow (two current paths)

## Path A: API path currently active
File: `app/api/generate/route.ts`

1. Auth check (`supabase.auth.getUser()`)
2. Loads user's product from `user_products`
3. Loads user's competitors from `competitors`
4. Loads recent signals from `signals` (last 7 days)
5. Also calls `retrieveRelevantSignals(...)` from Nia client for semantic context
   - if Nia fails, Nia client falls back to Supabase retrieval internally
6. Builds long strategic prompt with:
   - product context
   - raw signals
   - Nia semantic context
7. Calls Anthropic (`claude-sonnet-4-20250514`)
8. Parses JSON output
9. Stores digest in `digests`
10. Links digest-to-signals in `digest_signals`

## Path B: Independent module path
File: `lib/intelligence/digest-generator.ts` (tested via script)

1. Reads product + competitors (admin client)
2. Retrieves signals from Nia first
3. Falls back to Supabase if Nia fails
4. If no signals => returns safe default digest
5. Builds prompt focused on user product positioning
6. Calls `callNemotron(...)` from `lib/intelligence/nemotron-client.ts`
7. Returns `{ title, executive_summary, insights, strategic_outlook }`

Test entry: `scripts/test-digest-generator.ts` via `npm run test:digest`

---

## 5) External API calls and where they happen

### Anthropic (Claude)
- Used in:
  - `app/api/ingest/route.ts` for signal extraction
  - `app/api/generate/route.ts` for digest generation
- Model currently: `claude-sonnet-4-20250514`

### Nia
- Used in: `lib/intelligence/nia-client.ts`
- Calls:
  - `POST {NIA_BASE_URL}/index`
  - `POST {NIA_BASE_URL}/search`
- Current behavior:
  - On non-OK response (ex: 404), logs error and falls back to Supabase retrieval

### OpenRouter / Nemotron
- Used in: `lib/intelligence/nemotron-client.ts`
- Call: `POST https://openrouter.ai/api/v1/chat/completions`
- Model currently set to: `nvidia/llama-3.1-nemotron-70b-instruct`
- Parser now extracts first JSON object robustly from LLM text

---

## 6) Current known runtime outcomes (from latest tests)

- Ingestion scripts run and process seeded competitors successfully
- Website monitor runs on real URLs
- Signals can remain `0` when no meaningful diff is detected
- Nia retrieval currently returns `404` (endpoint/base URL mismatch likely)
- Nemotron path is now parsing correctly after parser hardening

---

## 7) Example workflow run (what happened end-to-end)

Example based on current test sequence:

1. `npm run seed:demo`
   - Inserts demo competitors (Notion, Linear, Coda)

2. `npm run monitor:websites -- <competitorId> https://www.notion.so`
   - Scrapes Notion
   - Saves snapshot
   - No major content diff => `Extracted 0 signal(s)`

3. `npm run test:ingestion`
   - Loops all competitors
   - Reports `Success: 3`, `Errors: 0`

4. `npm run test:digest`
   - Seeds product + competitors + synthetic signals
   - Calls `generateDigest(userId)`
   - Nia `404` => fallback used
   - Nemotron call generates digest output with actionable insights

---

## 8) What is still not fully integrated

- API digest route still uses Anthropic directly; independent `generateDigest(...)` module is not yet wired into `/api/generate`
- Nia endpoint/base URL still needs correction to remove `404` and use true semantic retrieval

