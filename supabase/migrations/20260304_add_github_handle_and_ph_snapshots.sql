-- Migration: Add github_handle to competitors and create producthunt_snapshots table
-- Run this in your Supabase SQL Editor

-- Add github_handle column to competitors table
ALTER TABLE competitors
ADD COLUMN IF NOT EXISTS github_handle TEXT;

-- Create producthunt_snapshots table for tracking vote velocity
CREATE TABLE IF NOT EXISTS producthunt_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  votes_count INTEGER NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for efficient lookups
  CONSTRAINT unique_competitor_slug_time UNIQUE (competitor_id, slug, captured_at)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_producthunt_snapshots_competitor_slug 
ON producthunt_snapshots(competitor_id, slug, captured_at DESC);

-- Add comment for documentation
COMMENT ON TABLE producthunt_snapshots IS 'Stores Product Hunt vote/review snapshots for tracking velocity';
COMMENT ON COLUMN competitors.github_handle IS 'GitHub org name or org/repo format (e.g., "vercel" or "vercel/next.js")';
