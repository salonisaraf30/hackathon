"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";
import { Plus } from "lucide-react";

import { signalTypeConfig, threatColors } from "@/data/mock-data";

/* ── Types ── */
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
  category: string;
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
  sparkline: number[];
};

const THREAT_COLORS: Record<string, string> = {
  high: "#FF00FF",
  medium: "#00FFFF",
  low: "#00FF41",
};

const COMPETITOR_COLORS: Record<string, string> = {
  notion: "#FF00FF",
  coda: "#00FFFF",
  slite: "#00FF41",
};

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
      color: "#00FFFF",
      label: type.toUpperCase(),
      dotClass: "bg-neon-cyan",
      borderClass: "border-neon-cyan",
    }
  );
}

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

/* ── Page ── */
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

        const rawSignals = ((signalsJson.signals as ApiSignal[] | undefined) ?? []).sort(
          (a, b) => new Date(b.detected_at ?? 0).getTime() - new Date(a.detected_at ?? 0).getTime()
        );
        setSignals(rawSignals);
        setDigests((digestsJson.digests as ApiDigest[] | undefined) ?? []);

        const rawCompetitors = (competitorsJson.competitors as ApiCompetitor[] | undefined) ?? [];

        const categories = ["PRODUCTIVITY", "DOCS & COLLAB", "KNOWLEDGE BASE"];
        const mapped = rawCompetitors.map((item, index) => {
          const compSignals = rawSignals.filter((s) => s.competitor_id === item.id);
          const latestSignal = compSignals[0];
          const weekSignals = compSignals.filter((s) => {
            if (!s.detected_at) return false;
            return Date.now() - new Date(s.detected_at).getTime() <= 7 * 24 * 60 * 60 * 1000;
          }).length;
          const totalSignals = compSignals.length || item.signals?.[0]?.count || 0;
          const threatScore = Math.min(95, 25 + totalSignals * 4 + weekSignals * 8);
          const threat = threatScore >= 70 ? "high" : threatScore >= 45 ? "medium" : "low";
          const nameKey = item.name.toLowerCase();
          const color = COMPETITOR_COLORS[nameKey] || Object.values(COMPETITOR_COLORS)[index % 3];

          return {
            id: item.id,
            name: item.name,
            initials: item.name.slice(0, 2).toUpperCase(),
            category: categories[index % 3],
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
            color,
            sparkline: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10) + 1),
          } as UiCompetitor;
        });
        setCompetitors(mapped);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const boss = useMemo(
    () => [...competitors].sort((a, b) => b.threatScore - a.threatScore)[0] ?? null,
    [competitors]
  );

  const stats = useMemo(() => {
    const weeklySignals = signals.filter((s) => {
      if (!s.detected_at) return false;
      return Date.now() - new Date(s.detected_at).getTime() <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const threatAlerts = competitors.filter((c) => c.threat === "high").length;
    return { competitorCount: competitors.length, weeklySignals, threatAlerts };
  }, [competitors, signals]);

  const recentSignals = useMemo(() => signals.slice(0, 6), [signals]);

  const radarCompetitors = useMemo(() => competitors.slice(0, 3), [competitors]);
  const radarData = useMemo(() => {
    const axes = ["Pricing", "Product", "Marketing", "Hiring", "Funding"];
    const typeMap: Record<string, string> = {
      Pricing: "pricing_change",
      Product: "feature_update",
      Marketing: "social_post",
      Hiring: "hiring",
      Funding: "funding",
    };
    return axes.map((axis) => {
      const row: Record<string, string | number> = { axis };
      for (const c of radarCompetitors) {
        const count = signals.filter(
          (s) => s.competitor_id === c.id && s.signal_type === typeMap[axis]
        ).length;
        row[c.name] = count;
      }
      return row;
    });
  }, [radarCompetitors, signals]);

  const canRenderRadar = radarCompetitors.length > 0 && radarData.length > 0;

  return (
    <div className="space-y-6">
      {/* ── STATS BAR ── */}
      <div className="flex flex-nowrap items-center gap-8 min-h-[80px]" style={{ overflow: "visible" }}>
        <div className="flex items-center gap-4 min-w-[200px]">
          <span className="text-[11px] text-[#888888] block" style={IBM}>COMPETITORS TRACKED</span>
          <span className="text-5xl text-[#00FF41]" style={SM}>{stats.competitorCount}</span>
        </div>
        <div className="flex items-center gap-4 min-w-[200px]">
          <span className="text-[11px] text-[#888888] block" style={IBM}>SIGNALS THIS WEEK</span>
          <span className="text-5xl text-[#00FFFF]" style={SM}>{stats.weeklySignals}</span>
        </div>
        <div className="flex items-center gap-4 min-w-[200px]">
          <span className="text-[11px] text-[#888888] block" style={IBM}>THREAT ALERTS</span>
          <span className="text-5xl text-[#FF00FF]" style={SM}>{stats.threatAlerts}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-[#888888]" style={IBM}>NEXT DIGEST</span>
          <span className="text-2xl text-white" style={SM}>MON 9AM</span>
        </div>
      </div>
      {/* Divider */}
      <div className="w-full h-px" style={{ backgroundColor: "rgba(0, 255, 65, 0.15)" }} />

      {/* ── HERO CARD ── */}
      {boss && (
        <div
          className="relative rounded-lg p-6"
          style={{ backgroundColor: "#0D0D0D", border: "1px solid #FF00FF" }}
        >
          {/* HIGH PRIORITY badge */}
          <span
            className="absolute top-3 right-3 px-2 py-1 rounded text-[13px]"
            style={{ ...SM, color: "#00FFFF", backgroundColor: "rgba(0, 255, 255, 0.2)" }}
          >
            HIGH PRIORITY
          </span>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: avatar + name */}
            <div className="flex items-start gap-4 flex-1">
              <div
                className="w-20 h-20 rounded-lg flex items-center justify-center text-2xl"
                style={{ border: "2px solid #FF00FF", color: "#FF00FF", ...SM }}
              >
                {boss.initials}
              </div>
              <div>
                <h2 className="text-3xl text-white mb-2" style={SM}>{boss.name}</h2>
                <span
                  className="inline-block px-2 py-0.5 rounded text-[12px] mb-2"
                  style={{ color: "#00FFFF", backgroundColor: "rgba(0, 255, 255, 0.2)", ...SM }}
                >
                  {boss.category}
                </span>
                <p className="text-[13px] text-[#FF00FF] mb-1" style={IBM}>THREAT LEVEL: CRITICAL</p>
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF00FF]" style={{ width: `${boss.threatScore}%` }} />
                </div>
              </div>
            </div>

            {/* Middle: stacked stats */}
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <span className="text-[11px] text-[#888888] block" style={IBM}>Signals this week</span>
                <span className="text-[16px] text-white" style={{ ...IBM, lineHeight: 1.6 }}>{boss.signalsThisWeek}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#888888] block" style={IBM}>Last active</span>
                <span className="text-[16px] text-white" style={{ ...IBM, lineHeight: 1.6 }}>{boss.lastActive}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#888888] block" style={IBM}>Latest move</span>
                <span className="text-[16px] text-white" style={{ ...IBM, lineHeight: 1.6 }}>{boss.biggestMove}</span>
              </div>
            </div>

            {/* Right: sparkline (hidden on md) */}
            <div className="flex-shrink-0 hidden lg:block" style={{ width: 120, height: 60 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={boss.sparkline.map((v, i) => ({ day: i, val: v }))}>
                  <Line type="monotone" dataKey="val" stroke="#00FF41" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPETITOR ROSTER ── */}
      <div className="flex items-center justify-between flex-nowrap">
        <h2 className="text-lg text-[#00FF41] uppercase tracking-wider" style={SM}>
          COMPETITOR ROSTER
        </h2>
        <button
          className="px-4 py-2 rounded text-black text-[13px] hover:brightness-110 transition"
          style={{ backgroundColor: "#00FF41", ...SM }}
          onClick={() => router.push("/competitors")}
        >
          + ADD COMPETITOR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {competitors.map((c) => {
          const tc = threatColors[c.threat];
          const hoverColor = THREAT_COLORS[c.threat];
          const isHovered = hoveredCard === c.id;
          return (
            <div
              key={c.id}
              className="glass-card rounded-lg p-5 transition-all duration-200 relative group cursor-pointer"
              style={{
                borderColor: isHovered ? hoverColor : "rgba(255,255,255,0.08)",
                transform: isHovered ? "translateY(-4px)" : "none",
              }}
              onMouseEnter={() => setHoveredCard(c.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => router.push(`/competitors/${c.id}`)}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px]"
                  style={{ border: `2px solid ${hoverColor}`, color: hoverColor, ...SM }}
                >
                  {c.initials}
                </div>
                <div>
                  <h3 className="text-[14px] text-white" style={SM}>{c.name}</h3>
                </div>
              </div>

              {/* Category pill */}
              <span
                className="inline-block px-2 py-0.5 rounded text-[11px] mb-2"
                style={{ color: "#00FFFF", backgroundColor: "rgba(0, 255, 255, 0.2)", ...IBM }}
              >
                {c.category}
              </span>

              {/* Latest signal */}
              <p className="text-[13px] text-[#888888] italic truncate mb-3" style={IBM}>
                Latest: {c.biggestMove}
              </p>

              {/* Threat bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                <div className="h-full" style={{ width: `${c.threatScore}%`, backgroundColor: hoverColor }} />
              </div>

              {/* Bottom stats */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-[#888888] block" style={IBM}>SIGNALS</span>
                  <span className="text-white text-[13px]" style={SM}>{c.signals}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#888888] block" style={IBM}>LAST SEEN</span>
                  <span className="text-white text-[13px]" style={SM}>{c.lastActive}</span>
                </div>
              </div>

              {/* Hover button */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[13px] text-[#00FF41]" style={SM}>VIEW INTEL →</span>
              </div>
            </div>
          );
        })}

        {/* Add competitor card */}
        <div
          className="rounded-lg p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:glow-green transition-shadow min-h-[200px]"
          style={{ border: "1px dashed #00FF41" }}
          onClick={() => router.push("/competitors")}
        >
          <Plus className="h-8 w-8 text-[#00FF41]" />
          <span className="text-[13px] text-[#00FF41]" style={SM}>+ ADD COMPETITOR</span>
        </div>
      </div>

      {/* ── WEEKLY INTELLIGENCE BRIEF CTA ── */}
      <div
        className="flex items-center justify-between p-6 rounded-lg"
        style={{ backgroundColor: "#0a0a0a", border: "1px solid #00FF41" }}
      >
        <div>
          <h3 className="text-[13px] text-[#00FF41] mb-1" style={SM}>Weekly Intelligence Brief Ready</h3>
          <p className="text-[13px] text-[#888888]" style={IBM}>Generated from live competitor signals and AI strategy analysis</p>
        </div>
        <button
          className="px-4 py-2 rounded text-black text-[13px] hover:brightness-110 transition shrink-0"
          style={{ backgroundColor: "#00FF41", ...SM }}
          onClick={() => router.push("/digest")}
        >
          GENERATE BRIEF →
        </button>
      </div>

      {/* ── LIVE SIGNALS + THREAT RADAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
        {/* Live Signals */}
        <div className="rounded-lg p-5" style={{ backgroundColor: "#0a0a0a", border: "1px solid #00FFFF" }}>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[13px] text-[#00FFFF]" style={SM}>LIVE SIGNALS</h3>
            <span className="w-2 h-2 rounded-full bg-[#00FF41]" />
          </div>

          <div className="space-y-1">
            {recentSignals.map((signal) => {
              const config = signalConfig(signal.signal_type);
              const competitorName = Array.isArray(signal.competitors)
                ? signal.competitors[0]?.name
                : signal.competitors?.name;
              return (
                <div
                  key={signal.id}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 rounded transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                  <span className="text-[13px] shrink-0" style={{ ...SM, color: config.color }}>
                    {competitorName ?? "COMPETITOR"}
                  </span>
                  <span className="text-[13px] text-white truncate flex-1" style={IBM}>
                    {signal.title}
                  </span>
                  <span className="text-[13px] text-[#888888] shrink-0" style={IBM}>
                    {formatTimeAgo(signal.detected_at)}
                  </span>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded shrink-0"
                    style={{
                      color: config.color,
                      backgroundColor: `${config.color}30`,
                      ...SM,
                    }}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
            {!loading && recentSignals.length === 0 && (
              <p className="text-[13px] text-[#888888]" style={IBM}>No signals yet. Add competitors and run ingestion.</p>
            )}
          </div>

          <button
            className="mt-3 text-[13px] text-[#00FF41] hover:underline"
            style={SM}
            onClick={() => router.push("/signals")}
          >
            LOAD MORE →
          </button>
        </div>

        {/* Threat Radar */}
        <div className="rounded-lg p-5" style={{ backgroundColor: "#0a0a0a", border: "1px solid #FF00FF" }}>
          <h3 className="text-[13px] text-[#FF00FF] mb-4" style={SM}>THREAT RADAR</h3>

          {canRenderRadar ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#00FF41" strokeOpacity={0.15} />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: "#ffffff", fontSize: 11, fontFamily: "var(--font-ibm-plex-mono)" }}
                />
                {radarCompetitors.map((c) => {
                  const nameKey = c.name.toLowerCase();
                  const color = COMPETITOR_COLORS[nameKey] || "#00FFFF";
                  return (
                    <Radar
                      key={c.id}
                      name={c.name}
                      dataKey={c.name}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.2}
                      strokeWidth={2}
                      dot={{ r: 3, fill: color }}
                    />
                  );
                })}
                <Legend
                  wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-ibm-plex-mono)", color: "#fff" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-[13px] text-[#888888]" style={IBM}>
                Add competitors and run ingestion to populate radar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
