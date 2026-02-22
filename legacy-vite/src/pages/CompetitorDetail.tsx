import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { competitors, signals, signalTypeConfig, threatColors, radarData } from "@/data/mock-data";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const tabs = ["SIGNALS", "RADAR", "SETTINGS"];

const CompetitorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("SIGNALS");
  const [signalTypeFilter, setSignalTypeFilter] = useState("ALL");

  const comp = competitors.find((c) => c.id === id) || competitors[0];
  const tc = threatColors[comp.threat];
  const compSignals = signals.filter((s) => s.competitorId === comp.id);
  const filteredSignals = signalTypeFilter === "ALL" ? compSignals : compSignals.filter((s) => signalTypeConfig[s.type]?.label === signalTypeFilter);

  const typeFilterOptions = ["ALL", ...new Set(compSignals.map((s) => signalTypeConfig[s.type]?.label))];

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        {/* Back */}
        <button onClick={() => navigate("/competitors")} className="font-pixel text-[8px] text-primary hover:text-primary/80 transition-colors">← BACK TO ROSTER</button>

        {/* Header Card */}
        <div className={`bg-card border ${tc.border} p-6`} style={{ boxShadow: `0 0 20px ${comp.color}30` }}>
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <Avatar className={`h-28 w-28 border-3 ${tc.ring}`} style={{ boxShadow: `0 0 25px ${comp.color}50` }}>
              <AvatarFallback className={`bg-card ${tc.text} font-pixel text-2xl`}>{comp.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-pixel text-lg text-foreground">{comp.name}</h1>
                <Badge variant="outline" className="font-terminal text-xs text-neon-cyan border-neon-cyan rounded-none">{comp.category}</Badge>
              </div>
              <p className="font-terminal text-sm text-muted-foreground mb-1">{comp.website} · {comp.twitter}</p>
              <div className="flex gap-6 mt-3 font-terminal text-sm">
                <div><span className="text-muted-foreground">MONITORING SINCE: </span><span className="text-foreground">{comp.monitoringSince}</span></div>
                <div><span className="text-muted-foreground">TOTAL SIGNALS: </span><span className="text-neon-cyan">{comp.signals}</span></div>
                <div><span className="text-muted-foreground">LAST ACTIVE: </span><span className="text-foreground">{comp.lastActive}</span></div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-pixel text-[8px] text-muted-foreground mb-2">THREAT SCORE</p>
              <p className={`font-pixel text-2xl ${tc.text}`}>{comp.threatScore}/100</p>
              <div className="w-24 h-2 bg-muted mt-2"><div className={`h-full ${tc.bg}`} style={{ width: `${comp.threatScore}%` }} /></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab Content */}
        {activeTab === "SIGNALS" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {typeFilterOptions.map((f) => (
                <button key={f} onClick={() => setSignalTypeFilter(f)} className={`font-pixel text-[7px] px-3 py-2 border transition-colors ${signalTypeFilter === f ? "bg-primary text-background border-primary" : "bg-transparent text-primary border-primary hover:bg-primary/10"}`}>{f}</button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredSignals.map((s) => {
                const stc = signalTypeConfig[s.type];
                return (
                  <div key={s.id} className={`bg-card border-l-4 ${stc.borderClass} border border-muted p-4 flex gap-4`}>
                    <div className="flex flex-col items-center gap-2 shrink-0 w-16">
                      <span className="text-2xl">{s.type === "feature_update" ? "🔧" : s.type === "pricing_change" ? "💰" : s.type === "social_post" ? "📱" : s.type === "funding" ? "💎" : s.type === "hiring" ? "👥" : "🚀"}</span>
                      <Badge variant="outline" className={`font-terminal text-[9px] ${stc.borderClass} rounded-none`} style={{ color: stc.color }}>{stc.label}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
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
          </div>
        )}

        {activeTab === "RADAR" && (
          <div className="space-y-4">
            <div className="bg-card border border-muted p-6">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(120,100%,50%)" strokeOpacity={0.15} />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(0,0%,55%)", fontSize: 13, fontFamily: "VT323" }} />
                  <Radar name={comp.name} dataKey={comp.name} stroke={comp.color} fill={comp.color} fillOpacity={0.1} strokeWidth={2} dot={{ r: 4, fill: comp.color }} />
                  <Radar name="YOUR PRODUCT" dataKey="SLITE" stroke="hsl(180,100%,50%)" fill="hsl(180,100%,50%)" fillOpacity={0.05} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: "hsl(180,100%,50%)" }} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex gap-6 justify-center mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3" style={{ backgroundColor: comp.color }} /><span className="font-terminal text-sm text-muted-foreground">{comp.name}</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-neon-cyan" /><span className="font-terminal text-sm text-muted-foreground">YOUR PRODUCT (dashed)</span></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-neon-magenta p-4">
                <p className="font-pixel text-[7px] text-neon-magenta mb-1">INSIGHT</p>
                <p className="font-terminal text-sm text-muted-foreground">{comp.name} leads on Marketing by 30% — consider increasing content output and social presence.</p>
              </div>
              <div className="bg-card border border-neon-cyan p-4">
                <p className="font-pixel text-[7px] text-neon-cyan mb-1">YOUR ADVANTAGE</p>
                <p className="font-terminal text-sm text-muted-foreground">Your product is stronger on Pricing flexibility — leverage this in competitive positioning.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "SETTINGS" && (
          <div className="max-w-xl space-y-6">
            <div className="bg-card border border-muted p-6 space-y-4">
              <h3 className="font-pixel text-[9px] text-foreground mb-4">MONITORED URLS</h3>
              <div><Label className="font-terminal text-sm text-muted-foreground">Website</Label><Input className="terminal-input font-terminal text-sm mt-1" defaultValue={comp.website} /></div>
              <div><Label className="font-terminal text-sm text-muted-foreground">Twitter</Label><Input className="terminal-input font-terminal text-sm mt-1" defaultValue={comp.twitter} /></div>
              <div><Label className="font-terminal text-sm text-muted-foreground">Product Hunt</Label><Input className="terminal-input font-terminal text-sm mt-1" placeholder="product-slug" /></div>
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
            <Button variant="outline" className="font-pixel text-[7px] text-destructive border-destructive rounded-none hover:bg-destructive/10">DELETE COMPETITOR</Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompetitorDetail;
