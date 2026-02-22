// Seed data for Bloomberg-style dashboard

export type ThreatLevel = "low" | "medium" | "critical";

export const COMPETITORS = [
  { id: "comp-1", name: "Notion", category: "PRODUCTIVITY", website_url: "https://notion.so", twitter: "NotionHQ", product_hunt: "notion", threat: "critical" as ThreatLevel, threatScore: 85, signal_count: 6, last_seen: "2h ago", monitoring_since: "Jan 2025", sparkline: [2, 1, 0, 3, 0, 2, 6] },
  { id: "comp-2", name: "Coda", category: "PRODUCTIVITY", website_url: "https://coda.io", twitter: "coda_hq", product_hunt: "coda", threat: "medium" as ThreatLevel, threatScore: 52, signal_count: 5, last_seen: "1d ago", monitoring_since: "Jan 2025", sparkline: [0, 1, 2, 1, 1, 0, 5] },
  { id: "comp-3", name: "Slite", category: "KNOWLEDGE", website_url: "https://slite.com", twitter: "slite", product_hunt: "slite", threat: "low" as ThreatLevel, threatScore: 28, signal_count: 3, last_seen: "3d ago", monitoring_since: "Feb 2025", sparkline: [0, 0, 1, 0, 1, 1, 3] },
];

export const SIGNALS = [
  { id: "s1", competitor_id: "comp-1", competitor_name: "Notion", type: "pricing", title: "New pricing tier for teams", summary: "Notion announced a new mid-tier plan aimed at teams of 20–50.", source: "WEBSITE MONITOR", importance: 8, detected_at: "2025-02-20T09:00:00Z" },
  { id: "s2", competitor_id: "comp-1", competitor_name: "Notion", type: "hiring", title: "Hiring 3 ML engineers", summary: "Notion is scaling its AI/ML team with three new roles.", source: "TWITTER", importance: 7, detected_at: "2025-02-19T14:00:00Z" },
  { id: "s3", competitor_id: "comp-1", competitor_name: "Notion", type: "feature", title: "AI writing assistant in beta", summary: "Embedded AI writing assistant now in closed beta for workspace.", source: "WEBSITE MONITOR", importance: 9, detected_at: "2025-02-19T10:00:00Z" },
  { id: "s4", competitor_id: "comp-2", competitor_name: "Coda", type: "feature", title: "Dark mode + API v2 shipped", summary: "Coda released system-wide dark mode and a new API version.", source: "WEBSITE MONITOR", importance: 6, detected_at: "2025-02-19T12:00:00Z" },
  { id: "s5", competitor_id: "comp-2", competitor_name: "Coda", type: "launch", title: "Featured on Product Hunt", summary: "Templates pack reached #2 product of the day.", source: "PRODUCT HUNT", importance: 5, detected_at: "2025-02-18T18:00:00Z" },
  { id: "s6", competitor_id: "comp-2", competitor_name: "Coda", type: "social", title: "Enterprise campaign launch", summary: "New LinkedIn campaign targeting enterprise decision-makers.", source: "SOCIAL", importance: 4, detected_at: "2025-02-18T14:00:00Z" },
  { id: "s7", competitor_id: "comp-3", competitor_name: "Slite", type: "funding", title: "Raised Series A", summary: "Slite announced $15M Series A to expand in Europe.", source: "WEBSITE MONITOR", importance: 9, detected_at: "2025-02-18T10:00:00Z" },
  { id: "s8", competitor_id: "comp-3", competitor_name: "Slite", type: "feature", title: "New blog: Scaling async communication", summary: "Long-form guide on scaling async for 50–200 person teams.", source: "WEBSITE MONITOR", importance: 4, detected_at: "2025-02-17T16:00:00Z" },
  { id: "s9", competitor_id: "comp-1", competitor_name: "Notion", type: "pricing", title: "Enterprise tier price adjustment", summary: "Enterprise tier now starts at $24/user/month.", source: "WEBSITE MONITOR", importance: 7, detected_at: "2025-02-17T11:00:00Z" },
  { id: "s10", competitor_id: "comp-2", competitor_name: "Coda", type: "hiring", title: "Senior PM role posted", summary: "Coda is hiring a Senior PM for integrations.", source: "LINKEDIN", importance: 5, detected_at: "2025-02-16T09:00:00Z" },
  { id: "s11", competitor_id: "comp-1", competitor_name: "Notion", type: "social", title: "Twitter thread on AI roadmap", summary: "Notion shared a thread on their AI product direction.", source: "TWITTER", importance: 6, detected_at: "2025-02-16T08:00:00Z" },
  { id: "s12", competitor_id: "comp-3", competitor_name: "Slite", type: "launch", title: "Slite for Education launch", summary: "Dedicated offering for education teams with discounts.", source: "WEBSITE MONITOR", importance: 5, detected_at: "2025-02-15T12:00:00Z" },
];

export const RADAR_DATA = [
  { subject: "Pricing", Notion: 85, Coda: 60, Slite: 35, fullMark: 100 },
  { subject: "Product", Notion: 90, Coda: 70, Slite: 50, fullMark: 100 },
  { subject: "Marketing", Notion: 88, Coda: 55, Slite: 40, fullMark: 100 },
  { subject: "Hiring", Notion: 75, Coda: 50, Slite: 30, fullMark: 100 },
  { subject: "Funding", Notion: 70, Coda: 45, Slite: 80, fullMark: 100 },
];

export const TYPE_COLORS: Record<string, string> = {
  feature: "#00FF41",
  pricing: "#FF00FF",
  social: "#00FFFF",
  funding: "#FFD700",
  hiring: "#FFFF00",
  launch: "#00FF41",
};

export function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${m}/${y}`;
}
