"use client";

import Link from "next/link";
import {
  COMPETITORS,
  SIGNALS,
  RADAR_DATA,
  formatTimeAgo,
  TYPE_COLORS,
} from "@/lib/dashboard-data";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

const QUICK_STATS_3 = [
  { label: "COMPETITORS TRACKED", value: "3", color: "#00FF41" },
  { label: "SIGNALS THIS WEEK", value: "14", color: "#00FFFF" },
  { label: "THREAT ALERTS", value: "2", color: "#FF00FF" },
];

const topCompetitor = COMPETITORS[0];
const threatColor = (t: string) => (t === "critical" ? "#FF00FF" : t === "medium" ? "#00FFFF" : "#00FF41");
const typeAccent = (type: string) => (TYPE_COLORS[type] === "#FF00FF" ? "#FF00FF" : TYPE_COLORS[type] === "#00FF41" ? "#00FF41" : "#00FFFF");

export default function DashboardPage() {
  const signalsThisWeek = SIGNALS.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Quick stats — flex row, no cards; 3 metrics + NEXT DIGEST; hr below */}
      <div className="flex flex-nowrap overflow-visible w-full min-h-[80px] items-center" style={{ gap: "32px" }}>
        {QUICK_STATS_3.map(({ label, value, color }) => (
          <div key={label} className="flex items-center shrink-0" style={{ minWidth: 200, gap: 16 }}>
            <span className="block text-[11px]" style={{ fontFamily: "var(--font-ibm-plex-mono)", color: "#888888" }}>{label}</span>
            <span className="block text-5xl font-semibold tabular-nums" style={{ fontFamily: "var(--font-space-mono)", color }}>{value}</span>
          </div>
        ))}
        <div className="py-2">
          <p className="text-[13px] leading-[1.6]" style={{ fontFamily: "var(--font-ibm-plex-mono)", color: "#888888" }}>NEXT DIGEST</p>
          <p className="text-2xl font-semibold mt-0.5 text-white" style={{ fontFamily: "var(--font-space-mono)" }}>MON 9AM</p>
        </div>
      </div>
      <hr className="w-full border-0 h-px" style={{ background: "rgba(0, 255, 65, 0.15)" }} />

      {/* Hero — top competitor */}
      <div
        className="bg-[#0D0D0D] border rounded-lg p-6 flex flex-wrap items-start gap-6 relative overflow-hidden"
        style={{ borderColor: "#FF00FF", borderWidth: 1 }}
      >
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[13px] bg-[#00FFFF]/20 text-[#00FFFF]" style={{ fontFamily: "var(--font-space-mono)" }}>HIGH PRIORITY</span>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-20 h-20 rounded-lg border-2 flex items-center justify-center text-2xl font-bold shrink-0" style={{ borderColor: "#FF00FF", color: "#FF00FF", clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" }}>N</div>
          <div className="min-w-0">
            <p className="text-white font-bold text-3xl" style={{ fontFamily: "var(--font-space-mono)" }}>{topCompetitor.name}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[13px] bg-[#00FFFF]/20 text-[#00FFFF]" style={{ fontFamily: "var(--font-space-mono)" }}>{topCompetitor.category}</span>
            <p className="text-[13px] mt-2 font-semibold text-[#FF00FF]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>THREAT LEVEL: CRITICAL</p>
            <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div className="h-full rounded-full bg-[#FF00FF]" style={{ width: "85%" }} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto sm:min-w-[200px]" style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: 13, lineHeight: 1.6 }}>
          <div>
            <p className="text-[13px] text-[#888888]">Signals this week</p>
            <p className="text-white">6</p>
          </div>
          <div>
            <p className="text-[13px] text-[#888888]">Last active</p>
            <p className="text-white">2h ago</p>
          </div>
          <div>
            <p className="text-[13px] text-[#888888]">Latest move</p>
            <p className="text-white">New pricing tier</p>
          </div>
        </div>
        <div className="w-40 h-12 min-h-[48px] min-w-[120px] hidden lg:block">
          <ResponsiveContainer width="100%" height="100%" minHeight={48}>
            <LineChart data={topCompetitor.sparkline.map((v, i) => ({ name: i, v }))}>
              <Line type="monotone" dataKey="v" stroke="#00FF41" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* COMPETITOR ROSTER — heading left, ADD COMPETITOR right, one line */}
      <div className="flex items-center justify-between gap-4 flex-nowrap">
        <h2 className="text-[#00FF41] text-lg uppercase tracking-wider shrink-0" style={{ fontFamily: "var(--font-space-mono)" }}>COMPETITOR ROSTER</h2>
        <Link
          href="/competitors?add=1"
          className="px-4 py-2 rounded bg-[#00FF41] text-black text-sm font-medium hover:brightness-110 shrink-0 whitespace-nowrap"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          + ADD COMPETITOR
        </Link>
      </div>

      {/* Competitor cards grid — glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COMPETITORS.map((c) => (
          <Link
            key={c.id}
            href={`/competitors/${c.id}`}
            className="group rounded-lg p-4 transition-all relative border border-white/[0.08] hover:border-[var(--hover-border)]"
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              ["--hover-border" as string]: threatColor(c.threat),
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-bold shrink-0" style={{ borderColor: threatColor(c.threat), color: threatColor(c.threat) }}>{c.name.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="text-white font-medium text-lg" style={{ fontFamily: "var(--font-space-mono)" }}>{c.name}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[13px] bg-white/10 text-white/80" style={{ fontFamily: "var(--font-space-mono)" }}>{c.category}</span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-[13px] text-[#888888] italic truncate leading-[1.6]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Latest: New pricing tier for teams</p>
            <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${c.threatScore}%`, backgroundColor: threatColor(c.threat) }} />
            </div>
            <div className="mt-3 flex justify-between items-center text-[11px] leading-[1.6]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
              <span><span className="text-[#888888]">SIGNALS</span> <span className="text-white">{c.signal_count}</span></span>
              <span><span className="text-[#888888]">LAST SEEN</span> <span className="text-white">{c.last_seen}</span></span>
            </div>
            <p className="mt-2 text-[13px] text-[#00FF41] opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-space-mono)" }}>VIEW INTEL →</p>
          </Link>
        ))}
      </div>

      {/* Weekly Intelligence Brief CTA — first, static green border */}
      <div
        className="bg-[#0a0a0a] border rounded-lg p-6 flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: "#00FF41", borderWidth: 1 }}
      >
        <div>
          <p className="text-[#00FF41] font-medium text-[13px] leading-[1.6]" style={{ fontFamily: "var(--font-space-mono)" }}>Weekly Intelligence Brief Ready</p>
          <p className="text-[#888888] text-[13px] mt-1 leading-[1.6]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>AI analysis personalized to your product positioning</p>
        </div>
        <Link
          href="/digest"
          className="px-6 py-3 rounded bg-[#00FF41] text-black font-medium hover:brightness-110 transition-all text-[13px]"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          GENERATE BRIEF →
        </Link>
      </div>

      {/* Live Signals (65%) + Threat Radar (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[65%_1fr] gap-6">
        <div className="bg-[#0a0a0a] border rounded-lg p-4" style={{ borderColor: "#00FFFF", borderWidth: 1 }}>
          <h2 className="text-[#00FFFF] text-[13px] uppercase tracking-wider flex items-center gap-2 mb-4 leading-[1.6]" style={{ fontFamily: "var(--font-space-mono)" }}>
            LIVE SIGNALS <span className="w-2 h-2 rounded-full bg-[#00FF41]" />
          </h2>
          <div className="space-y-2">
            {signalsThisWeek.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: typeAccent(s.type) }} />
                <span className="text-white w-20 shrink-0 text-[13px]" style={{ fontFamily: "var(--font-space-mono)" }}>{s.competitor_name}</span>
                <span className="text-white flex-1 truncate text-[13px] leading-[1.6]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{s.title}</span>
                <span className="text-[#888888] text-[13px] shrink-0 leading-[1.6]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{formatTimeAgo(s.detected_at)}</span>
                <span className="text-[13px] px-1.5 py-0.5 rounded uppercase" style={{ fontFamily: "var(--font-space-mono)", backgroundColor: `${typeAccent(s.type)}30`, color: typeAccent(s.type) }}>{s.type}</span>
              </div>
            ))}
          </div>
          <button className="mt-3 text-[#00FF41] text-[13px] hover:underline leading-[1.6]" style={{ fontFamily: "var(--font-space-mono)" }}>LOAD MORE →</button>
        </div>
        <div className="bg-[#0a0a0a] border rounded-lg p-4" style={{ borderColor: "#FF00FF", borderWidth: 1 }}>
          <h2 className="text-[#FF00FF] text-[13px] uppercase tracking-wider mb-4 leading-[1.6]" style={{ fontFamily: "var(--font-space-mono)" }}>THREAT RADAR</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#00FF41" strokeOpacity={0.15} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#fff", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#fff", fontSize: 10 }} />
                <Radar name="Notion" dataKey="Notion" stroke="#FF00FF" fill="#FF00FF" fillOpacity={0.3} />
                <Radar name="Coda" dataKey="Coda" stroke="#00FFFF" fill="#00FFFF" fillOpacity={0.2} />
                <Radar name="Slite" dataKey="Slite" stroke="#00FF41" fill="#00FF41" fillOpacity={0.2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
