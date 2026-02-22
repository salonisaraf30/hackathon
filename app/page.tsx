import Link from "next/link";
 
const features = [
  {
    icon: "👾",
    title: "Track Signals",
    desc: "Monitor competitor websites, socials, and launches in real-time.",
    borderClass: "border-primary glow-green",
  },
  {
    icon: "🧠",
    title: "AI Analysis",
    desc: "Insights personalized to your product positioning and market.",
    borderClass: "border-secondary glow-magenta",
  },
  {
    icon: "📡",
    title: "Weekly Digest",
    desc: "Delivered to your inbox every Monday. Never miss a move.",
    borderClass: "border-accent glow-cyan",
  },
];

export default function Home() {
  return (
    <main className="scanlines min-h-screen bg-background">
      <section className="neon-grid-bg min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-pixel text-xl sm:text-3xl md:text-4xl text-foreground text-glow-green leading-relaxed mb-6 max-w-4xl">
          Know Every Move Your Competitors Make
        </h1>
        <p className="font-terminal text-xl sm:text-2xl md:text-3xl text-muted-foreground mb-10 max-w-2xl">
          AI-powered competitive intelligence. Delivered weekly. Zero effort.
        </p>
        <Link
          href="/auth/sign-up"
          className="font-pixel text-sm sm:text-base border-2 border-secondary bg-background text-secondary px-8 py-4 hover:glow-green hover:text-primary hover:border-primary transition-all duration-200"
        >
          GET STARTED →
        </Link>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`border-2 ${feature.borderClass} bg-background p-8 transition-all duration-300 hover:-translate-y-2`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-pixel text-xs sm:text-sm text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="font-terminal text-lg text-muted-foreground">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-primary py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-pixel text-[8px] sm:text-[10px] text-muted-foreground">
            CompetitorPulse © 2025
          </span>
          <div className="flex items-center gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-primary opacity-40"
              />
            ))}
          </div>
          <span className="font-pixel text-[8px] sm:text-[10px] text-muted-foreground">
            Built at NYU Buildathon 🎮
          </span>
        </div>
      </footer>
    </main>
  );
}
