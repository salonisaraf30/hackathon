import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { monitorWebsite } from "@/lib/ingestion/website-monitor";

type OnboardingCompetitorInput = {
  name?: string;
  url?: string;
};

type OnboardingPayload = {
  startupName?: string;
  description?: string;
  stage?: string | null;
  audiences?: string[];
  competitors?: (string | OnboardingCompetitorInput)[];
  goal?: string | null;
};

type CompetitorRow = {
  id: string;
  name: string;
  website_url: string | null;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: profileUpsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
    },
    { onConflict: "id" }
  );

  if (profileUpsertError) {
    return NextResponse.json(
      { error: `Failed to initialize profile: ${profileUpsertError.message}` },
      { status: 500 }
    );
  }

  const body = (await request.json()) as OnboardingPayload;
  const {
    startupName,
    description,
    stage,
    audiences = [],
    competitors = [],
    goal,
  } = body;

  if (!startupName?.trim()) {
    return NextResponse.json(
      { error: "Startup name is required" },
      { status: 400 }
    );
  }

  const positioning = [description?.trim(), stage, goal].filter(Boolean).join(" | ");
  const targetMarket = audiences.length > 0 ? audiences.join(", ") : null;
  const normalizedAudiences = audiences
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const onboardingTags = [
    ...(stage ? [`stage:${stage}`] : []),
    ...(goal ? [`goal:${goal}`] : []),
    ...normalizedAudiences.map((item) => `audience:${item}`),
  ];

  const { data: existingProducts, error: existingProductError } = await supabase
    .from("user_products")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (existingProductError) {
    return NextResponse.json(
      { error: existingProductError.message },
      { status: 500 }
    );
  }

  const productPayload = {
    user_id: user.id,
    name: startupName.trim(),
    description: description?.trim() || null,
    positioning: positioning || null,
    target_market: targetMarket,
    key_features: onboardingTags,
  };

  let productError: Error | null = null;

  if ((existingProducts ?? []).length > 0) {
    const productId = existingProducts![0].id;
    const result = await supabase
      .from("user_products")
      .update(productPayload)
      .eq("id", productId);
    productError = result.error;
  } else {
    const result = await supabase.from("user_products").insert(productPayload);
    productError = result.error;
  }

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  const cleanedCompetitors = competitors
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim();
        return name ? { name, website_url: null as string | null } : null;
      }

      const rawName = item?.name?.trim() ?? "";
      const rawUrl = item?.url?.trim() ?? "";

      if (!rawName) {
        return null;
      }

      const normalizedUrl = rawUrl
        ? rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
          ? rawUrl
          : `https://${rawUrl}`
        : null;

      return {
        name: rawName,
        website_url: normalizedUrl,
      };
    })
    .filter((item): item is { name: string; website_url: string | null } =>
      Boolean(item)
    );

  if (cleanedCompetitors.length > 0) {
    const { data: existing, error: existingError } = await supabase
      .from("competitors")
      .select("id, name, website_url")
      .eq("user_id", user.id);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingRows = (existing ?? []) as CompetitorRow[];

    const existingByName = new Map(
      existingRows.map((item) => [item.name.trim().toLowerCase(), item])
    );

    const toInsert = cleanedCompetitors
      .filter((item) => !existingByName.has(item.name.trim().toLowerCase()))
      .map((item) => ({
        user_id: user.id,
        name: item.name.trim(),
        website_url: item.website_url,
        description: "Added during onboarding",
      }));

    const admin = createAdminClient();

    for (const item of cleanedCompetitors) {
      const existingRow = existingByName.get(item.name.trim().toLowerCase());
      if (existingRow && !existingRow.website_url && item.website_url) {
        await supabase
          .from("competitors")
          .update({ website_url: item.website_url })
          .eq("id", existingRow.id);
      }
    }

    if (toInsert.length > 0) {
      const { data: insertedRowsRaw, error: insertError } = await supabase
        .from("competitors")
        .insert(toInsert)
        .select("id, name, website_url");

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      const insertedRows = (insertedRowsRaw ?? []) as CompetitorRow[];

      for (const competitor of insertedRows) {
        if (!competitor.website_url) {
          continue;
        }

        try {
          await monitorWebsite(competitor.id, competitor.website_url, admin);
          await admin
            .from("competitors")
            .update({ last_scraped_at: new Date().toISOString() })
            .eq("id", competitor.id);
        } catch (scrapeError) {
          console.error(
            `Initial scrape failed for ${competitor.name}:`,
            scrapeError
          );
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
