// app/api/competitors/route.ts
// Handles: GET (list all competitors for user) and POST (add new competitor)

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/competitors — List all competitors for the authenticated user
export async function GET() {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch competitors with their signal counts
  const { data: competitors, error } = await supabase
    .from("competitors")
    .select(
      `
      *,
      signals(count)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ competitors });
}

// POST /api/competitors — Add a new competitor and trigger initial scrape
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, website_url, twitter_handle, product_hunt_slug, description } =
    body;

  // Validate required fields
  if (!name || !website_url) {
    return NextResponse.json(
      { error: "Name and website URL are required" },
      { status: 400 }
    );
  }

  // Insert competitor into Supabase
  const { data: competitor, error } = await supabase
    .from("competitors")
    .insert({
      user_id: user.id,
      name,
      website_url,
      twitter_handle: twitter_handle || null,
      product_hunt_slug: product_hunt_slug || null,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Trigger initial scrape in the background (don't await — let it run async)
  // This calls the ingest endpoint for just this competitor
  const baseUrl = request.nextUrl.origin;
  fetch(`${baseUrl}/api/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ competitor_id: competitor.id }),
  }).catch((err) => console.error("Background scrape failed:", err));

  return NextResponse.json({ competitor }, { status: 201 });
}