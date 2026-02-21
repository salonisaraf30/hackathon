const stats = [
  { icon: "👾", label: "COMPETITORS TRACKED", value: "12", color: "text-primary", glow: "glow-green", border: "border-primary" },
  { icon: "📡", label: "SIGNALS THIS WEEK", value: "47", color: "text-neon-cyan", glow: "glow-cyan", border: "border-neon-cyan" },
  { icon: "🔥", label: "THREAT ALERTS", value: "5", color: "text-neon-magenta", glow: "glow-magenta", border: "border-neon-magenta" },
  { icon: "📬", label: "NEXT DIGEST", value: "2d 14h", color: "text-neon-gold", glow: "", border: "border-neon-gold" },
];

const QuickStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`bg-card border ${stat.border} p-4 hover:${stat.glow} transition-shadow`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{stat.icon}</span>
            <span className="font-terminal text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className={`font-pixel text-lg ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
