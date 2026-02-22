"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts";
import { COMPETITORS, SIGNALS, RADAR_DATA, formatTimeAgo, TYPE_COLORS } from "@/lib/dashboard-data";

const RADAR_VS = [
  { subject: "Pricing", Notion: 85, "YOUR PRODUCT": 45, fullMark: 100 },
  { subject: "Product", Notion: 90, "YOUR PRODUCT": 60, fullMark: 100 },
  { subject: "Marketing", Notion: 88, "YOUR PRODUCT": 40, fullMark: 100 },
  { subject: "Hiring", Notion: 75, "YOUR PRODUCT": 35, fullMark: 100 },
  { subject: "Funding", Notion: 70, "YOUR PRODUCT": 30, fullMark: 100 },
];

export default function CompetitorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState<"signals" | "radar" | "settings">("signals");

  const comp = COMPETITORS.find((c) => c.id === id) ?? COMPETITORS[0];
  const signals = SIGNALS.filter((s) => s.competitor_id === id);
  const threatColor = comp.threat === "critical" ? "#FF00FF" : comp.threat === "medium" ? "#00FFFF" : "#00FF41";

  return (
    <div className="space-y-6">
      <Link href="/competitors" className="inline-flex items-center gap-2 text-[#00FF41] hover:underline text-sm" style={{ fontFamily: "var(--font-space-mono)" }}>
        ← BACK TO ROSTER
      </Link>

      {/* Top company header card — avatar left, stacked rows right */}
      <div className="bg-[#0a0a0a] border rounded-lg p-6 flex gap-6" style={{ borderColor: threatColor, borderWidth: 1 }}>
        <div className="w-[120px] h-[120px] rounded-xl border-2 flex items-center justify-center text-4xl font-bold shrink-0" style={{ borderColor: threatColor, color: threatColor }}>{comp.name.charAt(0)}</div>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* Row 1: Company name */}
          <p className="text-white text-3xl font-medium" style={{ fontFamily: "var(--font-space-mono)" }}>{comp.name}</p>
          {/* Row 2: Category pill + website URL same line */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block px-2 py-0.5 rounded text-[12px] bg-[#00FFFF]/20 text-[#00FFFF]" style={{ fontFamily: "var(--font-space-mono)" }}>{comp.category}</span>
            <span className="text-[12px] text-[#888888]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{comp.website_url}</span>
          </div>
          {/* Row 3: Twitter if present */}
          {comp.twitter && (
            <p className="text-[12px] text-[#888888]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>@{comp.twitter}</p>
          )}
          {/* Row 4: Three stat blocks — label 11px #888888, value Space Mono 16px colored */}
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[11px] text-[#888888] mb-0.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>MONITORING SINCE</p>
              <p className="text-[16px] font-medium" style={{ fontFamily: "var(--font-space-mono)", color: "#00FFFF" }}>{comp.monitoring_since}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#888888] mb-0.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>TOTAL SIGNALS</p>
              <p className="text-[16px] font-medium" style={{ fontFamily: "var(--font-space-mono)", color: "#00FF41" }}>{comp.signal_count}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#888888] mb-0.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>LAST ACTIVE</p>
              <p className="text-[16px] font-medium text-white" style={{ fontFamily: "var(--font-space-mono)" }}>{comp.last_seen}</p>
            </div>
          </div>
          {/* Row 5: Threat score label + full width bar + percentage right-aligned magenta */}
          <div>
            <p className="text-[11px] text-[#888888] mb-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>THREAT SCORE</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#FF00FF]" style={{ width: `${comp.threatScore}%` }} />
              </div>
              <span className="text-[16px] font-bold shrink-0" style={{ fontFamily: "var(--font-space-mono)", color: "#FF00FF" }}>{comp.threatScore}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-white/10">
        {(["signals", "radar", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 text-xs uppercase tracking-wider ${tab === t ? "text-[#00FF41] border-b-2 border-[#00FF41]" : "text-white/60"}`} style={{ fontFamily: "var(--font-space-mono)" }}>{t}</button>
        ))}
      </div>

      {tab === "signals" && (
        <div className="space-y-3">
          {signals.map((s) => (
            <div key={s.id} className="bg-[#0a0a0a] border rounded-lg p-4 flex flex-wrap gap-4" style={{ borderLeftWidth: 4, borderLeftColor: TYPE_COLORS[s.type] || "#00FF41" }}>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase" style={{ fontFamily: "var(--font-space-mono)", backgroundColor: `${TYPE_COLORS[s.type]}30`, color: TYPE_COLORS[s.type] }}>{s.type}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{s.title}</p>
                <p className="text-white/60 text-sm mt-0.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{s.summary}</p>
              </div>
              <span className="text-white/50 text-xs" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{formatTimeAgo(s.detected_at)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "radar" && (
        <div className="bg-[#0a0a0a] border border-[#00FF41]/30 rounded-lg p-6">
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_VS}>
                <PolarGrid stroke="#00FF41" strokeOpacity={0.15} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#fff", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#fff", fontSize: 8 }} />
                <Radar name="Notion" dataKey="Notion" stroke="#FF00FF" fill="#FF00FF" fillOpacity={0.3} />
                <Radar name="YOUR PRODUCT" dataKey="YOUR PRODUCT" stroke="#00FFFF" strokeDasharray="4 4" fill="#00FFFF" fillOpacity={0.1} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 p-4 bg-black/30 rounded">
            <p className="text-white/80 text-sm" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Notion leads on Marketing by 30%</p>
            <p className="text-white/80 text-sm" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Notion leads on Product by 30%</p>
            <p className="text-white/80 text-sm" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Your product closer on Funding</p>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 max-w-xl space-y-6">
          <div>
            <label className="block text-white/70 text-xs mb-2" style={{ fontFamily: "var(--font-space-mono)" }}>Website URL</label>
            <input defaultValue={comp.website_url} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
          </div>
          <div>
            <label className="block text-white/70 text-xs mb-2" style={{ fontFamily: "var(--font-space-mono)" }}>Twitter</label>
            <input defaultValue={comp.twitter} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
          </div>
          <div>
            <label className="block text-white/70 text-xs mb-2" style={{ fontFamily: "var(--font-space-mono)" }}>Product Hunt slug</label>
            <input defaultValue={comp.product_hunt} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
          </div>
          <div>
            <p className="text-white/70 text-xs mb-3" style={{ fontFamily: "var(--font-space-mono)" }}>Alert toggles</p>
            <div className="space-y-2">
              {["Feature", "Pricing", "Social", "Hiring", "Funding"].map((t) => (
                <div key={t} className="flex items-center justify-between">
                  <span className="text-white/70 text-sm" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{t}</span>
                  <button type="button" className="w-10 h-5 rounded-full bg-[#00FF41]/30 relative" aria-label={`Toggle ${t}`}>
                    <span className="absolute left-1 top-1 w-3 h-3 rounded-full bg-[#00FF41]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button className="mt-8 px-4 py-2 rounded text-red-400/80 text-xs border border-red-400/30" style={{ fontFamily: "var(--font-space-mono)" }}>DELETE COMPETITOR</button>
        </div>
      )}
    </div>
  );
}
