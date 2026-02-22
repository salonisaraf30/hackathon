"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const urgencyHex: Record<string, string> = {
  HIGH: "#FF00FF",
  MEDIUM: "#00FFFF",
  LOW: "#00FF41",
};

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

function formatTimeAgo(v: string | null): string {
  if (!v) return "—";
  const t = new Date(v).getTime();
  if (Number.isNaN(t)) return "—";
  const h = Math.floor((Date.now() - t) / 3.6e6);
  if (h < 1) return "NOW";
  if (h < 24) return `${h}H AGO`;
  return `${Math.floor(h / 24)}D AGO`;
}

function signalConfig(type: string) {
  return signalTypeConfig[type] ?? { color: "#00FFFF", label: type.toUpperCase() || "SIGNAL", dotClass: "bg-neon-cyan", borderClass: "border-neon-cyan" };
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-[#00FFFF] mb-1" style={SM}>INTELLIGENCE BRIEFS</h1>
          <p className="text-[13px] text-[#888888]" style={IBM}>No digest yet. Generate your first brief after onboarding ingestion completes.</p>
        </div>
        {error && <p className="text-[13px] text-red-400" style={IBM}>{error}</p>}
        <button
          className="px-4 py-2 rounded text-[13px] transition-colors"
          style={{ backgroundColor: "#FF00FF", color: "#000", ...SM }}
          onClick={() => void generateDigest()}
          disabled={generating}
        >
          {generating ? "GENERATING..." : "GENERATE →"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#00FFFF] mb-1" style={SM}>INTELLIGENCE BRIEFS</h1>
        <p className="text-[13px] text-[#888888]" style={IBM}>AI-generated weekly briefings from live competitor signals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left panel — 30% brief list */}
        <div className="lg:col-span-3 space-y-2">
          {digests.map((digest, index) => (
            <div
              key={digest.id}
              onClick={() => setSelectedId(digest.id)}
              className="p-4 rounded-lg cursor-pointer transition-all"
              style={{
                backgroundColor: "#0a0a0a",
                border: active.id === digest.id ? "1px solid #00FFFF" : "1px solid rgba(255,255,255,0.08)",
                borderLeft: active.id === digest.id ? "4px solid #00FFFF" : "4px solid rgba(0,255,255,0.3)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-white" style={SM}>BRIEF #{String(digests.length - index).padStart(3, "0")}</span>
                {index === 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] animate-pulse" style={{ backgroundColor: "#FF00FF", color: "#000", ...SM }}>NEW</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px]" style={{ color: "#00FF41", border: "1px solid #00FF41", ...SM }}>READ</span>
                )}
              </div>
              <p className="text-[12px] text-[#888888]" style={IBM}>
                {digest.generated_at ? new Date(digest.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase() : "—"}
              </p>
            </div>
          ))}

          {/* Generate new brief card */}
          <div className="p-4 rounded-lg mt-4" style={{ backgroundColor: "#0a0a0a", border: "1px solid #00FF41" }}>
            <p className="text-[12px] text-[#00FF41] mb-2" style={SM}>GENERATE NEW BRIEF</p>
            {error && <p className="text-[11px] text-red-400 mb-2" style={IBM}>{error}</p>}
            <button
              className="w-full px-4 py-2 rounded text-[13px] transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#FF00FF", color: "#000", ...SM }}
              onClick={() => void generateDigest()}
              disabled={generating}
            >
              {generating ? "GENERATING..." : "GENERATE →"}
            </button>
          </div>
        </div>

        {/* Right panel — 70% active digest */}
        <div className="lg:col-span-7 p-6 rounded-lg space-y-6" style={{ backgroundColor: "#0a0a0a", border: "1px solid #00FFFF" }}>
          {error && (
            <div className="p-3 rounded" style={{ border: "1px solid rgba(248,113,113,0.4)", backgroundColor: "rgba(248,113,113,0.1)" }}>
              <p className="text-[13px] text-red-400" style={IBM}>{error}</p>
            </div>
          )}

          <div>
            <h2 className="text-[16px] text-[#00FFFF] mb-1" style={SM}>{active.title ?? "WEEKLY INTEL BRIEF"}</h2>
            <p className="text-[12px] text-[#888888]" style={IBM}>{active.generated_at ? new Date(active.generated_at).toLocaleString() : "—"}</p>
          </div>

          {/* Executive Summary */}
          <div>
            <h3 className="text-[13px] text-[#00FFFF] mb-3 pb-2" style={{ ...SM, borderBottom: "1px solid rgba(0,255,255,0.3)" }}>EXECUTIVE SUMMARY</h3>
            <p className="text-[13px] text-[#888888] whitespace-pre-line leading-relaxed" style={IBM}>
              {strategy.executive_summary ?? active.executive_summary ?? "No summary available."}
            </p>
            <div className="mt-3">
              <p className="text-[11px] text-[#888888] mb-1" style={IBM}>THREAT LEVEL THIS WEEK</p>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#FF00FF]" style={{ width: `${threatPercent}%` }} />
              </div>
            </div>
          </div>

          {/* User Context */}
          {strategy.user_context && (
            <div className="p-4 rounded-lg space-y-2" style={{ border: "1px solid rgba(0,255,255,0.4)", backgroundColor: "rgba(0,255,255,0.05)" }}>
              <h3 className="text-[13px] text-[#00FFFF]" style={SM}>USER CONTEXT</h3>
              <div className="text-[12px] space-y-1" style={IBM}>
                <p><span className="text-white font-bold">PRODUCT: </span><span className="text-[#888888]">{strategy.user_context.product_name ?? "—"}</span></p>
                <p><span className="text-[#00FFFF] font-bold">POSITIONING: </span><span className="text-[#888888]">{strategy.user_context.positioning ?? "—"}</span></p>
                <p><span className="text-[#00FFFF] font-bold">TARGET MARKET: </span><span className="text-[#888888]">{strategy.user_context.target_market ?? "—"}</span></p>
                <p><span className="text-[#00FFFF] font-bold">KEY FEATURES: </span><span className="text-[#888888]">{strategy.user_context.key_features?.join(", ") || "—"}</span></p>
              </div>
            </div>
          )}

          {/* Key Insights */}
          {insights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[13px] text-[#FF00FF]" style={SM}>KEY INSIGHTS</h3>
              {insights.map((insight, i) => {
                const urgencyKey = (insight.urgency ?? "LOW").toUpperCase();
                const uColor = urgencyHex[urgencyKey] ?? urgencyHex.LOW;
                const resolvedSignalType = insight.signal_type ?? (insight.signal_id ? signalTypeById[insight.signal_id] : "") ?? "";
                return (
                  <div key={i} className="p-4 rounded-lg space-y-3" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid #FF00FF" }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-white" style={SM}>{insight.competitor ?? "COMPETITOR"}</span>
                        <span className="px-2 py-0.5 rounded text-[11px]" style={{ color: "#00FFFF", border: "1px solid #00FFFF", ...IBM }}>
                          {signalConfig(resolvedSignalType).label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px]" style={{ color: uColor, border: `1px solid ${uColor}`, ...SM }}>{urgencyKey}</span>
                    </div>
                    <div className="text-[13px] space-y-2" style={IBM}>
                      <p><span className="text-white font-bold">WHAT HAPPENED: </span><span className="text-[#888888]">{insight.what_happened ?? "—"}</span></p>
                      <p><span className="text-[#00FFFF] font-bold">WHY IT MATTERS: </span><span className="text-[#888888]">{insight.why_it_matters ?? "—"}</span></p>
                      <div className="flex items-start gap-2">
                        <Checkbox checked={checkedActions[`${i}`] || false} onCheckedChange={(v) => setCheckedActions((p) => ({ ...p, [`${i}`]: !!v }))} className="mt-1 border-[#00FF41] data-[state=checked]:bg-[#00FF41]" />
                        <p><span className="text-[#00FF41] font-bold">ACTION: </span><span className="text-[#888888]">{insight.recommended_action ?? "—"}</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Strategic Outlook */}
          {strategy.strategic_outlook && (
            <div>
              <h3 className="text-[13px] text-white mb-3" style={SM}>STRATEGIC OUTLOOK</h3>
              <p className="text-[13px] text-[#888888]" style={IBM}>{strategy.strategic_outlook}</p>
            </div>
          )}

          {/* Forward Scenarios */}
          {strategy.scenarios?.scenarios && strategy.scenarios.scenarios.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[13px] text-[#00FFFF]" style={SM}>FORWARD SCENARIOS</h3>
              {strategy.scenarios.scenarios.slice(0, 3).map((scenario, index) => (
                <div key={index} className="p-3 rounded-lg text-[12px] space-y-1" style={{ border: "1px solid rgba(0,255,255,0.3)", ...IBM }}>
                  <p><span className="text-white font-bold">{scenario.competitor_name ?? "Competitor"}:</span> <span className="text-[#888888]">{scenario.prediction ?? "—"}</span></p>
                  <p><span className="text-[#00FFFF] font-bold">TIMEFRAME: </span><span className="text-[#888888]">{scenario.timeframe ?? "—"}</span></p>
                  <p><span className="text-[#00FF41] font-bold">PREEMPTIVE ACTION: </span><span className="text-[#888888]">{scenario.preemptive_action ?? "—"}</span></p>
                </div>
              ))}
            </div>
          )}

          {/* Source Signals */}
          {digestSignals.length > 0 && (
            <div>
              <button onClick={() => setExpandedSignals(!expandedSignals)} className="text-[12px] text-[#888888] hover:text-white transition-colors" style={SM}>
                {expandedSignals ? "▼" : "▶"} VIEW SOURCE SIGNALS ({digestSignals.length})
              </button>
              {expandedSignals && (
                <div className="mt-2 space-y-1">
                  {digestSignals.map((signal) => {
                    const cfg = signalConfig(signal.signal_type);
                    const compName = Array.isArray(signal.competitors) ? signal.competitors[0]?.name : signal.competitors?.name;
                    return (
                      <div key={signal.id} className="flex items-center gap-2 text-[12px] p-2 rounded" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", ...IBM }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                        <span className="text-white font-bold">{compName ?? "COMPETITOR"}</span>
                        <span className="text-[#888888] truncate flex-1">{signal.title}</span>
                        <span className="text-[#888888] shrink-0">{formatTimeAgo(signal.detected_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
