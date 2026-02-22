"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { COMPETITORS, SIGNALS, formatTimeAgo } from "@/lib/dashboard-data";

const threatColor = (t: string) => (t === "critical" ? "#FF00FF" : t === "medium" ? "#00FFFF" : "#00FF41");
const FILTER_PILLS = ["ALL", "CRITICAL", "MEDIUM", "LOW", "RECENT"];

function signalsThisWeek(compId: string): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return SIGNALS.filter((s) => s.competitor_id === compId && new Date(s.detected_at) >= weekAgo).length;
}

function lastSignalType(compId: string): string {
  const recent = SIGNALS.filter((s) => s.competitor_id === compId).sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())[0];
  return recent ? recent.type : "—";
}

export default function CompetitorsPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", twitter: "", productHunt: "" });

  const filtered = COMPETITORS.filter((c) => {
    if (filter !== "ALL" && filter !== "RECENT" && c.threat !== filter.toLowerCase()) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getRecentSignals = (compId: string) => SIGNALS.filter((s) => s.competitor_id === compId).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header row: search (full remaining width) + ADD COMPETITOR (right) */}
      <div className="flex items-center gap-4 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00FF41]/70" />
          <input
            type="text"
            placeholder="SEARCH..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black border border-[#00FF41] text-white placeholder-white/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#00FF41]"
            style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
          />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded bg-[#00FF41] text-black text-sm font-medium hover:brightness-110 shrink-0"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          + ADD COMPETITOR
        </button>
      </div>

      {/* Filter pills only */}
      <div className="flex flex-wrap gap-2">
        {FILTER_PILLS.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              filter === p ? "bg-[#00FF41] text-black" : "bg-transparent border border-[#00FF41] text-[#00FF41]"
            }`}
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((c) => {
          const recent = getRecentSignals(c.id);
          const thisWeek = signalsThisWeek(c.id);
          const lastType = lastSignalType(c.id);
          return (
            <div
              key={c.id}
              className="bg-[#0a0a0a] border rounded-lg overflow-hidden hover:shadow-lg transition-all"
              style={{ borderColor: threatColor(c.threat) }}
            >
              <div className="h-1" style={{ backgroundColor: threatColor(c.threat) }} />
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <span className="text-[11px] uppercase" style={{ fontFamily: "var(--font-space-mono)", color: threatColor(c.threat) }}>{c.threat}</span>
                <span className="text-[11px] text-[#888888]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Last active {c.last_seen}</span>
              </div>
              <div className="p-4 flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg border-2 flex items-center justify-center text-xl font-bold shrink-0" style={{ borderColor: threatColor(c.threat), color: threatColor(c.threat) }}>{c.name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium" style={{ fontFamily: "var(--font-space-mono)", fontSize: 14 }}>{c.name}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-white/10" style={{ fontFamily: "var(--font-space-mono)" }}>{c.category}</span>
                </div>
              </div>
              {/* Stats grid: Total Signals / This Week / Threat Score / Monitoring Since / Last Signal Type — no Category */}
              <div className="px-4 pb-4 grid grid-cols-2 gap-y-2 gap-x-6" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                <span className="text-[11px] text-[#888888]">Total Signals</span>
                <span className="text-[15px] text-[#FFFFFF]">{c.signal_count}</span>
                <span className="text-[11px] text-[#888888]">This Week</span>
                <span className="text-[15px] text-[#FFFFFF]">{thisWeek}</span>
                <span className="text-[11px] text-[#888888]">Threat Score</span>
                <span className="text-[15px] text-[#FFFFFF]">{c.threatScore}/100</span>
                <span className="text-[11px] text-[#888888]">Monitoring Since</span>
                <span className="text-[15px] text-[#FFFFFF]">{c.monitoring_since}</span>
                <span className="text-[11px] text-[#888888]">Last Signal Type</span>
                <span className="text-[15px] text-[#FFFFFF]">{lastType}</span>
              </div>
              <div className="px-4 pb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#888888]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Threat level</span>
                <span className="text-[13px] font-medium" style={{ fontFamily: "var(--font-space-mono)", color: threatColor(c.threat) }}>{c.threatScore}%</span>
              </div>
              <div className="px-4 pb-4 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${c.threatScore}%`, backgroundColor: threatColor(c.threat) }} />
              </div>
              <div className="px-4 pb-4 space-y-1">
                <p className="text-[11px] text-[#888888] uppercase mb-2" style={{ fontFamily: "var(--font-space-mono)" }}>Recent signals</p>
                {recent.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                    <span className="text-[12px] text-[#888888] italic truncate flex-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{s.title}</span>
                    <span className="text-[11px] text-[#888888] shrink-0" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{formatTimeAgo(s.detected_at)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <Link href={`/competitors/${c.id}`} className="px-3 py-1.5 rounded bg-[#00FF41]/20 text-[#00FF41] text-[11px] hover:bg-[#00FF41]/30" style={{ fontFamily: "var(--font-space-mono)" }}>VIEW INTEL</Link>
                <button className="px-3 py-1.5 rounded border border-[#00FFFF]/50 text-[#00FFFF] text-[11px]" style={{ fontFamily: "var(--font-space-mono)" }}>EDIT</button>
                <button className="px-3 py-1.5 rounded text-red-400/80 text-[11px]" style={{ fontFamily: "var(--font-space-mono)" }}>REMOVE</button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-[#0a0a0a] border border-[#00FF41] rounded-lg p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,255,65,0.2)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[#00FF41] text-sm mb-6" style={{ fontFamily: "var(--font-space-mono)" }}>ADD COMPETITOR</h2>
            <div className="space-y-4">
              <input placeholder="Company Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
              <input placeholder="Website URL" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
              <input placeholder="Twitter Handle" value={form.twitter} onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
              <input placeholder="Product Hunt Slug" value={form.productHunt} onChange={(e) => setForm((f) => ({ ...f, productHunt: e.target.value }))} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded bg-[#00FF41] text-black text-sm" style={{ fontFamily: "var(--font-space-mono)" }}>CONFIRM</button>
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border border-white/30 text-white/70 text-sm" style={{ fontFamily: "var(--font-space-mono)" }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
