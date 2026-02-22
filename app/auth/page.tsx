"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseDisabled } from "@/lib/supabase/client";
import CyberneticGridShader from "@/components/ui/cybernetic-grid-shader";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (isSupabaseDisabled()) {
      setLoading(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    if (isSupabaseDisabled()) {
      setLoading(false);
      router.push("/onboarding");
      router.refresh();
      return;
    }
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <CyberneticGridShader />
      <div className="scanlines" aria-hidden />

      <div
        className="relative z-10 w-full max-w-md rounded-lg border border-[#00FF41] p-8 shadow-[0_0_30px_rgba(0,255,65,0.15)]"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p
          className="text-[#00FF41] text-xs mb-6"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          ⚡ CompetitorPulse
        </p>

        <div className="flex gap-6 mb-8">
          <button
            type="button"
            onClick={() => { setTab("signin"); setError(null); }}
            className={`pb-2 text-sm ${tab === "signin" ? "text-[#00FF41] border-b-2 border-[#00FF41]" : "text-white/60"}`}
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setError(null); }}
            className={`pb-2 text-sm ${tab === "signup" ? "text-[#00FF41] border-b-2 border-[#00FF41]" : "text-white/60"}`}
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            SIGN UP
          </button>
        </div>

        {tab === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            />
            {error && (
              <p className="text-[#FF00FF] text-sm" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FF00FF] text-black font-semibold hover:brightness-110 disabled:opacity-70"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN →"}
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className="w-full text-[#00FF41] text-sm hover:underline"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              New here? SIGN UP →
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            />
            {error && (
              <p className="text-[#FF00FF] text-sm" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00FF41] text-black font-semibold hover:brightness-110 disabled:opacity-70"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              {loading ? "AUTHENTICATING..." : "CREATE ACCOUNT →"}
            </button>
            <button
              type="button"
              onClick={() => setTab("signin")}
              className="w-full text-[#00FF41] text-sm hover:underline"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              Already have an account? SIGN IN →
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/50 text-xs mb-2" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
            No account? Explore the full flow:
          </p>
          <a
            href="/onboarding"
            className="inline-block text-[#00FFFF] text-sm hover:underline"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Onboarding → Competitors → Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
