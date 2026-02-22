import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { digests, signals, signalTypeConfig } from "@/data/mock-data";

const urgencyColors = { HIGH: "text-neon-magenta border-neon-magenta", MED: "text-neon-gold border-neon-gold", LOW: "text-primary border-primary" };

const DigestPage = () => {
  const [selectedId, setSelectedId] = useState(digests[0].id);
  const [expandedSignals, setExpandedSignals] = useState(false);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  const active = digests.find((d) => d.id === selectedId)!;
  const digestSignals = signals.filter((s) => active.signalIds.includes(s.id));

  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-60 p-6 space-y-6 dashboard-scroll">
        <div>
          <h1 className="font-pixel text-sm text-neon-gold mb-2" style={{ textShadow: "0 0 10px hsl(51,100%,50%,0.8)" }}>📬 INTELLIGENCE BRIEFS</h1>
          <p className="font-terminal text-lg text-muted-foreground">AI-generated weekly briefings. Personalized to your product.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Digest List */}
          <div className="lg:col-span-3 space-y-2">
            {digests.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`bg-card border-l-4 border border-muted p-4 cursor-pointer transition-all ${
                  selectedId === d.id ? "border-l-neon-gold border-neon-gold" : "border-l-neon-gold/30 hover:border-neon-gold/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-pixel text-[8px] text-foreground">BRIEF #{String(d.number).padStart(3, "0")}</span>
                  {d.status === "new" ? (
                    <Badge className="bg-neon-magenta text-background font-pixel text-[6px] rounded-none animate-pulse">NEW</Badge>
                  ) : (
                    <Badge variant="outline" className="text-primary border-primary font-pixel text-[6px] rounded-none">READ</Badge>
                  )}
                </div>
                <p className="font-terminal text-xs text-muted-foreground">{d.dateRange}</p>
              </div>
            ))}

            {/* Generate New */}
            <div className="bg-card border border-neon-gold p-4 animate-border-pulse mt-4" style={{ borderColor: "hsl(51,100%,50%)" }}>
              <p className="font-pixel text-[7px] text-neon-gold mb-2">GENERATE NEW BRIEF</p>
              <Button className="font-pixel text-[8px] bg-neon-gold text-background hover:bg-neon-gold/80 rounded-none w-full">GENERATE →</Button>
            </div>
          </div>

          {/* Active Digest */}
          <div className="lg:col-span-7 bg-card border border-neon-gold p-6 space-y-6">
            <div>
              <h2 className="font-pixel text-[10px] text-neon-gold mb-1">⚡ WEEKLY INTEL BRIEF #{String(active.number).padStart(3, "0")}</h2>
              <p className="font-terminal text-sm text-muted-foreground">{active.dateRange}</p>
            </div>

            {/* Executive Summary */}
            <div>
              <h3 className="font-pixel text-[8px] text-neon-gold mb-3 border-b border-neon-gold/30 pb-2">EXECUTIVE SUMMARY</h3>
              <div className="font-terminal text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{active.summary}</div>
              <div className="mt-3">
                <p className="font-pixel text-[7px] text-muted-foreground mb-1">THREAT LEVEL THIS WEEK: {active.threatLevel}</p>
                <div className="w-full h-2 bg-muted"><div className="h-full bg-neon-magenta" style={{ width: `${active.threatPercent}%` }} /></div>
              </div>
            </div>

            {/* Key Insights */}
            {active.insights.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-pixel text-[8px] text-neon-magenta">KEY INSIGHTS</h3>
                {active.insights.map((insight, i) => (
                  <div key={i} className="bg-background border border-neon-magenta p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[8px] text-foreground">{insight.competitorName}</span>
                        <Badge variant="outline" className="font-terminal text-[9px] text-neon-cyan border-neon-cyan rounded-none">{insight.signalType}</Badge>
                      </div>
                      <Badge variant="outline" className={`font-pixel text-[6px] rounded-none ${urgencyColors[insight.urgency]}`}>{insight.urgency}</Badge>
                    </div>
                    <div className="font-terminal text-sm space-y-2">
                      <p><span className="text-foreground font-bold">WHAT HAPPENED: </span><span className="text-muted-foreground">{insight.whatHappened}</span></p>
                      <p><span className="text-neon-cyan font-bold">WHY IT MATTERS: </span><span className="text-muted-foreground">{insight.whyItMatters}</span></p>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={checkedActions[`${i}`] || false}
                          onCheckedChange={(v) => setCheckedActions((p) => ({ ...p, [`${i}`]: !!v }))}
                          className="mt-1 border-primary data-[state=checked]:bg-primary"
                        />
                        <p><span className="text-neon-gold font-bold">ACTION: </span><span className="text-muted-foreground">{insight.recommendedAction}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Watch Items */}
            {active.watchItems.length > 0 && (
              <div>
                <h3 className="font-pixel text-[8px] text-foreground mb-3">WATCH NEXT WEEK</h3>
                <div className="space-y-2">
                  {active.watchItems.map((item, i) => (
                    <p key={i} className="font-terminal text-sm text-muted-foreground">→ {item}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Source Signals */}
            {digestSignals.length > 0 && (
              <div>
                <button onClick={() => setExpandedSignals(!expandedSignals)} className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors">
                  {expandedSignals ? "▼" : "▶"} VIEW SOURCE SIGNALS ({digestSignals.length})
                </button>
                {expandedSignals && (
                  <div className="mt-2 space-y-1">
                    {digestSignals.map((s) => {
                      const tc = signalTypeConfig[s.type];
                      return (
                        <div key={s.id} className="flex items-center gap-2 font-terminal text-xs p-2 bg-background border border-muted">
                          <div className={`w-2 h-2 rounded-full ${tc.dotClass}`} />
                          <span className="text-foreground font-bold">{s.competitorName}</span>
                          <span className="text-muted-foreground truncate flex-1">{s.title}</span>
                          <span className="text-muted-foreground shrink-0">{s.timeAgo}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-4 border-t border-muted">
              <Button variant="outline" className="font-pixel text-[7px] text-neon-cyan border-neon-cyan rounded-none">📤 SHARE BRIEF</Button>
              <Button variant="outline" className="font-pixel text-[7px] text-primary border-primary rounded-none">📧 EMAIL THIS BRIEF</Button>
              <Button variant="outline" className="font-pixel text-[7px] text-muted-foreground border-muted rounded-none">♻ REGENERATE</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DigestPage;
