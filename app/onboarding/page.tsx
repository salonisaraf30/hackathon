"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STAGES = [
  "Just an idea",
  "Building the MVP",
  "Live, pre-revenue",
  "Making money",
];

const PLAYERS = [
  "Founders",
  "Developers",
  "Designers",
  "Enterprises",
  "Consumers",
  "Students",
];

const STEPS = 5;
const STEP_TITLES = [
  "LEVEL 1: YOUR STARTUP",
  "LEVEL 2: YOUR STAGE",
  "LEVEL 3: YOUR MISSION",
  "LEVEL 4: YOUR PLAYERS",
  "LEVEL 5: KEY FEATURES",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [startupName, setStartupName] = useState("");
  const [startupDesc, setStartupDesc] = useState("");
  const [stage, setStage] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [playersOther, setPlayersOther] = useState("");
  const [mission, setMission] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");

  const xpProgress = (step / STEPS) * 100;

  const togglePlayer = (p: string) => {
    setPlayers((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleNext = () => {
    if (step < STEPS) setStep(step + 1);
    else {
      // After level 5, go to competitors flow; "Enter the arena" comes after that
      router.push("/onboarding/competitors-check");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

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

      {step <= STEPS ? (
        <>
          {/* XP bar */}
          <div className="relative z-10 pt-8 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="h-3 border border-[#00FF41] rounded-sm overflow-hidden bg-black">
                <div
                  className="h-full bg-[#00FF41] transition-all duration-500"
                  style={{
                    width: `${xpProgress}%`,
                    boxShadow: "0 0 10px #00FF41",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
            <h2
              className="text-[#00FF41] text-sm mb-10"
              style={{ fontFamily: "var(--font-press-start)" }}
            >
              {STEP_TITLES[step - 1]}
            </h2>

            {step === 1 && (
              <div className="w-full max-w-md space-y-6 text-center">
                <input
                  type="text"
                  placeholder="What's your startup called?"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  className="w-full px-4 py-4 bg-black border border-[#00FF41] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00FF41] text-lg"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                />
                <input
                  type="text"
                  placeholder="Describe it in one line:"
                  maxLength={100}
                  value={startupDesc}
                  onChange={(e) => setStartupDesc(e.target.value)}
                  className="w-full px-4 py-4 bg-black border border-[#00FF41] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00FF41] text-lg"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                />
              </div>
            )}

            {step === 2 && (
              <div className="w-full max-w-2xl">
                <p
                  className="text-white/80 text-center mb-8"
                  style={{ fontFamily: "var(--font-vt323)" }}
                >
                  Where are you in the game?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStage(s)}
                      className={`p-6 border-2 text-left transition-all ${
                        stage === s
                          ? "border-[#00FF41] shadow-[0_0_20px_rgba(0,255,65,0.3)]"
                          : "border-white/30 hover:border-white/50"
                      }`}
                      style={{ fontFamily: "var(--font-press-start)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="w-full max-w-xl space-y-6">
                <p
                  className="text-white/80 text-center"
                  style={{ fontFamily: "var(--font-vt323)" }}
                >
                  What&apos;s your main goal right now?
                </p>
                <textarea
                  placeholder="Your mission..."
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-4 bg-black border border-[#00FF41] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00FF41] resize-none"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                />
              </div>
            )}

            {step === 4 && (
              <div className="w-full max-w-2xl space-y-6">
                <p
                  className="text-white/80 text-center mb-6"
                  style={{ fontFamily: "var(--font-vt323)" }}
                >
                  Who are you building for?
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {PLAYERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlayer(p)}
                      className={`px-4 py-2 border-2 rounded-full text-sm transition-all ${
                        players.includes(p)
                          ? "border-[#FF00FF] shadow-[0_0_16px_rgba(255,0,255,0.3)]"
                          : "border-white/30 hover:border-white/50"
                      }`}
                      style={{ fontFamily: "var(--font-press-start)" }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <label className="block text-white/70 text-sm mb-2" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                    Other: <span className="text-white/50">(in case your audience isn&apos;t listed above)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Educators, Creators..."
                    value={playersOther}
                    onChange={(e) => setPlayersOther(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00FF41]"
                    style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="w-full max-w-xl space-y-6">
                <p
                  className="text-white/80 text-center"
                  style={{ fontFamily: "var(--font-vt323)" }}
                >
                  What are your key features?
                </p>
                <textarea
                  placeholder="Key features (e.g. Async standups, Integrations...)"
                  value={keyFeatures}
                  onChange={(e) => setKeyFeatures(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-4 bg-black border border-[#00FF41] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#00FF41] resize-none"
                  style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
                />
              </div>
            )}

            <div className="flex gap-6 mt-16">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41]/10"
                  style={{ fontFamily: "var(--font-press-start)" }}
                >
                  ← BACK
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 border border-[#00FF41] bg-[#00FF41] text-black hover:brightness-110"
                style={{ fontFamily: "var(--font-press-start)" }}
              >
                NEXT →
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
