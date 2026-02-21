import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Signal {
  competitor: string;
  title: string;
  type: "feature" | "pricing" | "social" | "funding";
  timeAgo: string;
}

const typeConfig = {
  feature: { dot: "bg-primary", label: "Feature", badge: "border-primary text-primary" },
  pricing: { dot: "bg-neon-magenta", label: "Pricing", badge: "border-neon-magenta text-neon-magenta" },
  social: { dot: "bg-neon-cyan", label: "Social", badge: "border-neon-cyan text-neon-cyan" },
  funding: { dot: "bg-neon-gold", label: "Funding", badge: "border-neon-gold text-neon-gold" },
};

const signals: Signal[] = [
  { competitor: "Notion", title: "Launched AI-powered meeting notes feature", type: "feature", timeAgo: "2h ago" },
  { competitor: "Coda", title: "Reduced Pro plan pricing by 20%", type: "pricing", timeAgo: "5h ago" },
  { competitor: "Craft", title: "Series C announcement on Twitter — $50M", type: "funding", timeAgo: "8h ago" },
  { competitor: "Slite", title: "New LinkedIn campaign targeting enterprise teams", type: "social", timeAgo: "12h ago" },
  { competitor: "Notion", title: "Published API v2 documentation", type: "feature", timeAgo: "1d ago" },
  { competitor: "Coda", title: "Partnered with Figma for design integration", type: "feature", timeAgo: "1d ago" },
];

const SignalsTimeline = () => {
  return (
    <div>
      <h3 className="font-pixel text-xs text-neon-cyan text-glow-cyan mb-4">📡 LIVE SIGNALS</h3>
      <div className="space-y-1">
        {signals.map((s, i) => {
          const tc = typeConfig[s.type];
          return (
            <div
              key={i}
              className="bg-card border border-muted p-3 flex items-center gap-3 hover:border-primary/30 transition-colors"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${tc.dot} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="font-terminal text-sm">
                  <span className="text-foreground font-bold">{s.competitor}</span>
                  <span className="text-muted-foreground"> — {s.title}</span>
                </p>
              </div>
              <span className="font-terminal text-xs text-muted-foreground shrink-0">{s.timeAgo}</span>
              <Badge variant="outline" className={`font-terminal text-[10px] ${tc.badge} rounded-none shrink-0`}>
                {tc.label}
              </Badge>
            </div>
          );
        })}
      </div>
      <Button variant="outline" className="mt-3 font-pixel text-[7px] text-primary border-primary rounded-none w-full">
        LOAD MORE →
      </Button>
    </div>
  );
};

export default SignalsTimeline;
