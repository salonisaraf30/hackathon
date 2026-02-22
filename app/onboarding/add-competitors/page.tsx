"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CyberneticGridShader from "@/components/ui/cybernetic-grid-shader";

const MAX_ROWS = 5;
const URL_REGEX = /^https?:\/\/.+\..+/;

type Row = { name: string; website_url: string };

export default function AddCompetitorsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([{ name: "", website_url: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const addRow = () => {
    if (rows.length >= MAX_ROWS) return;
    setRows((r) => [...r, { name: "", website_url: "" }]);
  };

  const removeRow = (i: number) => {
    if (rows.length <= 1) return;
    setRows((r) => r.filter((_, j) => j !== i));
  };

  const updateRow = (i: number, field: keyof Row, value: string) => {
    setRows((r) =>
      r.map((row, j) => (j === i ? { ...row, [field]: value } : row))
    );
    setFieldErrors((e) => {
      const next = { ...e };
      delete next[`${i}-name`];
      delete next[`${i}-url`];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    rows.forEach((row, i) => {
      if (row.name.trim()) {
        if (row.website_url.trim() && !URL_REGEX.test(row.website_url)) {
          errs[`${i}-url`] = "Invalid URL format";
        }
      }
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const toInsert = rows.filter((r) => r.name.trim());
    if (toInsert.length === 0) {
      router.push("/onboarding/enter-arena");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("competitors").insert(
      toInsert.map((r) => ({
        user_id: user.id,
        name: r.name.trim(),
        website_url: r.website_url.trim() || null,
      }))
    );

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/onboarding/enter-arena");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <CyberneticGridShader />
      <div className="scanlines" aria-hidden />

      <div
        className="relative z-10 w-full max-w-[600px] rounded-lg border border-[#00FF41] p-8 shadow-[0_0_30px_rgba(0,255,65,0.15)]"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p
          className="text-[#00FF41] text-xs mb-2"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          CompetitorPulse
        </p>
        <p
          className="text-white/50 text-xs mb-8"
          style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
        >
          STEP 3 OF 3
        </p>

        <h2
          className="text-white text-lg mb-2"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          Add your competitors
        </h2>
        <p
          className="text-white/50 text-sm mb-6"
          style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
        >
          Add at least one to get started. You can add more later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    placeholder="Company name"
                    value={row.name}
                    onChange={(e) => updateRow(i, "name", e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
                    style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                  />
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={row.website_url}
                    onChange={(e) => updateRow(i, "website_url", e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
                    style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                  />
                  {fieldErrors[`${i}-url`] && (
                    <p
                      className="text-[#FF00FF] text-xs mt-1"
                      style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                    >
                      {fieldErrors[`${i}-url`]}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="p-2 text-white/40 hover:text-red-400 shrink-0 disabled:invisible"
                disabled={rows.length <= 1}
                aria-label="Remove row"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          {rows.length < MAX_ROWS && (
            <button
              type="button"
              onClick={addRow}
              className="text-[#00FF41] text-sm hover:underline"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              + Add another competitor
            </button>
          )}

          {error && (
            <p
              className="text-[#FF00FF] text-sm"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FF00FF] text-black font-semibold hover:brightness-110 disabled:opacity-70 mt-4"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            {loading ? "SAVING..." : "Continue to Dashboard"}
          </button>

          <Link
            href="/onboarding/enter-arena"
            className="block text-center text-white/50 text-sm mt-2 hover:text-white"
            style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            Skip for now
          </Link>
        </form>
      </div>
    </div>
  );
}
