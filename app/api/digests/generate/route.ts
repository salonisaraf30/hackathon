import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDigest } from "@/lib/intelligence/digest-generator";
import type { Json } from "@/lib/supabase/types";

export async function POST() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const digestContent = await generateDigest(user.id);

    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: digestRow, error: digestError } = await admin
      .from("digests")
      .insert({
        user_id: user.id,
        title: digestContent.title,
        executive_summary: digestContent.executive_summary,
        strategic_insights: digestContent as unknown as Json,
        period_start: oneWeekAgo.toISOString(),
        period_end: now.toISOString(),
      })
      .select()
      .single();

    if (digestError) {
      return NextResponse.json({ error: digestError.message }, { status: 500 });
    }

    const { data: competitors } = await admin
      .from("competitors")
      .select("id")
      .eq("user_id", user.id);

    const competitorIds = (competitors ?? []).map((item) => item.id);

    if (competitorIds.length > 0) {
      const { data: recentSignals } = await admin
        .from("signals")
        .select("id")
        .in("competitor_id", competitorIds)
        .gte("detected_at", oneWeekAgo.toISOString())
        .order("importance_score", { ascending: false })
        .limit(50);

      const digestSignalLinks = (recentSignals ?? []).map((signal) => ({
        digest_id: digestRow.id,
        signal_id: signal.id,
      }));

      if (digestSignalLinks.length > 0) {
        const { error: linkError } = await admin
          .from("digest_signals")
          .insert(digestSignalLinks);

        if (linkError) {
          console.error("Failed to link digest signals:", linkError);
        }
      }
    }

    return NextResponse.json({
      digest: {
        ...digestRow,
        parsed_insights: digestContent,
      },
      meta: {
        model: "nvidia/llama-3.1-nemotron-70b-instruct",
        generated_via: "nemotron",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Digest generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
