"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  threat: "low" | "medium" | "high";
  threatScore: number;
  signals: number;
  signalsThisWeek: number;
  lastActive: string;
  biggestMove: string;
  website: string;
  monitoringSince: string;
  color: string;
};

const filterOptions = ["ALL", "HIGH THREAT", "MEDIUM", "LOW"];
const COLORS = ["hsl(300,100%,50%)", "hsl(51,100%,50%)", "hsl(120,100%,50%)", "hsl(180,100%,50%)"];

function formatTimeAgo(value: string | null): string {
  if (!value) return "—";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "—";
  const diffMs = Date.now() - timestamp;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "NOW";
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}

function safeHost(url: string | null): string {
  if (!url) return "—";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function signalLabel(type: string) {
  return signalTypeConfig[type]?.label ?? type.toUpperCase();
}

export default function CompetitorsPage() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [productHuntSlug, setProductHuntSlug] = useState("");

  const [competitors, setCompetitors] = useState<UiCompetitor[]>([]);
  const [signals, setSignals] = useState<ApiSignal[]>([]);

  const router = useRouter();

  const loadData = useCallback(async () => {
    const [competitorsRes, signalsRes] = await Promise.all([
      fetch("/api/competitors"),
      fetch("/api/signals?limit=300"),
    ]);

    const competitorsJson = await competitorsRes.json();
    const signalsJson = await signalsRes.json();

    const signalRows = ((signalsJson.signals as ApiSignal[] | undefined) ?? []).sort((a, b) => {
      return new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime();
    });
    setSignals(signalRows);

    const mapped = ((competitorsJson.competitors as ApiCompetitor[] | undefined) ?? []).map((item, index) => {
      const compSignals = signalRows.filter((signal) => signal.competitor_id === item.id);
      const latestSignal = compSignals[0];
      const totalSignals = compSignals.length || item.signals?.[0]?.count || 0;
      const weeklySignals = compSignals.filter((signal) => {
        if (!signal.detected_at) return false;
        return Date.now() - new Date(signal.detected_at).getTime() <= 7 * 24 * 60 * 60 * 1000;
      }).length;
      const threatScore = Math.min(95, 25 + totalSignals * 4 + weeklySignals * 8);
      const threat = threatScore >= 70 ? "high" : threatScore >= 45 ? "medium" : "low";

      return {
        id: item.id,
        name: item.name,
        initials: item.name.slice(0, 2).toUpperCase(),
        threat,
        threatScore,
        signals: totalSignals,
        signalsThisWeek: weeklySignals,
        lastActive: formatTimeAgo(latestSignal?.detected_at ?? null),
        biggestMove: latestSignal?.title ?? "No major move detected",
        website: safeHost(item.website_url),
        monitoringSince: item.created_at
          ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
          : "—",
        color: COLORS[index % COLORS.length],
      } as UiCompetitor;
    });

    setCompetitors(mapped);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return competitors.filter((c) => {
      if (activeFilter === "HIGH THREAT" && c.threat !== "high") return false;
      if (activeFilter === "MEDIUM" && c.threat !== "medium") return false;
      if (activeFilter === "LOW" && c.threat !== "low") return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeFilter, competitors, search]);

  const addCompetitor = useCallback(async () => {
    if (!companyName.trim() || !websiteUrl.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          website_url: websiteUrl.trim(),
          twitter_handle: twitterHandle.trim() || null,
          product_hunt_slug: productHuntSlug.trim() || null,
          description: "Added from competitor roster",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add competitor");
      }

      await fetch("/api/digests/generate", { method: "POST" });

      setCompanyName("");
      setWebsiteUrl("");
      setTwitterHandle("");
      setProductHuntSlug("");
      setModalOpen(false);
      await loadData();
    } finally {
      setLoading(false);
    }
  }, [companyName, loadData, productHuntSlug, twitterHandle, websiteUrl]);

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
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
                <div><Label className="font-terminal text-sm text-muted-foreground">Company Name</Label><Input className="terminal-input font-pixel text-xs mt-1" placeholder="Enter name..." value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
                <div><Label className="font-terminal text-sm text-muted-foreground">Website URL</Label><Input className="terminal-input font-pixel text-xs mt-1" placeholder="https://..." value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} /></div>
                <div><Label className="font-terminal text-sm text-muted-foreground">Twitter Handle (optional)</Label><Input className="terminal-input font-pixel text-xs mt-1" placeholder="@handle" value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} /></div>
                <div><Label className="font-terminal text-sm text-muted-foreground">Product Hunt slug (optional)</Label><Input className="terminal-input font-pixel text-xs mt-1" placeholder="product-name" value={productHuntSlug} onChange={(e) => setProductHuntSlug(e.target.value)} /></div>
                <div className="flex gap-3 pt-2">
                  <Button className="font-pixel text-[8px] bg-neon-magenta text-background hover:bg-neon-magenta/80 rounded-none flex-1" onClick={() => void addCompetitor()} disabled={loading}>{loading ? "PROCESSING..." : "CONFIRM +"}</Button>
                  <Button variant="outline" className="font-pixel text-[8px] text-muted-foreground border-muted rounded-none" onClick={() => setModalOpen(false)}>CANCEL</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((c) => {
            const tc = threatColors[c.threat];
            const compSignals = signals.filter((s) => s.competitor_id === c.id).slice(0, 3);
            return (
              <div key={c.id} className={`bg-card border ${tc.border} group hover:shadow-lg transition-all`}>
                <div className={`${tc.bg} px-4 py-2 flex justify-between items-center`}>
                  <span className="font-pixel text-[7px] text-background">{c.threat.toUpperCase()} THREAT</span>
                  <span className="font-terminal text-xs text-background">LAST ACTIVE: {c.lastActive}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className={`h-20 w-20 border-2 ${tc.ring}`} style={{ boxShadow: `0 0 15px ${c.color}40` }}>
                      <AvatarFallback className={`bg-card ${tc.text} font-pixel text-lg`}>{c.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-pixel text-[9px] text-foreground mb-1">{c.name}</h3>
                      <Badge variant="outline" className="font-terminal text-[10px] text-neon-cyan border-neon-cyan rounded-none mb-1">MONITORED</Badge>
                      <p className="font-terminal text-xs text-muted-foreground">{c.website}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4 font-terminal text-sm">
                    <div><p className="text-muted-foreground text-xs">TOTAL SIGNALS</p><p className="text-neon-cyan">{c.signals}</p></div>
                    <div><p className="text-muted-foreground text-xs">THIS WEEK</p><p className="text-foreground">{c.signalsThisWeek}</p></div>
                    <div><p className="text-muted-foreground text-xs">THREAT SCORE</p><p className={tc.text}>{c.threatScore}/100</p></div>
                    <div><p className="text-muted-foreground text-xs">SINCE</p><p className="text-foreground">{c.monitoringSince}</p></div>
                    <div><p className="text-muted-foreground text-xs">LAST SIGNAL</p><p className="text-foreground">{compSignals[0]?.signal_type ? signalLabel(compSignals[0].signal_type) : "—"}</p></div>
                    <div><p className="text-muted-foreground text-xs">LATEST</p><p className="text-foreground truncate">{c.biggestMove}</p></div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between font-terminal text-[10px] text-muted-foreground mb-1"><span>THREAT METER</span><span>{c.threatScore}%</span></div>
                    <div className="w-full h-2 bg-muted"><div className={`h-full ${tc.bg}`} style={{ width: `${c.threatScore}%` }} /></div>
                  </div>
                  <div className="space-y-1 mb-4">
                    {compSignals.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 font-terminal text-xs">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                        <span className="text-muted-foreground truncate flex-1">{s.title}</span>
                        <span className="text-muted-foreground shrink-0">{formatTimeAgo(s.detected_at)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="font-pixel text-[7px] bg-transparent text-primary border border-primary hover:bg-primary/10 rounded-none flex-1" onClick={() => router.push(`/competitors/${c.id}`)}>VIEW INTEL →</Button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-card border border-dashed border-primary flex flex-col items-center justify-center gap-3 cursor-pointer hover:glow-green transition-shadow min-h-[300px]" onClick={() => setModalOpen(true)}>
            <Plus className="h-10 w-10 text-primary" />
            <span className="font-pixel text-[9px] text-primary">ADD NEW COMPETITOR</span>
          </div>
        </div>
      </main>
    </div>
  );
}
