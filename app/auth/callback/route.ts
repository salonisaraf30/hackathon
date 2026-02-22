import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // After exchanging the code, check if the user needs onboarding
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if they have a product set up → if not, send to onboarding
        try {
          const { data: product } = await supabase
            .from("user_products")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          const destination = product?.id ? next : "/onboarding";
          return NextResponse.redirect(`${origin}${destination}`);
        } catch {
          // If query fails (table doesn't exist, etc.), send to onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // Code exchange may fail even though the email was confirmed.
  // Send the user to login with a friendly message instead of the error page.
  return NextResponse.redirect(
    `${origin}/auth/login?message=${encodeURIComponent("Email confirmed! Please sign in.")}`
  );
}
