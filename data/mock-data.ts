export interface Competitor {
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
}

export interface Signal {
  id: string;
  competitorId: string;
  competitorName: string;
  title: string;
  description: string;
  type: "feature_update" | "pricing_change" | "social_post" | "funding" | "hiring" | "product_launch";
  source: string;
  importance: number;
  timeAgo: string;
  date: string;
}

export interface DigestInsight {
  competitorName: string;
  signalType: string;
  whatHappened: string;
  whyItMatters: string;
  recommendedAction: string;
  urgency: "HIGH" | "MED" | "LOW";
  checked: boolean;
}

export interface Digest {
  id: string;
  number: number;
  dateRange: string;
  status: "new" | "read";
  summary: string;
  threatLevel: string;
  threatPercent: number;
  insights: DigestInsight[];
  watchItems: string[];
  signalIds: string[];
}

export const competitors: Competitor[] = [
  {
    id: "notion",
    name: "NOTION",
    initials: "N",
    category: "PRODUCTIVITY",
    threat: "high",
    threatScore: 85,
    signals: 24,
    signalsThisWeek: 6,
    lastActive: "2H AGO",
    biggestMove: "NEW PRICING TIER",
    website: "notion.so",
    twitter: "@NotionHQ",
    monitoringSince: "JAN 2025",
    color: "#FF00FF",
    sparkline: [3, 5, 2, 8, 6, 9, 7],
  },
  {
    id: "coda",
    name: "CODA",
    initials: "C",
    category: "DOCS & COLLAB",
    threat: "medium",
    threatScore: 62,
    signals: 18,
    signalsThisWeek: 5,
    lastActive: "5H AGO",
    biggestMove: "API V2 LAUNCH",
    website: "coda.io",
    twitter: "@caborHQ",
    monitoringSince: "FEB 2025",
    color: "#00FFFF",
    sparkline: [2, 4, 6, 3, 7, 5, 4],
  },
  {
    id: "slite",
    name: "SLITE",
    initials: "S",
    category: "KNOWLEDGE BASE",
    threat: "low",
    threatScore: 35,
    signals: 11,
    signalsThisWeek: 3,
    lastActive: "1D AGO",
    biggestMove: "SERIES B CLOSE",
    website: "slite.com",
    twitter: "@SliteHQ",
    monitoringSince: "MAR 2025",
    color: "#00FF41",
    sparkline: [1, 3, 2, 4, 2, 3, 5],
  },
];

export const signalTypeConfig: Record<string, { color: string; label: string; dotClass: string; borderClass: string }> = {
  feature_update: { color: "#00FF41", label: "FEATURE", dotClass: "bg-neon-green", borderClass: "border-neon-green" },
  pricing_change: { color: "#FF00FF", label: "PRICING", dotClass: "bg-neon-magenta", borderClass: "border-neon-magenta" },
  social_post: { color: "#00FFFF", label: "SOCIAL", dotClass: "bg-neon-cyan", borderClass: "border-neon-cyan" },
  funding: { color: "#00FFFF", label: "FUNDING", dotClass: "bg-neon-cyan", borderClass: "border-neon-cyan" },
  hiring: { color: "#00FFFF", label: "HIRING", dotClass: "bg-neon-cyan", borderClass: "border-neon-cyan" },
  product_launch: { color: "#00FF41", label: "LAUNCH", dotClass: "bg-neon-green", borderClass: "border-neon-green" },
};

