import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Competitor {
  name: string;
  initials: string;
  category: string;
  signals: number;
  lastActive: string;
  latestSignal: string;
  threat: "low" | "medium" | "high";
}

const competitors: Competitor[] = [
  {
    name: "Coda",
    initials: "C",
    category: "Docs & Collaboration",
    signals: 14,
    lastActive: "5h ago",
    latestSignal: "New API integrations announced for Q1",
    threat: "medium",
  },
  {
    name: "Slite",
    initials: "S",
    category: "Knowledge Base",
    signals: 8,
    lastActive: "1d ago",
    latestSignal: "Series B funding round closed at $35M",
    threat: "low",
  },
  {
    name: "Craft",
    initials: "CR",
    category: "Documents",
    signals: 19,
    lastActive: "3h ago",
    latestSignal: "Launched AI writing assistant feature",
    threat: "high",
  },
];

const threatColors = {
  low: { border: "border-primary", glow: "hover:glow-green", ring: "border-primary", text: "text-primary" },
  medium: { border: "border-neon-gold", glow: "hover:glow-green", ring: "border-neon-gold", text: "text-neon-gold" },
  high: { border: "border-neon-magenta", glow: "hover:glow-magenta", ring: "border-neon-magenta", text: "text-neon-magenta" },
};

const CompetitorGrid = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {competitors.map((c, i) => {
        const tc = threatColors[c.threat];
        return (
          <div
            key={c.name}
            className={`bg-card border ${tc.border} p-5 ${tc.glow} transition-all duration-200 relative group`}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={hoveredIdx === i ? { transform: "translateY(-4px)" } : {}}
          >
            <div className="flex items-center gap-3 mb-4">
              <Avatar className={`h-10 w-10 border-2 ${tc.ring}`}>
                <AvatarFallback className={`bg-card ${tc.text} font-pixel text-[8px]`}>
                  {c.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-pixel text-[9px] text-foreground">{c.name}</h3>
                <Badge variant="outline" className="font-terminal text-[10px] text-muted-foreground border-muted-foreground rounded-none mt-1">
                  {c.category}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between mb-3 font-terminal text-sm">
              <div>
                <p className="text-muted-foreground text-xs">SIGNALS</p>
                <p className="text-neon-cyan">{c.signals}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">LAST ACTIVE</p>
                <p className="text-foreground">{c.lastActive}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">THREAT</p>
                <p className={tc.text}>{c.threat.toUpperCase()}</p>
              </div>
            </div>

            <p className="font-terminal text-xs text-muted-foreground italic truncate">{c.latestSignal}</p>

            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-4 right-4 font-pixel text-[7px] text-primary border-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-none"
            >
              VIEW INTEL →
            </Button>
          </div>
        );
      })}

      {/* Add Competitor Tile */}
      <div className="bg-card border border-dashed border-primary p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:glow-green transition-shadow min-h-[200px]">
        <Plus className="h-8 w-8 text-primary" />
        <span className="font-pixel text-[8px] text-primary">ADD COMPETITOR</span>
      </div>
    </div>
  );
};

export default CompetitorGrid;
