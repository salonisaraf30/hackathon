"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginShortcut, setShowLoginShortcut] = useState(false);
  const router = useRouter();

  const isEmailRateLimitError = (value: string) => {
    const message = value.toLowerCase();
    return message.includes("rate limit") || message.includes("email rate") || message.includes("too many requests");
  };

  const isAlreadyRegistered = (value: string) => {
    const message = value.toLowerCase();
    return message.includes("already registered") || message.includes("already been registered") || message.includes("user already exists");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setShowLoginShortcut(false);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;

      // If Supabase returned a session, user is auto-confirmed → go directly to onboarding
      if (data.session) {
        router.push("/onboarding");
        return;
      }

      // Otherwise email confirmation is required
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      if (isAlreadyRegistered(message) || isEmailRateLimitError(message)) {
        setError("This email is already registered. Please log in instead.");
        setShowLoginShortcut(true);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-lg p-8" style={{ backgroundColor: "#0D0D0D", border: "1px solid #FF00FF" }}>
        <div className="mb-6">
          <h1 className="text-3xl text-[#FF00FF] mb-2" style={SM}>SIGN UP</h1>
          <p className="text-[15px] text-[#888888]" style={IBM}>Create a new CompetitorPulse account</p>
        </div>
        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="text-[14px] text-[#888888] block mb-1.5" style={IBM}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@competitorpulse.io"
              className="terminal-input w-full px-4 py-3 rounded text-[15px]"
              style={IBM}
            />
          </div>
          <div>
            <label className="text-[14px] text-[#888888] block mb-1.5" style={IBM}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="terminal-input w-full px-4 py-3 rounded text-[15px]"
              style={IBM}
            />
          </div>
          <div>
            <label className="text-[14px] text-[#888888] block mb-1.5" style={IBM}>Repeat Password</label>
            <input
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="terminal-input w-full px-4 py-3 rounded text-[15px]"
              style={IBM}
            />
          </div>
          {error && <p className="text-[14px] text-red-400" style={IBM}>{error}</p>}
          {showLoginShortcut && (
            <button
              type="button"
              className="w-full py-3 rounded text-[15px] transition-colors"
              style={{ border: "1px solid #888888", color: "#888888", backgroundColor: "transparent", ...SM }}
              onClick={() => router.push(`/auth/login?email=${encodeURIComponent(email)}`)}
            >
              GO TO LOGIN
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded text-[15px] transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#FF00FF", color: "#000", ...SM }}
          >
            {isLoading ? "CREATING ACCOUNT..." : "SIGN UP →"}
          </button>
        </form>
        <p className="text-center text-[14px] text-[#888888] mt-5" style={IBM}>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#00FF41] hover:underline" style={SM}>LOGIN</Link>
        </p>
      </div>
    </div>
  );
}
