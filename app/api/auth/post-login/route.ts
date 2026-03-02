import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/utils/api-error";

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError("Unauthorized", 401);

    const { data: product, error: productError } = await admin
      .from("user_products")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (productError) {
      console.error("post-login user_products query error:", productError.message);
      return NextResponse.json({ next: "/onboarding" });
    }

    const next = product?.id ? "/dashboard" : "/onboarding";
    return NextResponse.json({ next });

  } catch (err) {
    return handleApiError(err);
  }
}