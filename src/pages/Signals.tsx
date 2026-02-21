import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signals, competitors, signalTypeConfig } from "@/data/mock-data";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const compFilterOptions = ["ALL", ...competitors.map((c) => c.name)];
const typeFilterOptions = ["ALL", "FEATURE", "PRICING", "SOCIAL", "HIRING", "FUNDING", "LAUNCH"];

const typeMap: Record<string, string> = {
  FEATURE: "feature_update",
  PRICING: "pricing_change",
  SOCIAL: "social_post",
  HIRING: "hiring",
  FUNDING: "funding",
  LAUNCH: "product_launch",
};

const Signals = () => {
  const [compFilter, setCompFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filtered = signals.filter((s) => {
    if (compFilter !== "ALL" && s.competitorName !== compFilter) return false;
    if (typeFilter !== "ALL" && s.type !== typeMap[typeFilter]) return false;
    return true;
  });

  // Stats
  const typeCounts = signals.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeCounts).map(([type, count]) => ({
    name: signalTypeConfig[type]?.label || type,
    value: count,
    color: signalTypeConfig[type]?.color || "#fff",
  }));

  const mostActive = competitors.reduce((max, c) => {
    const count = signals.filter((s) => s.competitorId === c.id).length;
    return count > max.count ? { name: c.name, count } : max;
  }, { name: "", count: 0 });

  const hottestType = Object.entries(typeCounts).reduce((max, [type, count]) =>
    count > max.count ? { type, count } : max, { type: "", count: 0 }
  );

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        <div>
          <h1 className="font-pixel text-sm text-neon-cyan text-glow-cyan mb-2">📡 SIGNAL FEED</h1>
          <p className="font-terminal text-lg text-muted-foreground">Every move your competitors make. In real time.</p>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {compFilterOptions.map((f) => {
              const comp = competitors.find((c) => c.name === f);
              return (
                <button
                  key={f}
                  onClick={() => setCompFilter(f)}
                  className={`font-pixel text-[7px] px-3 py-2 border transition-colors ${
                    compFilter === f ? "bg-primary text-background border-primary" : "bg-transparent text-primary border-primary hover:bg-primary/10"
                  }`}
                  style={comp && compFilter === f ? { backgroundColor: comp.color, borderColor: comp.color } : comp ? { borderColor: comp.color, color: comp.color } : {}}
                >
                  {f}
                </button>
              );
            })}
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
          {/* Signal Feed */}
          <div className="lg:col-span-3 space-y-3">
            {filtered.map((s) => {
              const tc = signalTypeConfig[s.type];
              const comp = competitors.find((c) => c.id === s.competitorId);
              return (
                <div key={s.id} className={`bg-card border-l-4 ${tc.borderClass} border border-muted p-4 flex gap-4`}>
                  <div className="flex flex-col items-center gap-2 shrink-0 w-16">
                    <span className="text-2xl">{s.type === "feature_update" ? "🔧" : s.type === "pricing_change" ? "💰" : s.type === "social_post" ? "📱" : s.type === "funding" ? "💎" : s.type === "hiring" ? "👥" : "🚀"}</span>
                    <Badge variant="outline" className={`font-terminal text-[9px] ${tc.borderClass} rounded-none`} style={{ color: tc.color }}>{tc.label}</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[8px] mb-1" style={{ color: comp?.color }}>{s.competitorName}</p>
                    <p className="font-terminal text-lg text-foreground mb-1">{s.title}</p>
                    <p className="font-terminal text-sm text-muted-foreground mb-2 line-clamp-2">{s.description}</p>
                    <p className="font-terminal text-[10px] text-muted-foreground/50">via {s.source}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-terminal text-xs text-muted-foreground mb-2">{s.timeAgo}</p>
                    <p className="font-terminal text-sm text-neon-gold">⚡ {s.importance}/10</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats Sidebar */}
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
              <div><p className="font-terminal text-xs text-muted-foreground">HOTTEST TYPE</p><p className="font-pixel text-[9px] text-neon-gold">{signalTypeConfig[hottestType.type]?.label}</p></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signals;
