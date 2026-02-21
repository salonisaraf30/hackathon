// app/api/digests/generate/route.ts
// Handles: POST (trigger AI digest generation for the authenticated user)
// This is the CORE intelligence endpoint — the "money feature"

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { retrieveRelevantSignals } from "@/lib/intelligence/nia-client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// POST /api/digests/generate
export async function POST() {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch the user's product positioning
    const { data: userProduct } = await supabase
      .from("user_products")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!userProduct) {
      return NextResponse.json(
        { error: "Please set up your product info first" },
        { status: 400 }
      );
    }

    // 2. Fetch all competitors for this user
    const { data: competitors } = await supabase
      .from("competitors")
      .select("*")
      .eq("user_id", user.id);

    if (!competitors || competitors.length === 0) {
      return NextResponse.json(
        { error: "No competitors added yet" },
        { status: 400 }
      );
    }

    const competitorIds = competitors.map((c) => c.id);

    // 3. Fetch recent signals (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: signals } = await supabase
      .from("signals")
      .select("*, competitors(name)")
      .in("competitor_id", competitorIds)
      .gte("detected_at", oneWeekAgo.toISOString())
      .order("importance_score", { ascending: false });

    if (!signals || signals.length === 0) {
      return NextResponse.json(
        { error: "No recent signals found to analyze" },
        { status: 400 }
      );
    }

    // 4. Retrieve relevant context from Nia (falls back internally if unavailable)
    const niaResults = await retrieveRelevantSignals(
      `competitive analysis for ${userProduct.name}`,
      competitorIds,
      20,
    );

    const niaContextText =
      niaResults.length > 0
        ? niaResults
            .slice(0, 10)
            .map((item, index) => {
              if (item && typeof item === "object") {
                const maybeSignal = item as Record<string, unknown>;
                if (typeof maybeSignal.title === "string") {
                  return `[NIA ${index + 1}] ${maybeSignal.title} — ${String(maybeSignal.summary ?? "")}`;
                }
              }
              return `[NIA ${index + 1}] ${JSON.stringify(item)}`;
            })
            .join("\n")
        : "No additional Nia context available.";

    // 5. Build the prompt for Claude
    const signalsText = signals
      .map(
        (s: any) =>
          `[${s.signal_type.toUpperCase()}] ${s.competitors?.name || "Unknown"} — ${s.title}\n${s.summary || ""}\nImportance: ${s.importance_score}/10 | Detected: ${s.detected_at}`
      )
      .join("\n\n");

    const prompt = `You are a senior competitive intelligence analyst. You provide sharp, actionable strategic analysis — not generic summaries.

## YOUR CLIENT'S PRODUCT
- Name: ${userProduct.name}
- Positioning: ${userProduct.positioning || "Not specified"}
- Target Market: ${userProduct.target_market || "Not specified"}
- Key Features: ${userProduct.key_features?.join(", ") || "Not specified"}
- Description: ${userProduct.description || "Not specified"}

## COMPETITIVE SIGNALS FROM THE PAST WEEK
${signalsText}

## SEMANTIC CONTEXT (NIA)
${niaContextText}

## YOUR TASK
Generate a weekly competitive intelligence brief. Be SPECIFIC to this client's product — generic advice is useless.

Respond in this exact JSON format:
{
  "executive_summary": "2-3 sentences. What's the single biggest competitive story this week and why should the client care?",
  "insights": [
    {
      "competitor": "Competitor name",
      "signal_type": "pricing_change | feature_update | hiring | funding | etc",
      "what_happened": "1 sentence factual summary",
      "why_it_matters": "2-3 sentences explaining impact on THIS CLIENT'S product specifically. Reference their positioning and target market.",
      "recommended_action": "1 concrete, actionable next step",
      "urgency": "high | medium | low"
    }
  ],
  "strategic_outlook": "2-3 sentences on what to watch next week based on the trends you see"
}

Group related signals into single insights where it makes sense. Aim for 3-6 insights total.
Return ONLY valid JSON, no markdown fences or extra text.`;

    // 6. Call Claude API
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // 7. Parse the response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let digestContent;
    try {
      // Clean potential markdown fences
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      digestContent = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // 8. Store the digest in Supabase
    const { data: digest, error: digestError } = await supabase
      .from("digests")
      .insert({
        user_id: user.id,
        title: `Weekly Brief — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        executive_summary: digestContent.executive_summary,
        strategic_insights: digestContent,
        period_start: oneWeekAgo.toISOString(),
        period_end: new Date().toISOString(),
      })
      .select()
      .single();

    if (digestError) {
      return NextResponse.json(
        { error: digestError.message },
        { status: 500 }
      );
    }

    // 9. Link signals to this digest
    const digestSignalLinks = signals.map((s: any) => ({
      digest_id: digest.id,
      signal_id: s.id,
    }));

    await supabase.from("digest_signals").insert(digestSignalLinks);

    // 10. Return the digest
    return NextResponse.json({
      digest: {
        ...digest,
        parsed_insights: digestContent,
      },
    });
  } catch (error: any) {
    console.error("Digest generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Digest generation failed" },
      { status: 500 }
    );
  }
}