"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="rounded-lg p-8" style={{ backgroundColor: "#0D0D0D", border: "1px solid #00FF41" }}>
        <div className="mb-6">
          <h1 className="text-2xl text-[#00FF41] mb-1" style={SM}>RESET PASSWORD</h1>
          <p className="text-[13px] text-[#888888]" style={IBM}>Please enter your new password below.</p>
        </div>
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label className="text-[12px] text-[#888888] block mb-1" style={IBM}>New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
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
            {isLoading ? "SAVING..." : "SAVE NEW PASSWORD →"}
          </button>
        </form>
      </div>
    </div>
  );
}
