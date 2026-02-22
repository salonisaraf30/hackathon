"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
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

function configForType(type: string) {
  return signalTypeConfig[type] ?? {
    color: "hsl(180,100%,50%)",
    label: type.toUpperCase(),
    dotClass: "bg-neon-cyan",
    borderClass: "border-neon-cyan",
  };
}

function formatTimeAgo(value: string | null): string {
  if (!value) return "—";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "—";
  const hours = Math.floor((Date.now() - time) / (1000 * 60 * 60));
  if (hours < 1) return "NOW";
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}

export default function SignalsPage() {
  const [compFilter, setCompFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [competitors, setCompetitors] = useState<ApiCompetitor[]>([]);
  const [signals, setSignals] = useState<ApiSignal[]>([]);

  useEffect(() => {
    const load = async () => {
      const [competitorsRes, signalsRes] = await Promise.all([
        fetch("/api/competitors"),
        fetch("/api/signals?limit=400"),
      ]);

      const competitorsJson = await competitorsRes.json();
      const signalsJson = await signalsRes.json();

      setCompetitors(((competitorsJson.competitors as ApiCompetitor[] | undefined) ?? []).map((item) => ({
        id: item.id,
        name: item.name,
      })));

      setSignals(((signalsJson.signals as ApiSignal[] | undefined) ?? []).sort((a, b) => {
        return new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime();
      }));
    };

    void load();
  }, []);

  const compFilterOptions = useMemo(() => ["ALL", ...competitors.map((item) => item.name)], [competitors]);

  const filtered = useMemo(() => {
    return signals.filter((s) => {
      const competitorName = Array.isArray(s.competitors) ? s.competitors[0]?.name : s.competitors?.name;
      if (compFilter !== "ALL" && competitorName !== compFilter) return false;
      if (typeFilter !== "ALL" && s.signal_type !== typeMap[typeFilter]) return false;
      return true;
    });
  }, [compFilter, signals, typeFilter]);

  const typeCounts = useMemo(() => {
    return signals.reduce((acc, signal) => {
      acc[signal.signal_type] = (acc[signal.signal_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
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
      (max, competitor) => {
        const count = signals.filter((signal) => signal.competitor_id === competitor.id).length;
        return count > max.count ? { name: competitor.name, count } : max;
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
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        <div>
          <h1 className="font-pixel text-sm text-neon-cyan text-glow-cyan mb-2">📡 SIGNAL FEED</h1>
          <p className="font-terminal text-lg text-muted-foreground">Every move your competitors make. In real time.</p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {compFilterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setCompFilter(f)}
                className={`font-pixel text-[7px] px-3 py-2 border transition-colors ${
                  compFilter === f ? "bg-primary text-background border-primary" : "bg-transparent text-primary border-primary hover:bg-primary/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {typeFilterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`font-pixel text-[7px] px-3 py-2 border transition-colors ${
                  typeFilter === f ? "bg-neon-cyan text-background border-neon-cyan" : "bg-transparent text-neon-cyan border-neon-cyan hover:bg-neon-cyan/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-3">
            {filtered.map((s) => {
              const tc = configForType(s.signal_type);
              const competitorName = Array.isArray(s.competitors) ? s.competitors[0]?.name : s.competitors?.name;
              return (
                <div key={s.id} className={`bg-card border-l-4 ${tc.borderClass} border border-muted p-4 flex gap-4`}>
                  <div className="flex flex-col items-center gap-2 shrink-0 w-16">
                    <Badge variant="outline" className={`font-terminal text-[9px] ${tc.borderClass} rounded-none`} style={{ color: tc.color }}>{tc.label}</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[8px] mb-1 text-neon-cyan">{competitorName ?? "COMPETITOR"}</p>
                    <p className="font-terminal text-lg text-foreground mb-1">{s.title}</p>
                    <p className="font-terminal text-sm text-muted-foreground mb-2 line-clamp-2">{s.summary ?? "No summary available"}</p>
                    <p className="font-terminal text-[10px] text-muted-foreground/50">via {s.source}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-terminal text-xs text-muted-foreground mb-2">{formatTimeAgo(s.detected_at)}</p>
                    <p className="font-terminal text-sm text-neon-gold">⚡ {s.importance_score ?? 5}/10</p>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="font-terminal text-sm text-muted-foreground">No signals match the selected filters.</p>}
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-muted p-4">
              <h3 className="font-pixel text-[8px] text-foreground mb-3">SIGNAL BREAKDOWN</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 font-terminal text-xs">
                    <div className="w-2 h-2" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-muted p-4 space-y-3">
              <div><p className="font-terminal text-xs text-muted-foreground">THIS WEEK</p><p className="font-pixel text-lg text-primary">{signals.length}</p></div>
              <div><p className="font-terminal text-xs text-muted-foreground">MOST ACTIVE</p><p className="font-pixel text-[9px] text-neon-magenta">{mostActive.name}</p></div>
              <div><p className="font-terminal text-xs text-muted-foreground">HOTTEST TYPE</p><p className="font-pixel text-[9px] text-neon-gold">{hottestType.type ? configForType(hottestType.type).label : "—"}</p></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
