import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const sparklineData = [
  { d: 1, v: 3 }, { d: 2, v: 5 }, { d: 3, v: 2 }, { d: 4, v: 8 },
  { d: 5, v: 6 }, { d: 6, v: 9 }, { d: 7, v: 7 },
];

const TopCompetitorCard = () => {
  return (
    <div className="bg-card border border-neon-magenta p-6 glow-magenta relative">
      {/* Boss badge */}
      <Badge className="absolute top-3 right-3 bg-transparent border-neon-gold text-neon-gold font-pixel text-[7px] rounded-none">
        👑 BOSS LEVEL
      </Badge>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Avatar + Info */}
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="h-16 w-16 border-2 border-neon-magenta glow-magenta">
            <AvatarFallback className="bg-card text-neon-magenta font-pixel text-sm">N</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-pixel text-sm text-foreground mb-1">NOTION</h2>
            <Badge variant="outline" className="text-neon-cyan border-neon-cyan font-terminal text-xs rounded-none mb-3">
              Productivity
            </Badge>
            <div className="mt-2">
              <p className="font-pixel text-[8px] text-neon-magenta mb-1">THREAT LEVEL: HIGH</p>
              <Progress value={85} className="h-2 w-32 bg-muted [&>div]:bg-neon-magenta" />
            </div>
          </div>
        </div>

        {/* Center: Quick Stats */}
        <div className="flex gap-6 items-center flex-1">
          <div>
            <p className="font-terminal text-xs text-muted-foreground">SIGNALS</p>
            <p className="font-terminal text-xl text-neon-cyan">23</p>
          </div>
          <div>
            <p className="font-terminal text-xs text-muted-foreground">LAST ACTIVE</p>
            <p className="font-terminal text-xl text-foreground">2h ago</p>
          </div>
          <div>
            <p className="font-terminal text-xs text-muted-foreground">BIGGEST MOVE</p>
            <p className="font-terminal text-sm text-neon-gold">AI feature launch</p>
          </div>
        </div>

        {/* Right: Sparkline */}
        <div className="w-36 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id="sparkGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(120,100%,50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(120,100%,50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="hsl(120,100%,50%)"
                fill="url(#sparkGreen)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TopCompetitorCard;
