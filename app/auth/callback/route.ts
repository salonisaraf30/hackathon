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
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        try {
          const { data: product } = await supabase
            .from("user_products")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

          const destination = product?.id ? next : "/onboarding";

          // Redirect through /auth/identify so the client can call
          // posthog.identify() before forwarding to the final destination.
          // We pass user info as query params — nothing sensitive beyond
          // what Supabase already exposes to the authenticated client.
          const identifyUrl = new URL(`${origin}/auth/identify`)
          identifyUrl.searchParams.set("next", destination)
          identifyUrl.searchParams.set("uid", user.id)
          identifyUrl.searchParams.set("email", user.email ?? "")
          identifyUrl.searchParams.set("created_at", user.created_at ?? "")

          return NextResponse.redirect(identifyUrl.toString())
        } catch {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?message=${encodeURIComponent("Email confirmed! Please sign in.")}`
  );
}