export const signals: Signal[] = [
  { id: "s1", competitorId: "notion", competitorName: "NOTION", title: "Launched AI-powered meeting notes", description: "Notion rolled out a new AI feature that automatically summarizes meeting notes and generates action items. Available to all Pro and Enterprise users.", type: "feature_update", source: "WEBSITE CHANGE", importance: 9, timeAgo: "2H AGO", date: "2025-06-18" },
  { id: "s2", competitorId: "coda", competitorName: "CODA", title: "Reduced Pro plan pricing by 20%", description: "Coda dropped their Pro plan from $10/mo to $8/mo per user, targeting mid-market teams. Free tier limits unchanged.", type: "pricing_change", source: "PRICING PAGE", importance: 8, timeAgo: "5H AGO", date: "2025-06-18" },
  { id: "s3", competitorId: "notion", competitorName: "NOTION", title: "Series D extension at $15B valuation", description: "Notion closed a $150M extension to their Series D round, bringing total valuation to $15B. Funds earmarked for AI and enterprise.", type: "funding", source: "TECHCRUNCH", importance: 10, timeAgo: "8H AGO", date: "2025-06-18" },
  { id: "s4", competitorId: "slite", competitorName: "SLITE", title: "LinkedIn campaign targeting enterprise teams", description: "Slite launched an aggressive LinkedIn ad campaign targeting VP of Engineering and CTO titles, pushing their 'Ask' AI feature.", type: "social_post", source: "LINKEDIN", importance: 6, timeAgo: "12H AGO", date: "2025-06-17" },
  { id: "s5", competitorId: "coda", competitorName: "CODA", title: "Published API v2 documentation", description: "Coda released their fully revamped API v2 with support for real-time collaboration, webhooks, and custom automations.", type: "feature_update", source: "DEVELOPER DOCS", importance: 7, timeAgo: "1D AGO", date: "2025-06-17" },
  { id: "s6", competitorId: "notion", competitorName: "NOTION", title: "Partnered with Figma for design integration", description: "Notion announced a deep integration with Figma allowing live design embeds, commenting, and version tracking directly in docs.", type: "product_launch", source: "TWITTER", importance: 8, timeAgo: "1D AGO", date: "2025-06-17" },
  { id: "s7", competitorId: "slite", competitorName: "SLITE", title: "Hiring 15 ML engineers in Paris", description: "Slite posted 15 new ML engineering roles in their Paris HQ, signaling major investment in their AI capabilities.", type: "hiring", source: "CAREERS PAGE", importance: 7, timeAgo: "2D AGO", date: "2025-06-16" },
  { id: "s8", competitorId: "coda", competitorName: "CODA", title: "Launched Coda AI Packs marketplace", description: "New marketplace for community-built AI Packs that extend Coda's functionality with custom AI models and automations.", type: "product_launch", source: "PRODUCT HUNT", importance: 9, timeAgo: "2D AGO", date: "2025-06-16" },
  { id: "s9", competitorId: "notion", competitorName: "NOTION", title: "Updated enterprise security certifications", description: "Notion achieved SOC 2 Type II and HIPAA compliance, opening doors to healthcare and financial enterprise accounts.", type: "feature_update", source: "BLOG POST", importance: 7, timeAgo: "3D AGO", date: "2025-06-15" },
  { id: "s10", competitorId: "slite", competitorName: "SLITE", title: "Free tier now includes AI features", description: "Slite opened their AI Ask feature to free tier users with 50 queries/month, previously limited to paid plans.", type: "pricing_change", source: "PRICING PAGE", importance: 8, timeAgo: "3D AGO", date: "2025-06-15" },
  { id: "s11", competitorId: "coda", competitorName: "CODA", title: "Twitter thread on 2025 product roadmap", description: "CEO Shishir Mehrotra shared a 12-part Twitter thread detailing Coda's 2025 roadmap including tables-as-databases and mobile overhaul.", type: "social_post", source: "TWITTER", importance: 6, timeAgo: "4D AGO", date: "2025-06-14" },
  { id: "s12", competitorId: "notion", competitorName: "NOTION", title: "Acquired small calendar startup Morgen", description: "Notion quietly acquired Morgen, a cross-platform calendar app, likely to build native calendar functionality into Notion.", type: "funding", source: "THE INFORMATION", importance: 9, timeAgo: "5D AGO", date: "2025-06-13" },
];

