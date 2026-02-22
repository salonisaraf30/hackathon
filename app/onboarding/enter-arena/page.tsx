"use client";

import { useRouter } from "next/navigation";

export default function EnterArenaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle, #00FF41 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="scanlines" aria-hidden />

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <h2
          className="text-[#00FF41] text-2xl sm:text-3xl mb-4 animate-pulse"
          style={{ fontFamily: "var(--font-press-start)", textShadow: "0 0 20px #00FF41" }}
        >
          PLAYER READY!
        </h2>
        <p
          className="text-white/70 text-center mb-8 max-w-sm"
          style={{ fontFamily: "var(--font-vt323)" }}
        >
          The arena is your dashboard. Track competitors, read digests, and act on insights.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="px-8 py-4 border-2 border-[#00FF41] bg-[#00FF41] text-black hover:shadow-[0_0_30px_rgba(0,255,65,0.5)] transition-all"
          style={{ fontFamily: "var(--font-press-start)" }}
        >
          ENTER THE ARENA →
        </button>
      </div>
    </div>
  );
}
