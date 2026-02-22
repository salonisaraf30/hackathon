"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { signalTypeConfig } from "@/data/mock-data";

type ApiSignal = {
  id: string;
  signal_type: string;
  title: string;
  detected_at: string | null;
  competitors?: { name?: string } | { name?: string }[] | null;
};

type ApiDigestSignal = {
  signal_id: string;
  signals?: {
    id?: string;
    title?: string;
    signal_type?: string;
    competitor_id?: string;
    competitors?: { name?: string } | { name?: string }[] | null;
  } | null;
};

type ApiDigest = {
  id: string;
  title: string | null;
  executive_summary: string | null;
  strategic_insights: unknown;
  generated_at: string | null;
  digest_signals?: ApiDigestSignal[];
};

type DigestInsight = {
  competitor?: string;
  signal_type?: string;
  what_happened?: string;
  why_it_matters?: string;
  recommended_action?: string;
  urgency?: string;
  quality_score?: number;
  signal_id?: string;
  verification_note?: string;
  consistency_note?: string;
};

type DigestScenario = {
  competitor_name?: string;
  prediction?: string;
  confidence?: number;
  timeframe?: string;
  impact_if_true?: string;
  preemptive_action?: string;
};

type DigestStrategy = {
  executive_summary?: string;
  user_context?: {
    product_name?: string;
    positioning?: string;
    target_market?: string;
    key_features?: string[];
    description?: string;
  };
  insights?: DigestInsight[];
  strategic_outlook?: string;
  scenarios?: {
    market_direction?: string;
    scenarios?: DigestScenario[];
    wildcards?: string[];
  };
  pipeline_trace?: {
    token_usage?: Record<string, number>;
    classification_summary?: Array<{ signal_id?: string }>;
    red_team_summary?: Array<{ signal_id?: string; verdict?: string }>;
  };
  pipeline_meta?: {
    agents?: string[];
    quality_score?: number;
    accepted_insights?: number;
    rejected_insights?: number;
    predictions_generated?: number;
    selected_signal_ids?: string[];
  };
};

const urgencyColors: Record<string, string> = {
  HIGH: "text-neon-magenta border-neon-magenta",
  MEDIUM: "text-neon-gold border-neon-gold",
  LOW: "text-primary border-primary",
};