export const digests: Digest[] = [
  {
    id: "d3",
    number: 3,
    dateRange: "JUN 13-18, 2025",
    status: "new",
    summary: "This week saw significant movements across all monitored competitors. Notion continues its aggressive expansion with an AI meeting notes feature and a $150M funding extension, while Coda is competing on price with a 20% reduction. Slite is investing heavily in AI talent. The competitive landscape is intensifying, particularly in the AI-powered productivity space.\n\nYour positioning in the developer-focused niche remains defensible, but Notion's Figma partnership signals a push toward design-adjacent workflows that could overlap with your user base.\n\nRecommend immediate focus on differentiating your AI capabilities and monitoring Coda's pricing strategy for potential user migration patterns.",
    threatLevel: "HIGH",
    threatPercent: 78,
    insights: [
      {
        competitorName: "NOTION",
        signalType: "FUNDING",
        whatHappened: "Closed $150M Series D extension at $15B valuation, earmarked for AI and enterprise expansion.",
        whyItMatters: "With this war chest, Notion can aggressively invest in AI features that directly compete with your core offering. Their hiring velocity will likely increase.",
        recommendedAction: "Accelerate your AI roadmap by 2 weeks. Consider a competitive positioning page highlighting your advantages over Notion's AI.",
        urgency: "HIGH",
        checked: false,
      },
      {
        competitorName: "CODA",
        signalType: "PRICING",
        whatHappened: "Dropped Pro plan pricing by 20% from $10 to $8/user/month.",
        whyItMatters: "Price-sensitive mid-market teams in your pipeline may now consider Coda more seriously. This could affect your conversion rates in the $8-15/seat range.",
        recommendedAction: "Prepare a competitive comparison deck for sales team. Consider a limited-time offer for teams switching from Coda.",
        urgency: "MED",
        checked: false,
      },
      {
        competitorName: "SLITE",
        signalType: "HIRING",
        whatHappened: "Posted 15 ML engineering roles in Paris, signaling major AI investment.",
        whyItMatters: "Slite's AI 'Ask' feature is their key differentiator. More ML engineers means faster iteration on AI capabilities that could match yours within 6 months.",
        recommendedAction: "Monitor Slite's AI feature releases monthly. Consider reaching out to ML candidates in the same talent pool.",
        urgency: "LOW",
        checked: false,
      },
    ],
    watchItems: [
      "Notion's Figma integration launch date and feature scope",
      "Coda's user growth response to pricing change (check social mentions)",
      "Slite's next AI feature release — likely within 4-6 weeks given hiring pace",
    ],
    signalIds: ["s1", "s2", "s3", "s4", "s5", "s6"],
  },
  {
    id: "d2",
    number: 2,
    dateRange: "JUN 6-12, 2025",
    status: "read",
    summary: "A quieter week with Notion focusing on enterprise security certifications and Slite opening AI features to free users. Coda's CEO shared an ambitious 2025 roadmap on Twitter. Overall threat level moderate.",
    threatLevel: "MEDIUM",
    threatPercent: 55,
    insights: [],
    watchItems: [],
    signalIds: ["s9", "s10", "s11", "s12"],
  },
  {
    id: "d1",
    number: 1,
    dateRange: "MAY 30 - JUN 5, 2025",
    status: "read",
    summary: "Initial monitoring period. Baseline competitor positions established. All three competitors showing active development cycles.",
    threatLevel: "LOW",
    threatPercent: 30,
    insights: [],
    watchItems: [],
    signalIds: [],
  },
];

export const threatColors: Record<string, { border: string; glow: string; ring: string; text: string; bg: string; hex: string }> = {
  low: { border: "border-neon-green", glow: "glow-green", ring: "border-neon-green", text: "text-neon-green", bg: "bg-neon-green", hex: "#00FF41" },
  medium: { border: "border-neon-cyan", glow: "glow-cyan", ring: "border-neon-cyan", text: "text-neon-cyan", bg: "bg-neon-cyan", hex: "#00FFFF" },
  high: { border: "border-neon-magenta", glow: "glow-magenta", ring: "border-neon-magenta", text: "text-neon-magenta", bg: "bg-neon-magenta", hex: "#FF00FF" },
};

export const radarData = [
  { axis: "Pricing", NOTION: 70, CODA: 80, SLITE: 50 },
  { axis: "Product", NOTION: 90, CODA: 65, SLITE: 45 },
  { axis: "Marketing", NOTION: 60, CODA: 55, SLITE: 70 },
  { axis: "Hiring", NOTION: 85, CODA: 40, SLITE: 60 },
  { axis: "Funding", NOTION: 95, CODA: 70, SLITE: 50 },
];
