"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { MOCK_DIGESTS } from "@/lib/mock-data";

export default function DigestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const digest = (id === "new" ? MOCK_DIGESTS[0] : MOCK_DIGESTS.find((d) => d.id === id)) ?? null;
  const [sourcesOpen, setSourcesOpen] = useState(false);

  if (!digest) {
    return (
      <div className="py-12 text-center text-white/60">
        Digest not found. <Link href="/digest" className="text-[#00FF41] hover:underline">Back to briefs</Link>
      </div>
    );
  }

  const insights = digest.strategic_insights ?? [];

  return (
    <div className="max-w-4xl space-y-8">
      <Link href="/digest" className="inline-flex items-center gap-2 text-[#00FF41] hover:underline text-sm" style={{ fontFamily: "var(--font-space-mono)" }}>
        ← Back to briefs
      </Link>

      <div className="bg-[#0a0a0a] border border-[#FFD700] rounded-lg p-6">
        <h1 className="text-[#FFD700] text-sm uppercase tracking-wider" style={{ fontFamily: "var(--font-space-mono)" }}>Weekly Intel Brief #{id === "dig-1" ? "003" : "002"}</h1>
        <p className="text-white/60 text-xs mt-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{digest.period_start} – {digest.period_end}</p>
        <p className="text-[#FF00FF] text-xs mt-2" style={{ fontFamily: "var(--font-space-mono)" }}>THREAT LEVEL THIS WEEK: HIGH</p>
        <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
          <div className="h-full rounded-full bg-[#FF00FF]" style={{ width: "75%" }} />
        </div>

        <section className="mt-8">
          <h2 className="text-[#FFD700] text-xs uppercase tracking-wider border-b border-[#FFD700]/50 pb-1 mb-3" style={{ fontFamily: "var(--font-space-mono)" }}>Executive Summary</h2>
          <p className="text-white/90 leading-relaxed" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{digest.executive_summary}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-[#FFD700] text-xs uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-space-mono)" }}>Key Insights</h2>
          <div className="space-y-4">
            {insights.map((insight: { competitor: string; what_happened: string; why_it_matters: string; recommended_action: string; urgency: string }, i: number) => (
              <div key={i} className="border-l-4 border-[#FF00FF] pl-4 py-2 bg-black/30 rounded-r">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-[#00FF41]" />
                  <span className="text-white font-medium" style={{ fontFamily: "var(--font-space-mono)" }}>{insight.competitor}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${insight.urgency === "high" ? "bg-[#FF00FF]/30 text-[#FF00FF]" : insight.urgency === "medium" ? "bg-[#FFD700]/30 text-[#FFD700]" : "bg-[#00FF41]/30 text-[#00FF41]"}`} style={{ fontFamily: "var(--font-space-mono)" }}>{insight.urgency.toUpperCase()}</span>
                </div>
                <p className="text-white/80 text-sm mb-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}><span className="text-white/50">WHAT HAPPENED: </span>{insight.what_happened}</p>
                <p className="text-white/80 text-sm mb-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}><span className="text-white/50">WHY IT MATTERS FOR YOU: </span>{insight.why_it_matters}</p>
                <p className="text-white/90 text-sm mt-2" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}><span className="text-[#00FF41]">RECOMMENDED ACTION: </span>{insight.recommended_action}</p>
              </div>
            ))}
          </div>
        </section>

        {digest.strategic_outlook && (
          <section className="mt-8">
            <h2 className="text-[#FFD700] text-xs uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-space-mono)" }}>Watch Next Week</h2>
            <ul className="space-y-1 text-white/80 text-sm" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
              <li>→ {digest.strategic_outlook}</li>
              <li>→ Notion pricing rollout details</li>
              <li>→ Slite product expansion</li>
            </ul>
          </section>
        )}

        <div className="mt-6">
          <button onClick={() => setSourcesOpen(!sourcesOpen)} className="text-[#00FFFF] text-xs hover:underline" style={{ fontFamily: "var(--font-space-mono)" }}>
            {sourcesOpen ? "▲" : "▼"} VIEW SOURCE SIGNALS (6)
          </button>
          {sourcesOpen && (
            <div className="mt-2 p-3 bg-black/50 rounded text-xs text-white/70" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
              Notion: New pricing tier • Notion: Hiring 3 ML engineers • Coda: Dark mode + API v2 • Coda: Product Hunt • Slite: Series A • Slite: Blog post
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
          <button className="px-4 py-2 rounded border border-[#00FFFF] text-[#00FFFF] text-xs" style={{ fontFamily: "var(--font-space-mono)" }}>SHARE</button>
          <button className="px-4 py-2 rounded border border-[#00FF41] text-[#00FF41] text-xs" style={{ fontFamily: "var(--font-space-mono)" }}>EMAIL</button>
          <button className="px-4 py-2 rounded text-white/50 text-xs" style={{ fontFamily: "var(--font-space-mono)" }}>REGENERATE</button>
        </div>
      </div>
    </div>
  );
}
