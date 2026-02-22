"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <div className="rounded-lg p-8" style={{ backgroundColor: "#0D0D0D", border: "1px solid #00FF41" }}>
          <h1 className="text-2xl text-[#00FF41] mb-2" style={SM}>CHECK YOUR EMAIL</h1>
          <p className="text-[13px] text-[#888888]" style={IBM}>
            If you registered using your email and password, you will receive a password reset email.
          </p>
        </div>
      ) : (
        <div className="rounded-lg p-8" style={{ backgroundColor: "#0D0D0D", border: "1px solid #00FFFF" }}>
          <div className="mb-6">
            <h1 className="text-2xl text-[#00FFFF] mb-1" style={SM}>RESET PASSWORD</h1>
            <p className="text-[13px] text-[#888888]" style={IBM}>Type in your email and we&apos;ll send you a reset link</p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-5">
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
            {error && <p className="text-[12px] text-red-400" style={IBM}>{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded text-[13px] transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#00FFFF", color: "#000", ...SM }}
            >
              {isLoading ? "SENDING..." : "SEND RESET EMAIL →"}
            </button>
          </form>
          <p className="text-center text-[12px] text-[#888888] mt-5" style={IBM}>
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#00FF41] hover:underline" style={SM}>LOGIN</Link>
          </p>
        </div>
      )}
    </div>
  );
}
