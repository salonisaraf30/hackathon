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
import { Switch } from "@/components/ui/switch";
import { signalTypeConfig } from "@/data/mock-data";

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

const TABS = ["SIGNALS", "RADAR", "SETTINGS"];
const RADAR_AXES = ["feature_update", "pricing_change", "social_post", "funding", "hiring", "product_launch"];

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

function configForType(type: string) {
  return signalTypeConfig[type] ?? { color: "#00FFFF", label: type.toUpperCase(), dotClass: "bg-neon-cyan", borderClass: "border-neon-cyan" };
}

export default function CompetitorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("SIGNALS");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [competitor, setCompetitor] = useState<ApiCompetitor | null>(null);
  const [signals, setSignals] = useState<ApiSignal[]>([]);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [cRes, sRes] = await Promise.all([
        fetch("/api/competitors"),
        fetch(`/api/signals?competitor_id=${encodeURIComponent(id)}&limit=200`),
      ]);
      const cJson = await cRes.json();
      const sJson = await sRes.json();
      setCompetitor(((cJson.competitors as ApiCompetitor[] | undefined) ?? []).find((c) => c.id === id) ?? null);
      setSignals(((sJson.signals as ApiSignal[] | undefined) ?? []).sort(
        (a, b) => new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime()
      ));
    };
    void load();
  }, [id]);

  const threatScore = useMemo(() => {
    const weekly = signals.filter((s) => s.detected_at && Date.now() - new Date(s.detected_at).getTime() <= 7 * 24 * 3.6e6).length;
    return Math.min(95, 25 + signals.length * 4 + weekly * 8);
  }, [signals]);

  const threat = threatScore >= 70 ? "high" : threatScore >= 45 ? "medium" : "low";

  const filteredSignals = typeFilter === "ALL" ? signals : signals.filter((s) => configForType(s.signal_type).label === typeFilter);
  const typeFilterOptions = ["ALL", ...new Set(signals.map((s) => configForType(s.signal_type).label))];

  const radarData = RADAR_AXES.map((axis) => ({
    axis: configForType(axis).label,
    COMPETITOR: signals.filter((s) => s.signal_type === axis).length,
    "YOUR PRODUCT": Math.floor(Math.random() * 5) + 1,
  }));

  if (!competitor) {
    return (
      <div className="p-6">
        <button onClick={() => router.push("/competitors")} className="text-[11px] text-[#00FF41] hover:underline" style={SM}>
          ← BACK TO ROSTER
        </button>
        <p className="text-[13px] text-[#888888] mt-4" style={IBM}>Competitor not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button onClick={() => router.push("/competitors")} className="text-[11px] text-[#00FF41] hover:underline" style={SM}>
        ← BACK TO ROSTER
      </button>

      {/* Header card */}
      <div className="rounded-lg p-6" style={{ backgroundColor: "#0D0D0D", border: "1px solid #FF00FF" }}>
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div
            className="w-[120px] h-[120px] rounded-lg flex items-center justify-center text-3xl shrink-0"
            style={{ border: "2px solid #FF00FF", color: "#FF00FF", ...SM }}
          >
            {competitor.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-3xl text-white" style={SM}>{competitor.name}</h1>
            <div className="flex items-center gap-3">
              <span className="inline-block px-2 py-0.5 rounded text-[12px]" style={{ color: "#00FFFF", backgroundColor: "rgba(0,255,255,0.2)", ...IBM }}>
                MONITORED
              </span>
              <span className="text-[12px] text-[#888888]" style={IBM}>{competitor.website_url ?? "—"}</span>
            </div>
            <p className="text-[12px] text-[#888888]" style={IBM}>
              {competitor.twitter_handle ? `@${competitor.twitter_handle.replace(/^@/, "")}` : "—"}
            </p>
            <div className="flex gap-6 pt-2">
              <div>
                <span className="text-[11px] text-[#888888] block" style={IBM}>Monitoring Since</span>
                <span className="text-[16px] text-[#00FFFF]" style={SM}>
                  {competitor.created_at ? new Date(competitor.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase() : "—"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#888888] block" style={IBM}>Total Signals</span>
                <span className="text-[16px] text-[#00FF41]" style={SM}>{signals.length}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#888888] block" style={IBM}>Last Active</span>
                <span className="text-[16px] text-white" style={SM}>{formatTimeAgo(signals[0]?.detected_at ?? null)}</span>
              </div>
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-[#888888] block mb-1" style={IBM}>THREAT SCORE</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF00FF]" style={{ width: `${threatScore}%` }} />
                </div>
                <span className="text-[#FF00FF] text-[13px]" style={SM}>{threatScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="px-4 py-3 text-[13px] transition-colors"
            style={{
              ...SM,
              color: activeTab === t ? "#00FF41" : "#888888",
              borderBottom: activeTab === t ? "2px solid #00FF41" : "2px solid transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Signals tab */}
      {activeTab === "SIGNALS" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {typeFilterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className="px-3 py-1.5 rounded text-[12px] transition-colors"
                style={{
                  ...SM,
                  backgroundColor: typeFilter === f ? "#00FF41" : "transparent",
                  color: typeFilter === f ? "#000" : "#00FF41",
                  border: "1px solid #00FF41",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredSignals.map((s) => {
              const cfg = configForType(s.signal_type);
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-lg flex gap-4"
                  style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", borderLeftWidth: 4, borderLeftColor: cfg.color }}
                >
                  <div className="shrink-0 w-16 flex flex-col items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: `${cfg.color}30`, ...SM }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] text-white mb-1" style={IBM}>{s.title}</p>
                    <p className="text-[13px] text-[#888888] mb-2 line-clamp-2" style={{ ...IBM, lineHeight: 1.6 }}>
                      {s.summary ?? "No summary available"}
                    </p>
                    <p className="text-[11px] text-[#888888]/50" style={IBM}>via {s.source}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] text-[#888888] mb-2" style={IBM}>{formatTimeAgo(s.detected_at)}</p>
                    <p className="text-[13px] text-[#00FFFF]" style={SM}>{s.importance_score ?? 5}/10</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Radar tab */}
      {activeTab === "RADAR" && (
        <div className="p-6 rounded-lg" style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#00FF41" strokeOpacity={0.15} />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#fff", fontSize: 13, fontFamily: "var(--font-ibm-plex-mono)" }} />
              <Radar name={competitor.name} dataKey="COMPETITOR" stroke="#FF00FF" fill="#FF00FF" fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: "#FF00FF" }} />
              <Radar name="YOUR PRODUCT" dataKey="YOUR PRODUCT" stroke="#00FFFF" fill="#00FFFF" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: "#00FFFF" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Settings tab */}
      {activeTab === "SETTINGS" && (
        <div className="max-w-xl space-y-6">
          <div className="p-6 rounded-lg space-y-4" style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-[13px] text-white mb-4" style={SM}>MONITORED URLS</h3>
            <div>
              <label className="text-[13px] text-[#888888] block mb-1" style={IBM}>Website</label>
              <input className="terminal-input w-full px-3 py-2 rounded text-[13px]" style={IBM} defaultValue={competitor.website_url ?? ""} readOnly />
            </div>
            <div>
              <label className="text-[13px] text-[#888888] block mb-1" style={IBM}>Twitter</label>
              <input className="terminal-input w-full px-3 py-2 rounded text-[13px]" style={IBM} defaultValue={competitor.twitter_handle ?? ""} readOnly />
            </div>
          </div>

          <div className="p-6 rounded-lg space-y-4" style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="text-[13px] text-white mb-4" style={SM}>ALERT TYPES</h3>
            {["Feature Updates", "Pricing Changes", "Social Posts", "Funding News", "Hiring Activity", "Product Launches"].map((t) => (
              <div key={t} className="flex items-center justify-between">
                <span className="text-[13px] text-[#888888]" style={IBM}>{t}</span>
                <Switch defaultChecked className="data-[state=checked]:bg-[#00FF41]" />
              </div>
            ))}
          </div>

          <button
            className="px-4 py-2 rounded text-[13px] border transition-colors hover:bg-red-400/10"
            style={{ color: "rgb(248,113,113)", borderColor: "rgba(248,113,113,0.3)", ...SM }}
            onClick={() => router.push("/competitors")}
          >
            DELETE COMPETITOR
          </button>
        </div>
      )}
    </div>
  );
}
