"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const resolvePostLoginRoute = async () => {
    try {
      const response = await fetch("/api/auth/post-login", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) return "/onboarding"; // If check fails, assume new user
      const data = (await response.json()) as { next?: string };
      return data.next === "/onboarding" ? "/onboarding" : "/dashboard";
    } catch {
      return "/onboarding"; // On network/parse error, assume new user
    }
  };

  useEffect(() => {
    const prefillEmail = searchParams.get("email");
    if (prefillEmail) setEmail(prefillEmail);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const target = await resolvePostLoginRoute();
      router.push(target);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-lg p-8" style={{ backgroundColor: "#0D0D0D", border: "1px solid #00FF41" }}>
        <div className="mb-6">
          <h1 className="text-2xl text-[#00FF41] mb-1" style={SM}>SIGN IN</h1>
          <p className="text-[13px] text-[#888888]" style={IBM}>Enter your credentials to access CompetitorPulse</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[12px] text-[#888888] block mb-1" style={IBM}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@competitorpulse.io"
              className="terminal-input w-full px-3 py-2.5 rounded text-[13px]"
              style={IBM}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] text-[#888888]" style={IBM}>Password</label>
              <Link href="/auth/forgot-password" className="text-[11px] text-[#00FFFF] hover:underline" style={SM}>FORGOT?</Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="terminal-input w-full px-3 py-2.5 rounded text-[13px]"
              style={IBM}
            />
          </div>
          {error && <p className="text-[12px] text-red-400" style={IBM}>{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded text-[13px] transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#00FF41", color: "#000", ...SM }}
          >
            {isLoading ? "AUTHENTICATING..." : "SIGN IN →"}
          </button>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 rounded text-[13px] transition-colors disabled:opacity-50"
            style={{ border: "1px solid #888888", color: "#888888", backgroundColor: "transparent", ...SM }}
          >
            SIGN IN WITH GOOGLE
          </button>
        </form>
        <p className="text-center text-[12px] text-[#888888] mt-5" style={IBM}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="text-[#FF00FF] hover:underline" style={SM}>SIGN UP</Link>
        </p>
      </div>
    </div>
  );
}
