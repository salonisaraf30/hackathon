import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { competitors, signals, threatColors, signalTypeConfig, radarData } from "@/data/mock-data";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const stats = [
  { icon: "👾", label: "COMPETITORS TRACKED", value: "3", color: "text-primary", border: "border-primary" },
  { icon: "📡", label: "SIGNALS THIS WEEK", value: "14", color: "text-neon-cyan", border: "border-neon-cyan" },
  { icon: "🔥", label: "THREAT ALERTS", value: "2", color: "text-neon-magenta", border: "border-neon-magenta" },
  { icon: "📬", label: "NEXT DIGEST", value: "MON 9AM", color: "text-neon-gold", border: "border-neon-gold" },
];

const sparkData = [
  { d: 1, v: 3 }, { d: 2, v: 5 }, { d: 3, v: 2 }, { d: 4, v: 8 },
  { d: 5, v: 6 }, { d: 6, v: 9 }, { d: 7, v: 7 },
];

const boss = competitors[0];
const recentSignals = signals.slice(0, 6);

const radarCompetitors = [
  { name: "NOTION", color: "hsl(300,100%,50%)", key: "NOTION" },
  { name: "CODA", color: "hsl(51,100%,50%)", key: "CODA" },
  { name: "SLITE", color: "hsl(120,100%,50%)", key: "SLITE" },
];

