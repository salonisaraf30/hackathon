# CompetitorPulse — Next.js 14

AI-powered competitive intelligence with a **retro arcade / neon cyberpunk** aesthetic. Built with **Next.js 14 (App Router)**, TypeScript, Tailwind, and Supabase. **No Vite.**

## Run locally

```bash
cd competitor-pulse
cp .env.local.example .env.local
# Edit .env.local and add your Supabase URL and anon key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. **Loading** (`/`) — Typewriter “Welcome to CompetitorPulse”, neon loading bar, cycling phrases, Pac-Man dots, scanlines. Then redirect to `/landing`.
2. **Landing** (`/landing`) — Hero, 3 feature cards (Track Signals, AI Analysis, Weekly Digest), footer. **GET STARTED** → `/auth`.
3. **Auth** (`/auth`) — Sign in / Sign up (Supabase). Cybernetic grid shader + scanlines. Sign up → `/onboarding`; Sign in → `/dashboard`.
4. **Onboarding** (`/onboarding`) — 5 “levels”: startup name/description, stage, audience (multi-select), mission, key features. **ENTER THE ARENA** → `/onboarding/competitors-check`.
5. **Competitors check** (`/onboarding/competitors-check`) — “Do you know your competitors?” → Add now → `/onboarding/add-competitors`, or “Not yet” → `/dashboard`.
6. **Add competitors** (`/onboarding/add-competitors`) — Add up to 5 competitors (name + URL). Saves to Supabase `competitors` table. **Continue** → `/dashboard` or **Skip** → `/dashboard`.
7. **Dashboard** (`/dashboard`) — Sidebar: Dashboard, Competitors, Digests, Settings. Competitor radar + recent signals (mock data when no Supabase data). Dashboard uses cybernetic grid shader + scanlines.
8. **Competitors** — List and detail (signals per competitor).
9. **Digests** — List and detail (executive summary, key insights, strategic outlook). **Generate Weekly Brief** → opens latest mock digest.
10. **Settings** — Product name, description, positioning, target market, key features.

## Design

- **Fonts:** Press Start 2P (loading, landing, onboarding), VT323 (landing body), Space Mono (auth, dashboard headings), IBM Plex Mono (body/inputs).
- **Colors:** Black background, `#00FF41` green, `#FF00FF` magenta, `#00FFFF` cyan, white.
- **Effects:** Scanline overlay (CSS), cybernetic grid shader (Three.js) on auth, competitors-check, add-competitors, and dashboard.

## Supabase

- **Auth:** Email/password sign in and sign up.
- **Table:** `competitors` with `user_id`, `name`, `website_url` (and optional `last_scraped_at`). Create it in the Supabase SQL editor:

```sql
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own competitors"
  ON public.competitors FOR ALL
  USING (auth.uid() = user_id);
```

## Env vars

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key  

Without these, auth and competitor save are no-ops (placeholder client); add them to `.env.local` for real auth and DB.
