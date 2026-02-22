"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { signalTypeConfig, threatColors } from "@/data/mock-data";

type ApiCompetitor = {
  id: string;
  name: string;
  website_url: string | null;
  twitter_handle: string | null;
  created_at: string | null;
  signals?: { count?: number }[];
};

type ApiSignal = {
  id: string;
  competitor_id: string | null;
  signal_type: string;
  title: string;
  detected_at: string | null;
  importance_score: number | null;
};

type UiCompetitor = {
  id: string;
  name: string;
  initials: string;
  category: string;
  threat: "low" | "medium" | "high";
  threatScore: number;
  signals: number;
  signalsThisWeek: number;
  lastActive: string;
  biggestMove: string;
  website: string;
  monitoringSince: string;
  color: string;
  lastSignalType: string;
};

const FILTERS = ["ALL", "CRITICAL", "MEDIUM", "LOW", "RECENT"];
const THREAT_HEX: Record<string, string> = { high: "#FF00FF", medium: "#00FFFF", low: "#00FF41" };

function formatTimeAgo(v: string | null): string {
  if (!v) return "—";
  const t = new Date(v).getTime();
  if (Number.isNaN(t)) return "—";
  const h = Math.floor((Date.now() - t) / 3.6e6);
  if (h < 1) return "NOW";
  if (h < 24) return `${h}H AGO`;
  return `${Math.floor(h / 24)}D AGO`;
}
function safeHost(u: string | null) {
  if (!u) return "—";
  try { return new URL(u).host; } catch { return u; }
}

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

