import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const radarData = [
  { axis: "Pricing", Notion: 70, Coda: 50, Slite: 30 },
  { axis: "Product", Notion: 90, Coda: 65, Slite: 45 },
  { axis: "Marketing", Notion: 60, Coda: 80, Slite: 55 },
  { axis: "Hiring", Notion: 85, Coda: 40, Slite: 60 },
  { axis: "Funding", Notion: 95, Coda: 70, Slite: 50 },
];

const competitors = [
  { name: "Notion", color: "hsl(300,100%,50%)", key: "Notion" },
  { name: "Coda", color: "hsl(51,100%,50%)", key: "Coda" },
  { name: "Slite", color: "hsl(180,100%,50%)", key: "Slite" },
];

const ThreatRadar = () => {
  return (
    <div>
      <h3 className="font-pixel text-xs text-foreground mb-4">🎯 THREAT RADAR</h3>
      <div className="bg-card border border-muted p-4">
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(120,100%,50%)" strokeOpacity={0.15} />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "hsl(0,0%,55%)", fontSize: 11, fontFamily: "VT323" }}
            />
            {competitors.map((c) => (
              <Radar
                key={c.key}
                name={c.name}
                dataKey={c.key}
                stroke={c.color}
                fill={c.color}
                fillOpacity={0.08}
                strokeWidth={2}
                dot={{ r: 3, fill: c.color }}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-2">
          {competitors.map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="font-terminal text-xs text-muted-foreground">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThreatRadar;
