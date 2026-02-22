export const MOCK_COMPETITORS = [
  { id: "comp-1", name: "Notion", website_url: "https://notion.so", description: "All-in-one workspace", last_scraped_at: "2025-02-20T10:00:00Z", signal_count: 4 },
  { id: "comp-2", name: "Coda", website_url: "https://coda.io", description: "Doc as powerful as an app", last_scraped_at: "2025-02-19T18:00:00Z", signal_count: 3 },
  { id: "comp-3", name: "Slite", website_url: "https://slite.com", description: "Knowledge base for modern teams", last_scraped_at: "2025-02-20T06:00:00Z", signal_count: 2 },
];

export const MOCK_SIGNALS = [
  { id: "sig-1", competitor_id: "comp-1", competitor_name: "Notion", signal_type: "pricing_change", title: "New pricing tier for teams", summary: "Notion announced a new mid-tier plan.", importance_score: 8, detected_at: "2025-02-20T09:00:00Z", label: "Pricing change" },
  { id: "sig-2", competitor_id: "comp-1", competitor_name: "Notion", signal_type: "hiring", title: "Hiring 3 ML engineers", summary: "Notion is scaling its AI/ML team.", importance_score: 7, detected_at: "2025-02-19T14:00:00Z", label: "Hiring" },
  { id: "sig-3", competitor_id: "comp-2", competitor_name: "Coda", signal_type: "feature_update", title: "Dark mode + API v2 shipped", summary: "Coda released dark mode and API v2.", importance_score: 6, detected_at: "2025-02-19T12:00:00Z", label: "Feature update" },
  { id: "sig-4", competitor_id: "comp-2", competitor_name: "Coda", signal_type: "product_launch", title: "Featured on Product Hunt", summary: "Templates pack reached #2 product of the day.", importance_score: 5, detected_at: "2025-02-18T18:00:00Z", label: "Product launch" },
  { id: "sig-5", competitor_id: "comp-3", competitor_name: "Slite", signal_type: "funding", title: "Raised Series A", summary: "Slite announced $15M Series A.", importance_score: 9, detected_at: "2025-02-18T10:00:00Z", label: "Funding" },
];

export const MOCK_DIGESTS = [
  { id: "dig-1", title: "Weekly Intelligence Brief — Feb 14–20, 2025", executive_summary: "This week's biggest story is Slite's Series A and Notion's new pricing tier.", strategic_insights: [{ competitor: "Notion", what_happened: "Notion launched a new mid-tier plan.", why_it_matters: "They're targeting the same segment.", recommended_action: "Add a comparison page.", urgency: "high" }, { competitor: "Slite", what_happened: "Slite raised $15M Series A.", why_it_matters: "They're doubling down on async.", recommended_action: "Define one use case to own.", urgency: "medium" }], strategic_outlook: "Watch for more async messaging.", period_start: "2025-02-14", period_end: "2025-02-20", read: false },
  { id: "dig-2", title: "Weekly Intelligence Brief — Feb 7–13, 2025", executive_summary: "Quieter week. Good time to focus on positioning.", strategic_insights: [], strategic_outlook: "Next week expect more hiring teasers.", period_start: "2025-02-07", period_end: "2025-02-13", read: true },
];

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
