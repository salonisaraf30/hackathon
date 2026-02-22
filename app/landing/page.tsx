import Link from "next/link";
import { Satellite, Brain, Mail } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle, #00FF41 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="scanlines" aria-hidden />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* HERO */}
        <section className="text-center py-20 md:py-28">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-white mb-6"
            style={{ fontFamily: "var(--font-press-start)" }}
          >
            Know Every Move Your Competitors Make
          </h1>
          <p
            className="text-xl sm:text-2xl text-white/80 mb-10 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-vt323)" }}
          >
            AI-powered competitive intelligence. Delivered weekly. Zero effort.
          </p>
          <Link
            href="/auth"
            className="inline-block px-8 py-4 border-2 border-[#FF00FF] bg-black text-white hover:border-[#00FF41] hover:shadow-[0_0_20px_rgba(0,255,65,0.5)] transition-all duration-300 text-sm"
            style={{ fontFamily: "var(--font-press-start)" }}
          >
            GET STARTED →
          </Link>
        </section>

        {/* ABOUT - 3 cards */}
        <section className="py-16 grid md:grid-cols-3 gap-8">
          <div className="p-6 border border-[#00FF41] bg-black/90 hover:shadow-[0_0_24px_rgba(0,255,65,0.2)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded border border-[#00FF41] flex items-center justify-center mb-4">
              <Satellite className="w-6 h-6 text-[#00FF41]" />
            </div>
            <h3
              className="text-white text-sm mb-2"
              style={{ fontFamily: "var(--font-press-start)" }}
            >
              Track Signals
            </h3>
            <p
              className="text-white/70 text-base leading-relaxed"
              style={{ fontFamily: "var(--font-vt323)" }}
            >
              Monitor competitor websites, socials, and product launches in one place.
            </p>
          </div>
          <div className="p-6 border border-[#FF00FF] bg-black/90 hover:shadow-[0_0_24px_rgba(255,0,255,0.2)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded border border-[#FF00FF] flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-[#FF00FF]" />
            </div>
            <h3
              className="text-white text-sm mb-2"
              style={{ fontFamily: "var(--font-press-start)" }}
            >
              AI Analysis
            </h3>
            <p
              className="text-white/70 text-base leading-relaxed"
              style={{ fontFamily: "var(--font-vt323)" }}
            >
              Insights personalized to your product positioning—not generic alerts.
            </p>
          </div>
          <div className="p-6 border border-[#00FFFF] bg-black/90 hover:shadow-[0_0_24px_rgba(0,255,255,0.2)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded border border-[#00FFFF] flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-[#00FFFF]" />
            </div>
            <h3
              className="text-white text-sm mb-2"
              style={{ fontFamily: "var(--font-press-start)" }}
            >
              Weekly Digest
            </h3>
            <p
              className="text-white/70 text-base leading-relaxed"
              style={{ fontFamily: "var(--font-vt323)" }}
            >
              Delivered to your inbox every Monday. Read it in 2 minutes.
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-24 pt-8 border-t border-[#00FF41] flex flex-col sm:flex-row items-center justify-between gap-4 text-white/50 text-xs">
          <span style={{ fontFamily: "var(--font-press-start)" }}>
            CompetitorPulse © 2025
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#00FF41]/60"
                style={{ boxShadow: "0 0 4px #00FF41" }}
              />
            ))}
          </div>
          <span style={{ fontFamily: "var(--font-press-start)" }}>
            Built at NYU Buildathon
          </span>
        </footer>
      </main>
    </div>
  );
}
