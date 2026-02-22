import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
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
    const { data: product, error: productError } = await admin
      .from("user_products")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (productError) {
      console.error("post-login user_products query error:", productError.message);
      // If the table doesn't exist or query fails, assume new user → onboarding
      return NextResponse.json({ next: "/onboarding" });
    }

    const next = product?.id ? "/dashboard" : "/onboarding";
    return NextResponse.json({ next });
  } catch (err) {
    console.error("post-login unexpected error:", err);
    return NextResponse.json({ next: "/onboarding" });
  }
}
