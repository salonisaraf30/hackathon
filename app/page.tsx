import Link from "next/link";

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

const features = [
  {
    title: "TRACK SIGNALS",
    desc: "Monitor competitor websites, socials, and launches in real-time.",
    color: "#00FF41",
  },
  {
    title: "AI ANALYSIS",
    desc: "Insights personalized to your product positioning and market.",
    color: "#FF00FF",
  },
  {
    title: "WEEKLY DIGEST",
    desc: "Delivered to your inbox every Monday. Never miss a move.",
    color: "#00FFFF",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#050505" }}>
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-[12px] text-[#00FFFF] tracking-[0.3em] mb-6" style={IBM}>
          COMPETITIVE INTELLIGENCE PLATFORM
        </p>
        <h1
          className="text-2xl sm:text-4xl md:text-5xl text-white leading-tight mb-6 max-w-4xl"
          style={SM}
        >
          Know Every Move Your{" "}
          <span className="text-[#00FF41]">Competitors</span> Make
        </h1>
        <p className="text-[15px] text-[#888888] mb-10 max-w-2xl leading-relaxed" style={IBM}>
          AI-powered competitive intelligence. Delivered weekly. Zero effort.
        </p>
        <Link
          href="/auth/sign-up"
          className="text-[14px] px-8 py-4 rounded transition-all hover:shadow-[0_0_20px_rgba(255,0,255,0.3)]"
          style={{
            border: "2px solid #FF00FF",
            color: "#FF00FF",
            ...SM,
          }}
        >
          GET STARTED →
        </Link>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl p-8 transition-all duration-300 hover:-translate-y-2"
              style={{
                border: `1px solid ${feature.color}`,
                backgroundColor: `${feature.color}05`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full mb-4"
                style={{ backgroundColor: feature.color }}
              />
              <h3
                className="text-[13px] text-white mb-3"
                style={SM}
              >
                {feature.title}
              </h3>
              <p className="text-[13px] text-[#888888] leading-relaxed" style={IBM}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-[#888888]" style={IBM}>
            CompetitorPulse © 2025
          </span>
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: ["#00FF41", "#FF00FF", "#00FFFF"][i] }}
              />
            ))}
          </div>
          <span className="text-[11px] text-[#888888]" style={IBM}>
            Built at NYU Buildathon
          </span>
        </div>
      </footer>
    </main>
  );
}
