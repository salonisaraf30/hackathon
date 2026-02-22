"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import CyberneticGridShader from "@/components/ui/cybernetic-grid-shader";

export default function CompetitorsCheckPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <CyberneticGridShader />
      <div className="scanlines" aria-hidden />

      <div
        className="relative z-10 w-full max-w-lg rounded-lg border border-[#00FF41] p-8 shadow-[0_0_30px_rgba(0,255,65,0.15)]"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p
          className="text-[#00FF41] text-xs mb-2"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          CompetitorPulse
        </p>
        <p
          className="text-white/50 text-xs mb-8"
          style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
        >
          STEP 2 OF 3
        </p>

        <h2
          className="text-white text-lg mb-2"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          Do you know who your competitors are?
        </h2>
        <p
          className="text-white/50 text-sm mb-8"
          style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
        >
          You can always add them later from your dashboard.
        </p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push("/onboarding/add-competitors")}
            className="w-full p-5 text-left border border-[#00FF41] bg-black hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all cursor-pointer"
          >
            <p
              className="text-white font-medium"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              Yes, I know my competitors
            </p>
            <p
              className="text-white/50 text-sm mt-1"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              Add them now and start tracking immediately
            </p>
          </button>

          <button
            type="button"
            onClick={() => router.push("/onboarding/enter-arena")}
            className="w-full p-5 text-left border border-white/40 bg-black hover:border-[#00FFFF] hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all cursor-pointer"
          >
            <p
              className="text-white font-medium"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              Not yet, I will add them later
            </p>
            <p
              className="text-white/50 text-sm mt-1"
              style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
            >
              Go straight to your dashboard and add competitors anytime
            </p>
          </button>
        </div>

        <Link
          href="/onboarding"
          className="inline-block mt-8 text-white/50 text-sm hover:text-white"
          style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
        >
          Back
        </Link>
      </div>
    </div>
  );
}
