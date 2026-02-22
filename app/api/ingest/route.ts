import { NextRequest, NextResponse } from "next/server";

import { runIngestion } from "@/lib/ingestion/run-ingestion";
import { monitorWebsite } from "@/lib/ingestion/website-monitor";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const admin = createAdminClient();

  let competitorId: string | null = null;
  try {
    const body = await request.json();
    competitorId = body?.competitor_id ?? null;
  } catch {
    competitorId = null;
  }

  if (competitorId) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: competitor, error: competitorError } = await admin
      .from("competitors")
      .select("id, name, website_url, user_id")
      .eq("id", competitorId)
      .maybeSingle();

    if (competitorError) {
      return NextResponse.json({ error: competitorError.message }, { status: 500 });
    }

    if (!competitor || competitor.user_id !== user.id) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    if (!competitor.website_url) {
      return NextResponse.json({ error: "Competitor missing website URL" }, { status: 400 });
    }

    const insertedSignals = await monitorWebsite(
      competitor.id,
      competitor.website_url,
      admin,
    );

    await admin
      .from("competitors")
      .update({ last_scraped_at: new Date().toISOString() })
      .eq("id", competitor.id);

    return NextResponse.json({
      results: [
        {
          competitor: competitor.name,
          signals_found: insertedSignals.length,
          status: "success",
        },
      ],
    });
  }

  const authHeader = request.headers.get("authorization");
  const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCronCall) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let userId: string | undefined;
  if (!isCronCall) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;
  }

  const results = await runIngestion(userId);
  return NextResponse.json({ results });
}
