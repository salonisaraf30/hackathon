"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { signalTypeConfig } from "@/data/mock-data";

type ApiCompetitor = { id: string; name: string };
type ApiSignal = {
  id: string;
  competitor_id: string | null;
  signal_type: string;
  title: string;
  summary: string | null;
  source: string;
  importance_score: number | null;
  detected_at: string | null;
  competitors?: { name?: string } | { name?: string }[] | null;
};

const typeFilterOptions = ["ALL", "FEATURE", "PRICING", "SOCIAL", "HIRING", "FUNDING", "LAUNCH"];
const typeMap: Record<string, string> = {
  FEATURE: "feature_update",
  PRICING: "pricing_change",
  SOCIAL: "social_post",
  HIRING: "hiring",
  FUNDING: "funding",
  LAUNCH: "product_launch",
};

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

function configForType(type: string) {
  return signalTypeConfig[type] ?? { color: "#00FFFF", label: type.toUpperCase(), dotClass: "bg-neon-cyan", borderClass: "border-neon-cyan" };
}

function formatTimeAgo(v: string | null): string {
  if (!v) return "—";
  const t = new Date(v).getTime();
  if (Number.isNaN(t)) return "—";
  const h = Math.floor((Date.now() - t) / 3.6e6);
  if (h < 1) return "NOW";
  if (h < 24) return `${h}H AGO`;
  return `${Math.floor(h / 24)}D AGO`;
}

export default function SignalsPage() {
  const [compFilter, setCompFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [competitors, setCompetitors] = useState<ApiCompetitor[]>([]);
  const [signals, setSignals] = useState<ApiSignal[]>([]);

  useEffect(() => {
    const load = async () => {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/competitors"),
        fetch("/api/signals?limit=400"),
      ]);
      const cJson = await cRes.json();
      const sJson = await sRes.json();
      setCompetitors(((cJson.competitors as ApiCompetitor[] | undefined) ?? []).map((i) => ({ id: i.id, name: i.name })));
      setSignals(((sJson.signals as ApiSignal[] | undefined) ?? []).sort(
        (a, b) => new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime()
      ));
    };
    void load();
  }, []);

  const compFilterOptions = useMemo(() => ["ALL", ...competitors.map((c) => c.name)], [competitors]);

  const filtered = useMemo(() => {
    return signals.filter((s) => {
      const name = Array.isArray(s.competitors) ? s.competitors[0]?.name : s.competitors?.name;
      if (compFilter !== "ALL" && name !== compFilter) return false;
      if (typeFilter !== "ALL" && s.signal_type !== typeMap[typeFilter]) return false;
      return true;
    });
  }, [compFilter, signals, typeFilter]);

  const typeCounts = useMemo(() => {
    return signals.reduce((acc, s) => { acc[s.signal_type] = (acc[s.signal_type] || 0) + 1; return acc; }, {} as Record<string, number>);
  }, [signals]);

  const pieData = useMemo(() => {
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: configForType(type).label,
      value: count,
      color: configForType(type).color,
    }));
  }, [typeCounts]);

  const mostActive = useMemo(() => {
    return competitors.reduce(
      (max, c) => {
        const count = signals.filter((s) => s.competitor_id === c.id).length;
        return count > max.count ? { name: c.name, count } : max;
      },
      { name: "—", count: 0 },
    );
  }, [competitors, signals]);

  const hottestType = useMemo(() => {
    return Object.entries(typeCounts).reduce(
      (max, [type, count]) => (count > max.count ? { type, count } : max),
      { type: "", count: 0 },
    );
  }, [typeCounts]);

  return (
    <div className="space-y-6">
      {/* Competitor toggles above title */}
      <div className="flex flex-wrap gap-2">
        {compFilterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setCompFilter(f)}
            className="px-3 py-1.5 rounded text-[12px] transition-colors"
            style={{
              ...SM,
              backgroundColor: compFilter === f ? "#00FF41" : "transparent",
              color: compFilter === f ? "#000" : "#00FF41",
              border: "1px solid #00FF41",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl text-[#00FFFF] mb-1" style={SM}>SIGNAL FEED</h1>
        <p className="text-[13px] text-[#888888]" style={IBM}>Every move your competitors make. In real time.</p>
      </div>

      {/* Type filter bar */}
      <div className="flex flex-wrap gap-2">
        {typeFilterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className="px-3 py-1.5 rounded text-[12px] transition-colors"
            style={{
              ...SM,
              backgroundColor: typeFilter === f ? "#00FFFF" : "transparent",
              color: typeFilter === f ? "#000" : "#00FFFF",
              border: "1px solid #00FFFF",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main grid: signals left, sidebar right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Signal cards — full width, colored left border */}
        <div className="lg:col-span-3 space-y-3">
          {filtered.map((s) => {
            const cfg = configForType(s.signal_type);
            const compName = Array.isArray(s.competitors) ? s.competitors[0]?.name : s.competitors?.name;
            return (
              <div
                key={s.id}
                className="p-4 rounded-lg flex gap-4"
                style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", borderLeftWidth: 4, borderLeftColor: cfg.color }}
              >
                <div className="shrink-0 w-16 flex flex-col items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: `${cfg.color}30`, ...SM }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#00FFFF] mb-1" style={SM}>{compName ?? "COMPETITOR"}</p>
                  <p className="text-[16px] text-white mb-1" style={IBM}>{s.title}</p>
                  <p className="text-[13px] text-[#888888] mb-2 line-clamp-2" style={{ ...IBM, lineHeight: 1.6 }}>
                    {s.summary ?? "No summary available"}
                  </p>
                  <p className="text-[11px] text-[#888888]/50" style={IBM}>via {s.source}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] text-[#888888] mb-2" style={IBM}>{formatTimeAgo(s.detected_at)}</p>
                  <p className="text-[13px] text-[#00FFFF]" style={SM}>{s.importance_score ?? 5}/10</p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-[13px] text-[#888888]" style={IBM}>No signals match the selected filters.</p>}
        </div>

        {/* Sidebar: donut chart + legend + stats */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-[13px] text-white mb-3" style={SM}>SIGNAL BREAKDOWN</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-[12px]" style={IBM}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[#888888]">{d.name}</span>
                  <span className="ml-auto text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-lg space-y-4" style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <p className="text-[11px] text-[#888888]" style={IBM}>THIS WEEK</p>
              <p className="text-2xl text-[#00FF41]" style={SM}>{signals.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#888888]" style={IBM}>MOST ACTIVE</p>
              <p className="text-[13px] text-[#FF00FF]" style={SM}>{mostActive.name}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#888888]" style={IBM}>HOTTEST TYPE</p>
              <p className="text-[13px] text-[#00FFFF]" style={SM}>{hottestType.type ? configForType(hottestType.type).label : "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