export default function CompetitorsPage() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [competitors, setCompetitors] = useState<UiCompetitor[]>([]);
  const [signals, setSignals] = useState<ApiSignal[]>([]);
  const router = useRouter();

  const loadData = useCallback(async () => {
    const [cRes, sRes] = await Promise.all([
      fetch("/api/competitors"),
      fetch("/api/signals?limit=300"),
    ]);
    const cJson = await cRes.json();
    const sJson = await sRes.json();
    const sRows = ((sJson.signals as ApiSignal[] | undefined) ?? []).sort(
      (a, b) => new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime()
    );
    setSignals(sRows);

    const categories = ["PRODUCTIVITY", "DOCS & COLLAB", "KNOWLEDGE BASE"];
    const mapped = ((cJson.competitors as ApiCompetitor[] | undefined) ?? []).map((item, i) => {
      const cs = sRows.filter((s) => s.competitor_id === item.id);
      const latest = cs[0];
      const total = cs.length || item.signals?.[0]?.count || 0;
      const weekly = cs.filter((s) => s.detected_at && Date.now() - new Date(s.detected_at).getTime() <= 7 * 24 * 3.6e6).length;
      const score = Math.min(95, 25 + total * 4 + weekly * 8);
      const threat = score >= 70 ? "high" : score >= 45 ? "medium" : "low";
      return {
        id: item.id, name: item.name, initials: item.name.slice(0, 2).toUpperCase(),
        category: categories[i % 3], threat, threatScore: score,
        signals: total, signalsThisWeek: weekly,
        lastActive: formatTimeAgo(latest?.detected_at ?? null),
        biggestMove: latest?.title ?? "No major move detected",
        website: safeHost(item.website_url),
        monitoringSince: item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase() : "—",
        color: THREAT_HEX[threat],
        lastSignalType: latest ? (signalTypeConfig[latest.signal_type]?.label ?? latest.signal_type) : "—",
      } as UiCompetitor;
    });
    setCompetitors(mapped);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return competitors.filter((c) => {
      if (activeFilter === "CRITICAL" && c.threat !== "high") return false;
      if (activeFilter === "MEDIUM" && c.threat !== "medium") return false;
      if (activeFilter === "LOW" && c.threat !== "low") return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeFilter, competitors, search]);

  const addCompetitor = useCallback(async () => {
    if (!companyName.trim() || !websiteUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName.trim(), website_url: websiteUrl.trim(), description: "Added from competitor roster" }),
      });
      if (!res.ok) throw new Error("Failed");
      setCompanyName(""); setWebsiteUrl(""); setModalOpen(false);
      await loadData();
    } finally { setSaving(false); }
  }, [companyName, websiteUrl, loadData]);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg text-[#00FF41] uppercase tracking-wider shrink-0" style={SM}>
          COMPETITOR ROSTER
        </h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="terminal-input flex-1 px-3 py-2 rounded text-[13px]"
          style={IBM}
          placeholder="Search competitors..."
        />
        <button
          className="px-4 py-2 rounded text-black text-[13px] hover:brightness-110 transition shrink-0"
          style={{ backgroundColor: "#FF00FF", ...SM }}
          onClick={() => setModalOpen(true)}
        >
          + ADD COMPETITOR
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-3 py-1.5 rounded text-[12px] transition-colors"
            style={{
              ...SM,
              backgroundColor: activeFilter === f ? "#00FF41" : "transparent",
              color: activeFilter === f ? "#000" : "#00FF41",
              border: `1px solid #00FF41`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((c) => {
          const hex = THREAT_HEX[c.threat];
          const compSignals = signals.filter((s) => s.competitor_id === c.id).slice(0, 3);
          return (
            <div key={c.id} className="rounded-lg overflow-hidden" style={{ border: `1px solid rgba(255,255,255,0.08)` }}>
              {/* Top colored bar */}
              <div className="h-1" style={{ backgroundColor: hex }} />
              <div className="p-5" style={{ backgroundColor: "#0a0a0a" }}>
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{ border: `2px solid ${hex}`, color: hex, ...SM }}
                  >
                    {c.initials}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] text-white mb-1" style={SM}>{c.name}</h3>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] mb-1"
                      style={{ color: "#00FFFF", backgroundColor: "rgba(0,255,255,0.2)", ...IBM }}>
                      {c.category}
                    </span>
                    <p className="text-[12px] text-[#888888]" style={IBM}>{c.website}</p>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Total Signals", val: String(c.signals), col: "#fff" },
                    { label: "This Week", val: String(c.signalsThisWeek), col: "#fff" },
                    { label: "Threat Score", val: `${c.threatScore}/100`, col: hex },
                    { label: "Monitoring Since", val: c.monitoringSince, col: "#fff" },
                    { label: "Last Signal Type", val: c.lastSignalType, col: "#fff" },
                  ].map((s) => (
                    <div key={s.label}>
                      <span className="text-[11px] text-[#888888] block" style={IBM}>{s.label}</span>
                      <span className="text-[15px]" style={{ color: s.col, ...IBM }}>{s.val}</span>
                    </div>
                  ))}
                </div>

                {/* Threat meter */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] text-[#888888] mb-1" style={IBM}>
                    <span>THREAT METER</span>
                    <span className="text-[13px]" style={{ color: hex, ...SM }}>{c.threatScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${c.threatScore}%`, backgroundColor: hex }} />
                  </div>
                </div>

                {/* Recent signals */}
                <div className="space-y-1 mb-4">
                  {compSignals.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-[12px]" style={IBM}>
                      <div className="w-2 h-2 rounded-full bg-[#00FFFF]" />
                      <span className="text-[#888888] truncate flex-1">{s.title}</span>
                      <span className="text-[#888888] shrink-0">{formatTimeAgo(s.detected_at)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 rounded text-[11px] border transition-colors hover:bg-white/5"
                    style={{ color: "#00FF41", borderColor: "#00FF41", ...SM }}
                    onClick={() => router.push(`/competitors/${c.id}`)}
                  >
                    VIEW INTEL
                  </button>
                  <button
                    className="px-3 py-2 rounded text-[11px] border transition-colors hover:bg-white/5"
                    style={{ color: "#00FFFF", borderColor: "#00FFFF", ...SM }}
                  >
                    EDIT
                  </button>
                  <button
                    className="px-3 py-2 rounded text-[11px] border transition-colors hover:bg-red-400/5"
                    style={{ color: "rgb(248,113,113)", borderColor: "rgba(248,113,113,0.3)", ...SM }}
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add card */}
        <div
          className="rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer hover:glow-green transition-shadow min-h-[300px]"
          style={{ border: "1px dashed #00FF41" }}
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-10 w-10 text-[#00FF41]" />
          <span className="text-[13px] text-[#00FF41]" style={SM}>ADD NEW COMPETITOR</span>
        </div>
      </div>

      {/* ── Add Competitor Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md p-6 rounded-lg" style={{ backgroundColor: "#0a0a0a", border: "1px solid #00FF41" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] text-[#00FF41]" style={SM}>ADD NEW COMPETITOR</h2>
              <button onClick={() => setModalOpen(false)} className="text-[#888888] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[13px] text-[#888888] block mb-1" style={IBM}>Company Name</label>
                <input
                  className="terminal-input w-full px-3 py-2 rounded text-[13px]"
                  style={IBM}
                  placeholder="Enter name..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] text-[#888888] block mb-1" style={IBM}>Website URL</label>
                <input
                  className="terminal-input w-full px-3 py-2 rounded text-[13px]"
                  style={IBM}
                  placeholder="https://..."
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 px-4 py-2 rounded text-[13px] text-black hover:brightness-110 transition"
                  style={{ backgroundColor: "#FF00FF", ...SM }}
                  onClick={() => void addCompetitor()}
                  disabled={saving}
                >
                  {saving ? "SAVING..." : "CONFIRM"}
                </button>
                <button
                  className="px-4 py-2 rounded text-[13px] text-[#888888] border border-white/20 hover:bg-white/5 transition"
                  style={SM}
                  onClick={() => setModalOpen(false)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
