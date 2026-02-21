import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { competitors, signals, threatColors, signalTypeConfig } from "@/data/mock-data";

const filterOptions = ["ALL", "HIGH THREAT", "MEDIUM", "LOW", "RECENT ACTIVITY"];

const Competitors = () => {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = competitors.filter((c) => {
    if (activeFilter === "HIGH THREAT" && c.threat !== "high") return false;
    if (activeFilter === "MEDIUM" && c.threat !== "medium") return false;
    if (activeFilter === "LOW" && c.threat !== "low") return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-pixel text-sm text-primary text-glow-green mb-2">👾 COMPETITOR ROSTER</h1>
            <p className="font-terminal text-lg text-muted-foreground">Track your rivals. Know their every move.</p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="font-pixel text-[8px] bg-neon-magenta text-background hover:bg-neon-magenta/80 glow-magenta rounded-none">＋ ADD COMPETITOR</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-primary">
              <DialogHeader>
                <DialogTitle className="font-pixel text-xs text-primary">ADD NEW RIVAL</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label className="font-terminal text-sm text-muted-foreground">Company Name</Label><Input className="terminal-input font-pixel text-xs mt-1" placeholder="Enter name..." /></div>
                <div><Label className="font-terminal text-sm text-muted-foreground">Website URL</Label><Input className="terminal-input font-pixel text-xs mt-1" placeholder="https://..." /></div>
                <div><Label className="font-terminal text-sm text-muted-foreground">Twitter Handle (optional)</Label><Input className="terminal-input font-pixel text-xs mt-1" placeholder="@handle" /></div>
                <div><Label className="font-terminal text-sm text-muted-foreground">Product Hunt slug (optional)</Label><Input className="terminal-input font-pixel text-xs mt-1" placeholder="product-name" /></div>
                <div className="flex gap-3 pt-2">
                  <Button className="font-pixel text-[8px] bg-neon-magenta text-background hover:bg-neon-magenta/80 rounded-none flex-1">CONFIRM +</Button>
                  <Button variant="outline" className="font-pixel text-[8px] text-muted-foreground border-muted rounded-none" onClick={() => setModalOpen(false)}>CANCEL</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`font-pixel text-[7px] px-3 py-2 border transition-colors ${
                activeFilter === f
                  ? "bg-primary text-background border-primary"
                  : "bg-transparent text-primary border-primary hover:bg-primary/10"
              }`}
            >
              {f}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="terminal-input font-pixel text-[8px] px-3 py-2 w-64 ml-auto"
            placeholder="█ SEARCH COMPETITORS..."
          />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((c) => {
            const tc = threatColors[c.threat];
            const compSignals = signals.filter((s) => s.competitorId === c.id).slice(0, 3);
            return (
              <div key={c.id} className={`bg-card border ${tc.border} group hover:shadow-lg transition-all`}>
                {/* Top Band */}
                <div className={`${tc.bg} px-4 py-2 flex justify-between items-center`}>
                  <span className="font-pixel text-[7px] text-background">{c.threat.toUpperCase()} THREAT</span>
                  <span className="font-terminal text-xs text-background">LAST ACTIVE: {c.lastActive}</span>
                </div>
                <div className="p-5">
                  {/* Portrait */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className={`h-20 w-20 border-2 ${tc.ring}`} style={{ boxShadow: `0 0 15px ${c.color}40` }}>
                      <AvatarFallback className={`bg-card ${tc.text} font-pixel text-lg`}>{c.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-pixel text-[9px] text-foreground mb-1">{c.name}</h3>
                      <Badge variant="outline" className="font-terminal text-[10px] text-neon-cyan border-neon-cyan rounded-none mb-1">{c.category}</Badge>
                      <p className="font-terminal text-xs text-muted-foreground">{c.website}</p>
                    </div>
                  </div>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4 font-terminal text-sm">
                    <div><p className="text-muted-foreground text-xs">TOTAL SIGNALS</p><p className="text-neon-cyan">{c.signals}</p></div>
                    <div><p className="text-muted-foreground text-xs">THIS WEEK</p><p className="text-foreground">{c.signalsThisWeek}</p></div>
                    <div><p className="text-muted-foreground text-xs">THREAT SCORE</p><p className={tc.text}>{c.threatScore}/100</p></div>
                    <div><p className="text-muted-foreground text-xs">CATEGORY</p><p className="text-foreground">{c.category}</p></div>
                    <div><p className="text-muted-foreground text-xs">SINCE</p><p className="text-foreground">{c.monitoringSince}</p></div>
                    <div><p className="text-muted-foreground text-xs">LAST SIGNAL</p><p className="text-foreground">{compSignals[0]?.type ? signalTypeConfig[compSignals[0].type]?.label : "—"}</p></div>
                  </div>
                  {/* Threat Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between font-terminal text-[10px] text-muted-foreground mb-1"><span>THREAT METER</span><span>{c.threatScore}%</span></div>
                    <div className="w-full h-2 bg-muted"><div className={`h-full ${tc.bg}`} style={{ width: `${c.threatScore}%` }} /></div>
                  </div>
                  {/* Recent Signals */}
                  <div className="space-y-1 mb-4">
                    {compSignals.map((s) => {
                      const stc = signalTypeConfig[s.type];
                      return (
                        <div key={s.id} className="flex items-center gap-2 font-terminal text-xs">
                          <div className={`w-2 h-2 rounded-full ${stc.dotClass}`} />
                          <span className="text-muted-foreground truncate flex-1">{s.title}</span>
                          <span className="text-muted-foreground shrink-0">{s.timeAgo}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" className="font-pixel text-[7px] bg-transparent text-primary border border-primary hover:bg-primary/10 rounded-none flex-1" onClick={() => navigate(`/competitors/${c.id}`)}>VIEW INTEL →</Button>
                    <Button size="sm" className="font-pixel text-[7px] bg-transparent text-neon-cyan border border-neon-cyan hover:bg-neon-cyan/10 rounded-none">EDIT</Button>
                    <Button size="sm" className="font-pixel text-[7px] bg-transparent text-destructive/50 border border-destructive/30 hover:bg-destructive/10 rounded-none">REMOVE</Button>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Add Card */}
          <div className="bg-card border border-dashed border-primary flex flex-col items-center justify-center gap-3 cursor-pointer hover:glow-green transition-shadow min-h-[300px]" onClick={() => setModalOpen(true)}>
            <Plus className="h-10 w-10 text-primary" />
            <span className="font-pixel text-[9px] text-primary">ADD NEW COMPETITOR</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Competitors;
