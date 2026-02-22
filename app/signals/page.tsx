"use client";

import { useState } from "react";
import { Tag, TrendingUp, Users, Rocket, MessageCircle, Zap } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { SIGNALS, COMPETITORS, formatTimeAgo, TYPE_COLORS } from "@/lib/dashboard-data";

const TYPE_ICONS: Record<string, React.ElementType> = { feature: Zap, pricing: Tag, social: MessageCircle, funding: TrendingUp, hiring: Users, launch: Rocket };
const COMP_TOGGLES = [{ id: "ALL", name: "ALL" }, ...COMPETITORS.map((c) => ({ id: c.id, name: c.name.toUpperCase() }))];
const TYPE_PILLS = ["ALL", "FEATURE", "PRICING", "SOCIAL", "HIRING", "FUNDING", "LAUNCH"];

const typeAccent = (type: string) => (TYPE_COLORS[type] === "#FF00FF" ? "#FF00FF" : TYPE_COLORS[type] === "#00FF41" ? "#00FF41" : "#00FFFF");

const PIE_DATA = [
  { name: "Feature", value: 4, color: "#00FF41" },
  { name: "Pricing", value: 2, color: "#FF00FF" },
  { name: "Social", value: 2, color: "#00FFFF" },
  { name: "Funding", value: 1, color: "#00FFFF" },
  { name: "Hiring", value: 2, color: "#00FFFF" },
  { name: "Launch", value: 1, color: "#00FF41" },
];

const compColor = (name: string) => (name === "Notion" ? "#FF00FF" : name === "Coda" ? "#00FFFF" : "#00FF41");

export default function SignalsPage() {
  const [compFilter, setCompFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filtered = SIGNALS.filter((s) => {
    if (compFilter !== "ALL" && s.competitor_id !== compFilter) return false;
    if (typeFilter !== "ALL" && s.type !== typeFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        {/* Competitor toggles — above page title */}
        <div className="flex flex-wrap gap-2">
          {COMP_TOGGLES.map((p) => {
            const isAll = p.id === "ALL";
            const color = isAll ? "#00FF41" : compColor(COMPETITORS.find((c) => c.id === p.id)?.name ?? p.name);
            const active = compFilter === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setCompFilter(p.id)}
                className="px-3 py-1.5 rounded text-[12px] transition-colors border"
                style={{
                  fontFamily: "var(--font-space-mono)",
                  ...(active ? { background: color, color: "#000000", borderColor: color } : { background: "transparent", color: color, borderColor: color }),
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        <div>
          <h1 className="text-[#00FFFF] text-lg uppercase tracking-wider" style={{ fontFamily: "var(--font-space-mono)" }}>Signal Feed</h1>
          <p className="text-white/50 text-sm mt-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Every competitor move. In real time.</p>
        </div>

        {/* Filter bar: type filters only + LAST 7 DAYS static label right */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {TYPE_PILLS.map((p) => (
              <button
                key={p}
                onClick={() => setTypeFilter(p)}
                className={`px-3 py-1.5 rounded text-[12px] ${typeFilter === p ? "bg-[#00FF41] text-black" : "bg-white/5 border border-white/20 text-white"}`}
                style={{ fontFamily: "var(--font-space-mono)" }}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[12px] text-[#888888]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>LAST 7 DAYS</span>
        </div>

        <div className="space-y-3">
          {filtered.map((s) => {
            const Icon = TYPE_ICONS[s.type] || Zap;
            const color = typeAccent(s.type);
            return (
              <div key={s.id} className="bg-[#0a0a0a] border rounded-lg p-4 flex flex-wrap gap-4" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-10 h-10 rounded border flex items-center justify-center" style={{ borderColor: color }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase" style={{ fontFamily: "var(--font-space-mono)", backgroundColor: `${color}30`, color }}>{s.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ fontFamily: "var(--font-space-mono)", color: compColor(s.competitor_name) }}>{s.competitor_name}</p>
                  <p className="text-white text-lg mt-0.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{s.title}</p>
                  <p className="text-white/60 text-sm mt-1 line-clamp-2" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{s.summary}</p>
                  <p className="text-white/40 text-xs mt-2" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>via {s.source}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white/50 text-xs" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{formatTimeAgo(s.detected_at)}</p>
                  <p className="text-[#00FFFF] text-sm mt-1" style={{ fontFamily: "var(--font-space-mono)" }}>⚡ {s.importance}/10</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="w-full lg:w-[25%] shrink-0">
        <div className="bg-[#0a0a0a] border border-[#00FF41]/50 rounded-lg p-4 sticky top-6">
          <h2 className="text-[#00FF41] text-xs uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-space-mono)" }}>Signal Breakdown</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                  {PIE_DATA.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Min 24px gap between chart and legend */}
          <div className="mt-6 space-y-2">
            {PIE_DATA.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-[12px] text-[#FFFFFF] truncate" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{e.name}</span>
                </div>
                <span className="text-[12px] font-medium shrink-0" style={{ fontFamily: "var(--font-space-mono)", color: e.color }}>{e.value}</span>
              </div>
            ))}
          </div>
          {/* 3 stat lines: label 11px #888888, value Space Mono 14px colored */}
          <div className="mt-6 space-y-2 pt-4 border-t border-white/10">
            <div>
              <p className="text-[11px] text-[#888888]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>This week</p>
              <p className="text-[14px] font-medium mt-0.5" style={{ fontFamily: "var(--font-space-mono)", color: "#00FF41" }}>14</p>
            </div>
            <div>
              <p className="text-[11px] text-[#888888]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Most active</p>
              <p className="text-[14px] font-medium mt-0.5" style={{ fontFamily: "var(--font-space-mono)", color: "#FF00FF" }}>NOTION</p>
            </div>
            <div>
              <p className="text-[11px] text-[#888888]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Top signal type</p>
              <p className="text-[14px] font-medium mt-0.5" style={{ fontFamily: "var(--font-space-mono)", color: "#00FFFF" }}>FEATURE UPDATE</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
