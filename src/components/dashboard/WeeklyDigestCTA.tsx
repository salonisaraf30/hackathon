import { Button } from "@/components/ui/button";

const WeeklyDigestCTA = () => {
  return (
    <div className="bg-card border border-primary p-6 neon-grid-bg relative overflow-hidden animate-border-pulse">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-pixel text-[10px] sm:text-xs text-primary text-glow-green mb-2">
            📬 YOUR WEEKLY INTEL BRIEF IS READY
          </h3>
          <p className="font-terminal text-sm text-muted-foreground">
            AI-generated insights personalized to your product positioning
          </p>
        </div>
        <Button className="font-pixel text-[8px] bg-neon-magenta text-background hover:bg-neon-magenta/80 glow-magenta rounded-none px-6 shrink-0">
          GENERATE BRIEF →
        </Button>
      </div>
    </div>
  );
};

export default WeeklyDigestCTA;