const Dashboard = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`bg-card border ${s.border} p-4 hover:shadow-lg transition-shadow`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{s.icon}</span>
                <span className="font-terminal text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className={`font-pixel text-lg ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Boss Competitor Hero */}
        <div className="bg-card border border-neon-magenta p-6 glow-magenta relative neon-grid-bg">
          <Badge className="absolute top-3 right-3 bg-transparent border-neon-gold text-neon-gold font-pixel text-[8px] rounded-none">
            👑 BOSS LEVEL
          </Badge>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-16 w-16 border-2 border-neon-magenta glow-magenta">
                <AvatarFallback className="bg-card text-neon-magenta font-pixel text-sm">{boss.initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-pixel text-sm text-foreground mb-1">{boss.name}</h2>
                <Badge variant="outline" className="text-neon-cyan border-neon-cyan font-terminal text-xs rounded-none mb-3">
                  {boss.category}
                </Badge>
                <div className="mt-2">
                  <p className="font-pixel text-[8px] text-neon-magenta mb-1">⚠ THREAT LEVEL</p>
                  <div className="w-32 h-2 bg-muted">
                    <div className="h-full bg-neon-magenta" style={{ width: `${boss.threatScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-6 items-center flex-1">
              <div><p className="font-terminal text-xs text-muted-foreground">SIGNALS THIS WEEK</p><p className="font-terminal text-xl text-neon-cyan">{boss.signalsThisWeek}</p></div>
              <div><p className="font-terminal text-xs text-muted-foreground">LAST ACTIVE</p><p className="font-terminal text-xl text-foreground">{boss.lastActive}</p></div>
              <div><p className="font-terminal text-xs text-muted-foreground">BIGGEST MOVE</p><p className="font-terminal text-sm text-neon-gold">{boss.biggestMove}</p></div>
            </div>
            <div className="w-36 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient id="sparkGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(120,100%,50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(120,100%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="hsl(120,100%,50%)" fill="url(#sparkGreen)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Competitor Grid */}
        <div>
          <h2 className="font-pixel text-xs text-foreground mb-4">👾 COMPETITOR ROSTER</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {competitors.map((c) => {
              const tc = threatColors[c.threat];
              return (
                <div
                  key={c.id}
                  className={`bg-card border ${tc.border} p-5 transition-all duration-200 relative group cursor-pointer`}
                  onMouseEnter={() => setHoveredCard(c.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={hoveredCard === c.id ? { transform: "translateY(-4px)" } : {}}
                  onClick={() => navigate(`/competitors/${c.id}`)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className={`h-10 w-10 border-2 ${tc.ring}`}>
                      <AvatarFallback className={`bg-card ${tc.text} font-pixel text-[8px]`}>{c.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-pixel text-[8px] text-foreground">{c.name}</h3>
                      <Badge variant="outline" className="font-terminal text-[10px] text-muted-foreground border-muted-foreground rounded-none mt-1">{c.category}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between mb-3 font-terminal text-sm">
                    <div><p className="text-muted-foreground text-xs">SIGNALS</p><p className="text-neon-cyan">{c.signals}</p></div>
                    <div><p className="text-muted-foreground text-xs">LAST SEEN</p><p className="text-foreground">{c.lastActive}</p></div>
                    <div><p className="text-muted-foreground text-xs">THREAT</p><p className={tc.text}>{c.threat.toUpperCase()}</p></div>
                  </div>
                  <div className="w-full h-1.5 bg-muted mb-2"><div className={`h-full ${tc.bg}`} style={{ width: `${c.threatScore}%` }} /></div>
                  <p className="font-terminal text-xs text-muted-foreground italic truncate">{c.biggestMove}</p>
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
            <div className="bg-card border border-dashed border-primary p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:glow-green transition-shadow min-h-[200px]" onClick={() => navigate("/competitors")}>
              <Plus className="h-8 w-8 text-primary" />
              <span className="font-pixel text-[8px] text-primary">ADD COMPETITOR</span>
            </div>
          </div>
        </div>

        {/* Signals + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="font-pixel text-xs text-neon-cyan text-glow-cyan mb-4">📡 LIVE SIGNALS</h3>
            <div className="space-y-1">
              {recentSignals.map((s) => {
                const tc = signalTypeConfig[s.type];
                return (
                  <div key={s.id} className="bg-card border border-muted p-3 flex items-center gap-3 hover:border-primary/30 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full ${tc.dotClass} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-terminal text-sm"><span className="text-foreground font-bold">{s.competitorName}</span><span className="text-muted-foreground"> — {s.title}</span></p>
                    </div>
                    <span className="font-terminal text-xs text-muted-foreground shrink-0">{s.timeAgo}</span>
                    <Badge variant="outline" className={`font-terminal text-[10px] ${tc.borderClass} rounded-none shrink-0`} style={{ color: tc.color }}>{tc.label}</Badge>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" className="mt-3 font-pixel text-[7px] text-primary border-primary rounded-none w-full" onClick={() => navigate("/signals")}>
              LOAD MORE SIGNALS →
            </Button>
          </div>
          <div>
            <h3 className="font-pixel text-xs text-neon-magenta text-glow-magenta mb-4">🎯 THREAT RADAR</h3>
            <div className="bg-card border border-muted p-4">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(120,100%,50%)" strokeOpacity={0.15} />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11, fontFamily: "VT323" }} />
                  {radarCompetitors.map((c) => (
                    <Radar key={c.key} name={c.name} dataKey={c.key} stroke={c.color} fill={c.color} fillOpacity={0.08} strokeWidth={2} dot={{ r: 3, fill: c.color }} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2">
                {radarCompetitors.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5" style={{ backgroundColor: c.color }} />
                    <span className="font-terminal text-xs text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Digest CTA */}
        <div className="bg-card border border-primary p-6 neon-grid-bg animate-border-pulse">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-pixel text-[10px] sm:text-xs text-primary text-glow-green mb-2">📬 YOUR WEEKLY INTEL BRIEF IS READY</h3>
              <p className="font-terminal text-sm text-muted-foreground">AI-generated insights based on your product positioning vs competitors</p>
            </div>
            <Button className="font-pixel text-[8px] bg-neon-magenta text-background hover:bg-neon-magenta/80 glow-magenta rounded-none px-6 shrink-0" onClick={() => navigate("/digest")}>
              GENERATE BRIEF →
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