function formatTimeAgo(value: string | null): string {
  if (!value) return "—";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "—";
  const hours = Math.floor((Date.now() - time) / (1000 * 60 * 60));
  if (hours < 1) return "NOW";
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.floor(hours / 24)}D AGO`;
}

function signalConfig(type: string) {
  const normalized = type.trim();
  return signalTypeConfig[type] ?? {
    color: "hsl(180,100%,50%)",
    label: normalized ? normalized.toUpperCase() : "SIGNAL",
    dotClass: "bg-neon-cyan",
    borderClass: "border-neon-cyan",
  };
}

function parseStrategy(value: unknown): DigestStrategy {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;

  const rawInsights = Array.isArray(raw.insights) ? raw.insights as Array<Record<string, unknown>> : [];
  const normalizedInsights: DigestInsight[] = rawInsights.map((item) => ({
    signal_id: typeof item.signal_id === "string" ? item.signal_id : undefined,
    competitor: (typeof item.competitor === "string" ? item.competitor : undefined)
      ?? (typeof item.competitor_name === "string" ? item.competitor_name : undefined),
    signal_type: typeof item.signal_type === "string" ? item.signal_type : undefined,
    what_happened: typeof item.what_happened === "string" ? item.what_happened : undefined,
    why_it_matters: (typeof item.why_it_matters === "string" ? item.why_it_matters : undefined)
      ?? (typeof item.strategic_implication === "string" ? item.strategic_implication : undefined)
      ?? (typeof item.impact_on_user === "string" ? item.impact_on_user : undefined),
    recommended_action: typeof item.recommended_action === "string" ? item.recommended_action : undefined,
    urgency: typeof item.urgency === "string" ? item.urgency : undefined,
    quality_score: typeof item.quality_score === "number" ? item.quality_score : undefined,
    verification_note: typeof item.verification_note === "string" ? item.verification_note : undefined,
    consistency_note: typeof item.consistency_note === "string" ? item.consistency_note : undefined,
  }));

  const scenarios = (raw.scenarios && typeof raw.scenarios === "object")
    ? raw.scenarios as DigestStrategy["scenarios"]
    : undefined;

  const pipelineTrace = (raw.pipeline_trace && typeof raw.pipeline_trace === "object")
    ? raw.pipeline_trace as DigestStrategy["pipeline_trace"]
    : undefined;

  const existingPipelineMeta = (raw.pipeline_meta && typeof raw.pipeline_meta === "object")
    ? raw.pipeline_meta as DigestStrategy["pipeline_meta"]
    : undefined;

  const acceptedInsights = normalizedInsights.length;
  const rejectedInsights = (pipelineTrace?.red_team_summary ?? []).filter((r) => r?.verdict && r.verdict !== "upheld").length;
  const predictionsGenerated = scenarios?.scenarios?.length ?? 0;
  const selectedSignalIds = (
    pipelineTrace?.classification_summary
      ?.map((s) => s.signal_id)
      .filter((id): id is string => typeof id === "string")
  ) ?? [];
  const avgQuality = normalizedInsights.filter((i) => typeof i.quality_score === "number");
  const qualityScore = avgQuality.length > 0
    ? avgQuality.reduce((sum, i) => sum + (i.quality_score ?? 0), 0) / (avgQuality.length * 10)
    : undefined;

  const derivedPipelineMeta: DigestStrategy["pipeline_meta"] = {
    agents: ["signal-classifier", "competitive-strategist", "red-team", "scenario-predictor", "quality-judge"],
    quality_score: qualityScore,
    accepted_insights: acceptedInsights,
    rejected_insights: rejectedInsights,
    predictions_generated: predictionsGenerated,
    selected_signal_ids: selectedSignalIds,
  };

  return {
    executive_summary: typeof raw.executive_summary === "string" ? raw.executive_summary : undefined,
    user_context: (raw.user_context && typeof raw.user_context === "object")
      ? raw.user_context as DigestStrategy["user_context"]
      : undefined,
    insights: normalizedInsights,
    scenarios,
    strategic_outlook:
      (typeof raw.strategic_outlook === "string" ? raw.strategic_outlook : undefined)
      ?? (typeof scenarios?.market_direction === "string" ? scenarios.market_direction : undefined),
    pipeline_trace: pipelineTrace,
    pipeline_meta: existingPipelineMeta ?? derivedPipelineMeta,
  };
}

export default function DigestPage() {
  const [digests, setDigests] = useState<ApiDigest[]>([]);
  const [signals, setSignals] = useState<ApiSignal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedSignals, setExpandedSignals] = useState(false);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [digestsRes, signalsRes] = await Promise.all([
      fetch("/api/digests"),
      fetch("/api/signals?limit=300"),
    ]);

    const digestsJson = await digestsRes.json();
    const signalsJson = await signalsRes.json();

    const digestRows = (digestsJson.digests as ApiDigest[] | undefined) ?? [];
    const sortedDigests = [...digestRows].sort((a, b) => {
      return new Date(b.generated_at ?? 0).getTime() - new Date(a.generated_at ?? 0).getTime();
    });

    setDigests(sortedDigests);
    setSignals(((signalsJson.signals as ApiSignal[] | undefined) ?? []).sort((a, b) => {
      return new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime();
    }));

    if (!selectedId && sortedDigests[0]?.id) {
      setSelectedId(sortedDigests[0].id);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(() => {
    return digests.find((digest) => digest.id === selectedId) ?? digests[0] ?? null;
  }, [digests, selectedId]);

  const strategy = useMemo(() => parseStrategy(active?.strategic_insights), [active?.strategic_insights]);
  const insights = strategy.insights ?? [];

  const digestSignals = useMemo(() => {
    if (!active) return [];

    const linkedSignals = (active.digest_signals ?? [])
      .map((item) => {
        const row = item.signals;
        if (!row?.id) return null;
        return {
          id: row.id,
          signal_type: row.signal_type ?? "",
          title: row.title ?? "Untitled signal",
          detected_at: null,
          competitors: row.competitors ?? null,
        } as ApiSignal;
      })
      .filter((signal): signal is ApiSignal => Boolean(signal));

    if (linkedSignals.length > 0) {
      return linkedSignals;
    }

    const linkIds = (active.digest_signals ?? []).map((item) => item.signal_id);
    if (linkIds.length > 0) {
      return signals.filter((signal) => linkIds.includes(signal.id));
    }

    return signals.slice(0, 10);
  }, [active, signals]);

  const signalTypeById = useMemo(() => {
    return digestSignals.reduce<Record<string, string>>((acc, signal) => {
      acc[signal.id] = signal.signal_type;
      return acc;
    }, {});
  }, [digestSignals]);

  const threatPercent = useMemo(() => {
    if (insights.length === 0) return 35;
    const score = insights.reduce((total, item) => {
      const urgency = (item.urgency ?? "").toUpperCase();
      if (urgency === "HIGH") return total + 35;
      if (urgency === "MED" || urgency === "MEDIUM") return total + 20;
      return total + 10;
    }, 0);
    return Math.min(95, score);
  }, [insights]);

  const generateDigest = useCallback(async () => {
    setGenerating(true);
    try {
      setError(null);
      const response = await fetch("/api/digests/generate", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate digest");
      }
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate digest");
    } finally {
      setGenerating(false);
    }
  }, [load]);

  if (!active) {
    return (
      <div className="scanlines min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-60 p-6">
          <h1 className="font-pixel text-sm text-neon-gold mb-2">📬 INTELLIGENCE BRIEFS</h1>
          <p className="font-terminal text-sm text-muted-foreground">No digest yet. Generate your first brief after onboarding ingestion completes.</p>
          {error && <p className="font-terminal text-sm text-destructive mt-3">{error}</p>}
          <Button className="mt-4 font-pixel text-[8px] bg-neon-gold text-background hover:bg-neon-gold/80 rounded-none" onClick={() => void generateDigest()} disabled={generating}>{generating ? "GENERATING..." : "GENERATE →"}</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        <div>
          <h1 className="font-pixel text-sm text-neon-gold mb-2" style={{ textShadow: "0 0 10px hsl(51,100%,50%,0.8)" }}>📬 INTELLIGENCE BRIEFS</h1>
          <p className="font-terminal text-lg text-muted-foreground">AI-generated weekly briefings from live competitor signals.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-3 space-y-2">
            {digests.map((digest, index) => (
              <div
                key={digest.id}
                onClick={() => setSelectedId(digest.id)}
                className={`bg-card border-l-4 border border-muted p-4 cursor-pointer transition-all ${
                  active.id === digest.id ? "border-l-neon-gold border-neon-gold" : "border-l-neon-gold/30 hover:border-neon-gold/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-pixel text-[8px] text-foreground">BRIEF #{String(digests.length - index).padStart(3, "0")}</span>
                  {index === 0 ? (
                    <Badge className="bg-neon-magenta text-background font-pixel text-[6px] rounded-none animate-pulse">NEW</Badge>
                  ) : (
                    <Badge variant="outline" className="text-primary border-primary font-pixel text-[6px] rounded-none">READ</Badge>
                  )}
                </div>
                <p className="font-terminal text-xs text-muted-foreground">{digest.generated_at ? new Date(digest.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase() : "—"}</p>
              </div>
            ))}

            <div className="bg-card border border-neon-gold p-4 animate-border-pulse mt-4" style={{ borderColor: "hsl(51,100%,50%)" }}>
              <p className="font-pixel text-[7px] text-neon-gold mb-2">GENERATE NEW BRIEF</p>
              <Button className="font-pixel text-[8px] bg-neon-gold text-background hover:bg-neon-gold/80 rounded-none w-full" onClick={() => void generateDigest()} disabled={generating}>{generating ? "GENERATING..." : "GENERATE →"}</Button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-card border border-neon-gold p-6 space-y-6">
            {error && (
              <div className="border border-destructive/60 bg-destructive/10 p-3">
                <p className="font-terminal text-sm text-destructive">{error}</p>
              </div>
            )}
            <div>
              <h2 className="font-pixel text-[10px] text-neon-gold mb-1">⚡ {active.title ?? "WEEKLY INTEL BRIEF"}</h2>
              <p className="font-terminal text-sm text-muted-foreground">{active.generated_at ? new Date(active.generated_at).toLocaleString() : "—"}</p>
            </div>

            <div>
              <h3 className="font-pixel text-[8px] text-neon-gold mb-3 border-b border-neon-gold/30 pb-2">EXECUTIVE SUMMARY</h3>
              <div className="font-terminal text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{strategy.executive_summary ?? active.executive_summary ?? "No summary available."}</div>
              <div className="mt-3">
                <p className="font-pixel text-[7px] text-muted-foreground mb-1">THREAT LEVEL THIS WEEK</p>
                <div className="w-full h-2 bg-muted"><div className="h-full bg-neon-magenta" style={{ width: `${threatPercent}%` }} /></div>
              </div>
            </div>

            {strategy.user_context && (
              <div className="bg-background border border-neon-cyan/50 p-4 space-y-2">
                <h3 className="font-pixel text-[8px] text-neon-cyan">USER CONTEXT</h3>
                <div className="font-terminal text-xs space-y-1">
                  <p><span className="text-foreground font-bold">PRODUCT: </span><span className="text-muted-foreground">{strategy.user_context.product_name ?? "—"}</span></p>
                  <p><span className="text-neon-cyan font-bold">POSITIONING: </span><span className="text-muted-foreground">{strategy.user_context.positioning ?? "—"}</span></p>
                  <p><span className="text-neon-cyan font-bold">TARGET MARKET: </span><span className="text-muted-foreground">{strategy.user_context.target_market ?? "—"}</span></p>
                  <p><span className="text-neon-cyan font-bold">KEY FEATURES: </span><span className="text-muted-foreground">{strategy.user_context.key_features?.join(", ") || "—"}</span></p>
                </div>
              </div>
            )}

            {insights.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-pixel text-[8px] text-neon-magenta">KEY INSIGHTS</h3>
                {insights.map((insight, i) => {
                  const urgencyKey = (insight.urgency ?? "LOW").toUpperCase();
                  const resolvedSignalType = insight.signal_type ?? (insight.signal_id ? signalTypeById[insight.signal_id] : "") ?? "";
                  return (
                    <div key={i} className="bg-background border border-neon-magenta p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-pixel text-[8px] text-foreground">{insight.competitor ?? "COMPETITOR"}</span>
                          <Badge variant="outline" className="font-terminal text-[9px] text-neon-cyan border-neon-cyan rounded-none">{signalConfig(resolvedSignalType).label}</Badge>
                          {insight.verification_note && (
                            <Badge variant="outline" className="font-terminal text-[9px] text-neon-gold border-neon-gold rounded-none">EVIDENCE FLAG</Badge>
                          )}
                          {insight.consistency_note && (
                            <Badge variant="outline" className="font-terminal text-[9px] text-neon-magenta border-neon-magenta rounded-none">CONTRADICTION</Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={`font-pixel text-[6px] rounded-none ${urgencyColors[urgencyKey] ?? urgencyColors.LOW}`}>{urgencyKey}</Badge>
                      </div>
                      <div className="font-terminal text-sm space-y-2">
                        <p><span className="text-foreground font-bold">WHAT HAPPENED: </span><span className="text-muted-foreground">{insight.what_happened ?? "—"}</span></p>
                        <p><span className="text-neon-cyan font-bold">WHY IT MATTERS: </span><span className="text-muted-foreground">{insight.why_it_matters ?? "—"}</span></p>
                        {insight.verification_note && (
                          <p><span className="text-neon-gold font-bold">EVIDENCE CHECK: </span><span className="text-muted-foreground">{insight.verification_note}</span></p>
                        )}
                        {insight.consistency_note && (
                          <p><span className="text-neon-magenta font-bold">CONSISTENCY CHECK: </span><span className="text-muted-foreground">{insight.consistency_note}</span></p>
                        )}
                        <div className="flex items-start gap-2">
                          <Checkbox checked={checkedActions[`${i}`] || false} onCheckedChange={(v) => setCheckedActions((p) => ({ ...p, [`${i}`]: !!v }))} className="mt-1 border-primary data-[state=checked]:bg-primary" />
                          <p><span className="text-neon-gold font-bold">ACTION: </span><span className="text-muted-foreground">{insight.recommended_action ?? "—"}</span></p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {strategy.strategic_outlook && (
              <div>
                <h3 className="font-pixel text-[8px] text-foreground mb-3">STRATEGIC OUTLOOK</h3>
                <p className="font-terminal text-sm text-muted-foreground">{strategy.strategic_outlook}</p>
              </div>
            )}

            {strategy.scenarios?.scenarios && strategy.scenarios.scenarios.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-pixel text-[8px] text-neon-cyan">FORWARD SCENARIOS</h3>
                {strategy.scenarios.scenarios.slice(0, 3).map((scenario, index) => (
                  <div key={index} className="bg-background border border-neon-cyan/50 p-3 font-terminal text-xs space-y-1">
                    <p><span className="text-foreground font-bold">{scenario.competitor_name ?? "Competitor"}:</span> <span className="text-muted-foreground">{scenario.prediction ?? "—"}</span></p>
                    <p><span className="text-neon-cyan font-bold">TIMEFRAME: </span><span className="text-muted-foreground">{scenario.timeframe ?? "—"}</span></p>
                    <p><span className="text-neon-gold font-bold">PREEMPTIVE ACTION: </span><span className="text-muted-foreground">{scenario.preemptive_action ?? "—"}</span></p>
                  </div>
                ))}
              </div>
            )}

            {digestSignals.length > 0 && (
              <div>
                <button onClick={() => setExpandedSignals(!expandedSignals)} className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors">
                  {expandedSignals ? "▼" : "▶"} VIEW SOURCE SIGNALS ({digestSignals.length})
                </button>
                {expandedSignals && (
                  <div className="mt-2 space-y-1">
                    {digestSignals.map((signal) => {
                      const tc = signalConfig(signal.signal_type);
                      const competitorName = Array.isArray(signal.competitors) ? signal.competitors[0]?.name : signal.competitors?.name;
                      return (
                        <div key={signal.id} className="flex items-center gap-2 font-terminal text-xs p-2 bg-background border border-muted">
                          <div className={`w-2 h-2 rounded-full ${tc.dotClass}`} />
                          <span className="text-foreground font-bold">{competitorName ?? "COMPETITOR"}</span>
                          <span className="text-muted-foreground truncate flex-1">{signal.title}</span>
                          <span className="text-muted-foreground shrink-0">{formatTimeAgo(signal.detected_at)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
