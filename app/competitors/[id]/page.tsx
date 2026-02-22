"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signalTypeConfig, threatColors } from "@/data/mock-data";

type ApiCompetitor = {
  id: string;
  name: string;
  website_url: string | null;
  twitter_handle: string | null;
  created_at: string | null;
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
};

const tabs = ["SIGNALS", "RADAR", "SETTINGS"];
const radarAxes = ["feature_update", "pricing_change", "social_post", "funding", "hiring", "product_launch"];

function formatTimeAgo(value: string | null): string {
  if (!value) return "—";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "—";
  const hours = Math.floor((Date.now() - time) / (1000 * 60 * 60));
  if (hours < 1) return "NOW";
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}

function configForType(type: string) {
  return signalTypeConfig[type] ?? {
    color: "hsl(180,100%,50%)",
    label: type.toUpperCase(),
    dotClass: "bg-neon-cyan",
    borderClass: "border-neon-cyan",
  };
}

export default function CompetitorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("SIGNALS");
  const [signalTypeFilter, setSignalTypeFilter] = useState("ALL");
  const [competitor, setCompetitor] = useState<ApiCompetitor | null>(null);
  const [signals, setSignals] = useState<ApiSignal[]>([]);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const [competitorsRes, signalsRes] = await Promise.all([
        fetch("/api/competitors"),
        fetch(`/api/signals?competitor_id=${encodeURIComponent(id)}&limit=200`),
      ]);

      const competitorsJson = await competitorsRes.json();
      const signalsJson = await signalsRes.json();

      const current = ((competitorsJson.competitors as ApiCompetitor[] | undefined) ?? []).find((item) => item.id === id) ?? null;
      setCompetitor(current);
      setSignals(((signalsJson.signals as ApiSignal[] | undefined) ?? []).sort((a, b) => {
        return new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime();
      }));
    };

    void load();
  }, [id]);

  const threatScore = useMemo(() => {
    const weekly = signals.filter((signal) => {
      if (!signal.detected_at) return false;
      return Date.now() - new Date(signal.detected_at).getTime() <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    return Math.min(95, 25 + signals.length * 4 + weekly * 8);
  }, [signals]);

  const threat = threatScore >= 70 ? "high" : threatScore >= 45 ? "medium" : "low";
  const tc = threatColors[threat];

  const filteredSignals =
    signalTypeFilter === "ALL"
      ? signals
      : signals.filter((signal) => configForType(signal.signal_type).label === signalTypeFilter);

  const typeFilterOptions = [
    "ALL",
    ...new Set(signals.map((signal) => configForType(signal.signal_type).label)),
  ];

  const radarData = radarAxes.map((axis) => ({
    axis: configForType(axis).label,
    COMPETITOR: signals.filter((signal) => signal.signal_type === axis).length,
  }));

  if (!competitor) {
    return (
      <div className="scanlines min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-60 p-6">
          <Button variant="outline" onClick={() => router.push("/competitors")} className="font-pixel text-[8px] text-primary border-primary rounded-none">← BACK TO ROSTER</Button>
          <p className="font-terminal text-sm text-muted-foreground mt-4">Competitor not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        <button onClick={() => router.push("/competitors")} className="font-pixel text-[8px] text-primary hover:text-primary/80 transition-colors">← BACK TO ROSTER</button>

        <div className={`bg-card border ${tc.border} p-6`}>
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <Avatar className={`h-28 w-28 border-3 ${tc.ring}`}>
              <AvatarFallback className={`bg-card ${tc.text} font-pixel text-2xl`}>{competitor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-pixel text-lg text-foreground">{competitor.name}</h1>
                <Badge variant="outline" className="font-terminal text-xs text-neon-cyan border-neon-cyan rounded-none">MONITORED</Badge>
              </div>
              <p className="font-terminal text-sm text-muted-foreground mb-1">{competitor.website_url ?? "—"} · {competitor.twitter_handle ? `@${competitor.twitter_handle.replace(/^@/, "")}` : "—"}</p>
              <div className="flex gap-6 mt-3 font-terminal text-sm">
                <div><span className="text-muted-foreground">MONITORING SINCE: </span><span className="text-foreground">{competitor.created_at ? new Date(competitor.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase() : "—"}</span></div>
                <div><span className="text-muted-foreground">TOTAL SIGNALS: </span><span className="text-neon-cyan">{signals.length}</span></div>
                <div><span className="text-muted-foreground">LAST ACTIVE: </span><span className="text-foreground">{formatTimeAgo(signals[0]?.detected_at ?? null)}</span></div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-pixel text-[8px] text-muted-foreground mb-2">THREAT SCORE</p>
              <p className={`font-pixel text-2xl ${tc.text}`}>{threatScore}/100</p>
              <div className="w-24 h-2 bg-muted mt-2"><div className={`h-full ${tc.bg}`} style={{ width: `${threatScore}%` }} /></div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-muted">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`font-pixel text-[8px] px-4 py-3 transition-colors ${activeTab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {activeTab === "SIGNALS" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {typeFilterOptions.map((f) => (
                <button key={f} onClick={() => setSignalTypeFilter(f)} className={`font-pixel text-[7px] px-3 py-2 border transition-colors ${signalTypeFilter === f ? "bg-primary text-background border-primary" : "bg-transparent text-primary border-primary hover:bg-primary/10"}`}>{f}</button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredSignals.map((s) => {
                const stc = configForType(s.signal_type);
                return (
                  <div key={s.id} className={`bg-card border-l-4 ${stc.borderClass} border border-muted p-4 flex gap-4`}>
                    <div className="flex flex-col items-center gap-2 shrink-0 w-16">
                      <Badge variant="outline" className={`font-terminal text-[9px] ${stc.borderClass} rounded-none`} style={{ color: stc.color }}>{stc.label}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
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
            </div>
          </div>
        )}

        {activeTab === "RADAR" && (
          <div className="space-y-4">
            <div className="bg-card border border-muted p-6">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(120,100%,50%)" strokeOpacity={0.15} />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(0,0%,55%)", fontSize: 13, fontFamily: "VT323" }} />
                  <Radar name={competitor.name} dataKey="COMPETITOR" stroke="hsl(180,100%,50%)" fill="hsl(180,100%,50%)" fillOpacity={0.1} strokeWidth={2} dot={{ r: 4, fill: "hsl(180,100%,50%)" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "SETTINGS" && (
          <div className="max-w-xl space-y-6">
            <div className="bg-card border border-muted p-6 space-y-4">
              <h3 className="font-pixel text-[9px] text-foreground mb-4">MONITORED URLS</h3>
              <div><Label className="font-terminal text-sm text-muted-foreground">Website</Label><Input className="terminal-input font-terminal text-sm mt-1" defaultValue={competitor.website_url ?? ""} readOnly /></div>
              <div><Label className="font-terminal text-sm text-muted-foreground">Twitter</Label><Input className="terminal-input font-terminal text-sm mt-1" defaultValue={competitor.twitter_handle ?? ""} readOnly /></div>
            </div>
            <div className="bg-card border border-muted p-6 space-y-4">
              <h3 className="font-pixel text-[9px] text-foreground mb-4">ALERT TYPES</h3>
              {["Feature Updates", "Pricing Changes", "Social Posts", "Funding News", "Hiring Activity", "Product Launches"].map((t) => (
                <div key={t} className="flex items-center justify-between">
                  <span className="font-terminal text-sm text-muted-foreground">{t}</span>
                  <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                </div>
              ))}
            </div>
            <Button variant="outline" className="font-pixel text-[7px] text-destructive border-destructive rounded-none hover:bg-destructive/10" onClick={() => router.push("/competitors")}>BACK TO ROSTER</Button>
          </div>
        )}
      </main>
    </div>
  );
}
