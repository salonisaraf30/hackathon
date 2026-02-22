"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { Plus } from "lucide-react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  summary: string | null;
  source: string;
  importance_score: number | null;
  detected_at: string | null;
  competitors?: { name?: string } | { name?: string }[] | null;
};

type ApiDigest = { id: string; generated_at: string | null };

type UiCompetitor = {
  id: string;
  name: string;
  initials: string;
  threat: "low" | "medium" | "high";
  threatScore: number;
  signals: number;
  signalsThisWeek: number;
  lastActive: string;
  biggestMove: string;
  website: string;
  twitter: string;
  monitoringSince: string;
  color: string;
};

const COLORS = ["hsl(300,100%,50%)", "hsl(51,100%,50%)", "hsl(120,100%,50%)", "hsl(180,100%,50%)"];

function formatTimeAgo(value: string | null): string {
  if (!value) return "—";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "—";
  const diffMs = Date.now() - timestamp;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "NOW";
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

function safeHost(url: string | null): string {
  if (!url) return "—";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function signalConfig(type: string) {
  return (
    signalTypeConfig[type] ?? {
      color: "hsl(180,100%,50%)",
      label: type.toUpperCase(),
      dotClass: "bg-neon-cyan",
      borderClass: "border-neon-cyan",
    }
  );
}

export default function DashboardPage() {
  const [competitors, setCompetitors] = useState<UiCompetitor[]>([]);
  const [signals, setSignals] = useState<ApiSignal[]>([]);
  const [digests, setDigests] = useState<ApiDigest[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [competitorsRes, signalsRes, digestsRes] = await Promise.all([
          fetch("/api/competitors"),
          fetch("/api/signals?limit=200"),
          fetch("/api/digests"),
        ]);

        const competitorsJson = await competitorsRes.json();
        const signalsJson = await signalsRes.json();
        const digestsJson = await digestsRes.json();

        const rawSignals = ((signalsJson.signals as ApiSignal[] | undefined) ?? []).sort((a, b) => {
          return new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime();
        });

        setSignals(rawSignals);
        setDigests((digestsJson.digests as ApiDigest[] | undefined) ?? []);

        const rawCompetitors = (competitorsJson.competitors as ApiCompetitor[] | undefined) ?? [];

        const mapped = rawCompetitors.map((item, index) => {
          const compSignals = rawSignals.filter((signal) => signal.competitor_id === item.id);
          const latestSignal = compSignals[0];
          const weekSignals = compSignals.filter((signal) => {
            if (!signal.detected_at) return false;
            const age = Date.now() - new Date(signal.detected_at).getTime();
            return age <= 7 * 24 * 60 * 60 * 1000;
          }).length;
          const totalSignals = compSignals.length || item.signals?.[0]?.count || 0;
          const threatScore = Math.min(95, 25 + totalSignals * 4 + weekSignals * 8);
          const threat = threatScore >= 70 ? "high" : threatScore >= 45 ? "medium" : "low";

          return {
            id: item.id,
            name: item.name,
            initials: item.name.slice(0, 2).toUpperCase(),
            threat,
            threatScore,
            signals: totalSignals,
            signalsThisWeek: weekSignals,
            lastActive: formatTimeAgo(latestSignal?.detected_at ?? null),
            biggestMove: latestSignal?.title ?? "No major move detected",
            website: safeHost(item.website_url),
            twitter: item.twitter_handle ? `@${item.twitter_handle.replace(/^@/, "")}` : "—",
            monitoringSince: item.created_at
              ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
              : "—",
            color: COLORS[index % COLORS.length],
          } as UiCompetitor;
        });

        setCompetitors(mapped);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const boss = useMemo(() => {
    return [...competitors].sort((a, b) => b.threatScore - a.threatScore)[0] ?? null;
  }, [competitors]);

  const stats = useMemo(() => {
    const weeklySignals = signals.filter((signal) => {
      if (!signal.detected_at) return false;
      const age = Date.now() - new Date(signal.detected_at).getTime();
      return age <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    const threatAlerts = competitors.filter((item) => item.threat === "high").length;
    const latestDigest = digests[0]?.generated_at;

    return [
      { icon: "👾", label: "COMPETITORS TRACKED", value: `${competitors.length}`, color: "text-primary", border: "border-primary" },
      { icon: "📡", label: "SIGNALS THIS WEEK", value: `${weeklySignals}`, color: "text-neon-cyan", border: "border-neon-cyan" },
      { icon: "🔥", label: "THREAT ALERTS", value: `${threatAlerts}`, color: "text-neon-magenta", border: "border-neon-magenta" },
      {
        icon: "📬",
        label: "LATEST DIGEST",
        value: latestDigest
          ? new Date(latestDigest).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
          : "NONE",
        color: "text-neon-gold",
        border: "border-neon-gold",
      },
    ];
  }, [competitors, digests, signals]);

  const recentSignals = useMemo(() => signals.slice(0, 6), [signals]);

  const radarCompetitors = useMemo(() => competitors.slice(0, 3), [competitors]);

  const radarData = useMemo(() => {
    const axes = ["feature_update", "pricing_change", "social_post", "funding", "hiring", "product_launch"];
    return axes.map((axis) => {
      const row: Record<string, string | number> = { axis: signalConfig(axis).label };
      for (const competitor of radarCompetitors) {
        const count = signals.filter(
          (signal) => signal.competitor_id === competitor.id && signal.signal_type === axis,
        ).length;
        row[competitor.id] = count;
      }
      return row;
    });
  }, [radarCompetitors, signals]);

  const canRenderRadar =
    radarCompetitors.length > 0 &&
    Array.isArray(radarData) &&
    radarData.length > 0;

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`bg-card border ${stat.border} p-4 hover:shadow-lg transition-shadow`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{stat.icon}</span>
                <span className="font-terminal text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`font-pixel text-lg ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {boss && (
          <div className="bg-card border border-neon-magenta p-6 glow-magenta relative neon-grid-bg">
            <Badge className="absolute top-3 right-3 bg-transparent border-neon-gold text-neon-gold font-pixel text-[8px] rounded-none">
              👑 HIGH PRIORITY
            </Badge>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="h-16 w-16 border-2 border-neon-magenta glow-magenta">
                  <AvatarFallback className="bg-card text-neon-magenta font-pixel text-sm">{boss.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-pixel text-sm text-foreground mb-1">{boss.name}</h2>
                  <Badge variant="outline" className="text-neon-cyan border-neon-cyan font-terminal text-xs rounded-none mb-3">
                    MONITORED
                  </Badge>
                  <div className="mt-2">
                    <p className="font-pixel text-[8px] text-neon-magenta mb-1">THREAT LEVEL: {boss.threat.toUpperCase()}</p>
                    <div className="w-32 h-2 bg-muted">
                      <div className="h-full bg-neon-magenta" style={{ width: `${boss.threatScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-6 items-center flex-1">
                <div><p className="font-terminal text-xs text-muted-foreground">SIGNALS THIS WEEK</p><p className="font-terminal text-xl text-neon-cyan">{boss.signalsThisWeek}</p></div>
                <div><p className="font-terminal text-xs text-muted-foreground">LAST ACTIVE</p><p className="font-terminal text-xl text-foreground">{boss.lastActive}</p></div>
                <div><p className="font-terminal text-xs text-muted-foreground">LATEST</p><p className="font-terminal text-sm text-neon-gold">{boss.biggestMove}</p></div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="font-pixel text-xs text-foreground mb-4">👾 COMPETITOR ROSTER</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {competitors.map((competitor) => {
              const tc = threatColors[competitor.threat];
              return (
                <div
                  key={competitor.id}
                  className={`bg-card border ${tc.border} p-5 transition-all duration-200 relative group cursor-pointer`}
                  onMouseEnter={() => setHoveredCard(competitor.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={hoveredCard === competitor.id ? { transform: "translateY(-4px)" } : {}}
                  onClick={() => router.push(`/competitors/${competitor.id}`)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className={`h-10 w-10 border-2 ${tc.ring}`}>
                      <AvatarFallback className={`bg-card ${tc.text} font-pixel text-[8px]`}>{competitor.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-pixel text-[8px] text-foreground">{competitor.name}</h3>
                      <Badge variant="outline" className="font-terminal text-[10px] text-muted-foreground border-muted-foreground rounded-none mt-1">
                        {competitor.website}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between mb-3 font-terminal text-sm">
                    <div><p className="text-muted-foreground text-xs">SIGNALS</p><p className="text-neon-cyan">{competitor.signals}</p></div>
                    <div><p className="text-muted-foreground text-xs">LAST SEEN</p><p className="text-foreground">{competitor.lastActive}</p></div>
                    <div><p className="text-muted-foreground text-xs">THREAT</p><p className={tc.text}>{competitor.threat.toUpperCase()}</p></div>
                  </div>
                  <div className="w-full h-1.5 bg-muted mb-2"><div className={`h-full ${tc.bg}`} style={{ width: `${competitor.threatScore}%` }} /></div>
                  <p className="font-terminal text-xs text-muted-foreground italic truncate">{competitor.biggestMove}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute bottom-4 right-4 font-pixel text-[7px] text-primary border-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-none"
                  >
                    VIEW INTEL →
                  </Button>
                </div>
              );
            })}
            <div className="bg-card border border-dashed border-primary p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:glow-green transition-shadow min-h-[200px]" onClick={() => router.push("/competitors") }>
              <Plus className="h-8 w-8 text-primary" />
              <span className="font-pixel text-[8px] text-primary">ADD COMPETITOR</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="font-pixel text-xs text-neon-cyan text-glow-cyan mb-4">📡 LIVE SIGNALS</h3>
            <div className="space-y-1">
              {recentSignals.map((signal) => {
                const config = signalConfig(signal.signal_type);
                const competitorName = Array.isArray(signal.competitors)
                  ? signal.competitors[0]?.name
                  : signal.competitors?.name;
                return (
                  <div key={signal.id} className="bg-card border border-muted p-3 flex items-center gap-3 hover:border-primary/30 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.dotClass} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-terminal text-sm"><span className="text-foreground font-bold">{competitorName ?? "COMPETITOR"}</span><span className="text-muted-foreground"> — {signal.title}</span></p>
                    </div>
                    <span className="font-terminal text-xs text-muted-foreground shrink-0">{formatTimeAgo(signal.detected_at)}</span>
                    <Badge variant="outline" className={`font-terminal text-[10px] ${config.borderClass} rounded-none shrink-0`} style={{ color: config.color }}>{config.label}</Badge>
                  </div>
                );
              })}
              {!loading && recentSignals.length === 0 && <p className="font-terminal text-sm text-muted-foreground">No signals yet. Add competitors and run ingestion.</p>}
            </div>
            <Button variant="outline" className="mt-3 font-pixel text-[7px] text-primary border-primary rounded-none w-full" onClick={() => router.push("/signals")}>
              LOAD MORE SIGNALS →
            </Button>
          </div>
          <div>
            <h3 className="font-pixel text-xs text-neon-magenta text-glow-magenta mb-4">🎯 THREAT RADAR</h3>
            <div className="bg-card border border-muted p-4">
              {canRenderRadar ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(120,100%,50%)" strokeOpacity={0.15} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11, fontFamily: "VT323" }} />
                    {radarCompetitors.map((item, index) => (
                      <Radar key={item.id} name={item.name} dataKey={item.id} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.08} strokeWidth={2} dot={{ r: 3, fill: COLORS[index % COLORS.length] }} />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <p className="font-terminal text-sm text-muted-foreground">Add competitors and run ingestion to populate radar.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-primary p-6 neon-grid-bg animate-border-pulse">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-pixel text-[10px] sm:text-xs text-primary text-glow-green mb-2">📬 YOUR WEEKLY INTEL BRIEF</h3>
              <p className="font-terminal text-sm text-muted-foreground">Generated from Supabase signals and Nemotron strategy insights</p>
            </div>
            <Button className="font-pixel text-[8px] bg-neon-magenta text-background hover:bg-neon-magenta/80 glow-magenta rounded-none px-6 shrink-0" onClick={() => router.push("/digest")}>
              VIEW BRIEF →
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
