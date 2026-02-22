"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STAGES = [
  "Just an idea",
  "Building the MVP",
  "Live, pre-revenue",
  "Making money",
];

const AUDIENCES = [
  "Founders",
  "Developers",
  "Designers",
  "Enterprises",
  "Consumers",
  "Students",
];

const GOALS = [
  "Build brand awareness",
  "Generate leads",
  "Attract investors",
  "Understand the market",
];

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

type OnboardingCompetitor = {
  name: string;
  url: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startupName, setStartupName] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<number | null>(null);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<OnboardingCompetitor[]>([]);
  const [competitorNameInput, setCompetitorNameInput] = useState("");
  const [competitorUrlInput, setCompetitorUrlInput] = useState("");
  const [goal, setGoal] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth/login");
      }
    };

    void checkAuth();
  }, [router, supabase.auth]);

  const toggleAudience = useCallback((audience: string) => {
    setAudiences((prev) =>
      prev.includes(audience)
        ? prev.filter((item) => item !== audience)
        : [...prev, audience]
    );
  }, []);

  const addCompetitor = useCallback(() => {
    const name = competitorNameInput.trim();
    const rawUrl = competitorUrlInput.trim();

    if (!name || !rawUrl) {
      return;
    }

    const normalizedUrl =
      rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `https://${rawUrl}`;

    const existing = competitors.some(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return;
    }

    setCompetitors((prev) => [
      ...prev,
      {
        name,
        url: normalizedUrl,
      },
    ]);

    setCompetitorNameInput("");
    setCompetitorUrlInput("");
  }, [competitorNameInput, competitorUrlInput, competitors]);

  const canNext = () => {
    if (step === 0) return startupName.trim().length > 0;
    if (step === 1) return stage !== null;
    if (step === 2) return audiences.length > 0;
    if (step === 3) return competitors.length > 0;
    if (step === 4) return goal !== null;
    return true;
  };

  const submitOnboarding = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName,
          description,
          stage: stage !== null ? STAGES[stage] : null,
          audiences,
          competitors,
          goal: goal !== null ? GOALS[goal] : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save onboarding");
      }

      const ingestResponse = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!ingestResponse.ok) {
        const ingestData = await ingestResponse.json().catch(() => ({}));
        throw new Error(ingestData.error || "Ingestion failed after onboarding");
      }

      const digestResponse = await fetch("/api/digests/generate", {
        method: "POST",
      });

      if (!digestResponse.ok) {
        const digestData = await digestResponse.json().catch(() => ({}));
        throw new Error(
          digestData.error || "Digest generation failed after onboarding"
        );
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 6;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#050505" }}>
      {/* Progress bar */}
      <div className="w-full p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between mb-1">
            <span className="text-[13px] text-[#888888]" style={IBM}>PROGRESS</span>
            <span className="text-[13px] text-[#00FF41]" style={SM}>{step + 1}/{totalSteps}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#00FF41] transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {/* Step 1: Your startup */}
        {step === 0 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-lg">
            <h2 className="text-2xl text-[#00FF41]" style={SM}>STEP 1: YOUR STARTUP</h2>
            <div className="w-full">
              <label className="text-[14px] text-[#888888] block mb-2" style={IBM}>What&apos;s your startup called?</label>
              <input
                className="terminal-input w-full px-4 py-3 rounded text-[15px]"
                style={IBM}
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="w-full">
              <label className="text-[14px] text-[#888888] block mb-2" style={IBM}>Describe it in one line:</label>
              <input
                className="terminal-input w-full px-4 py-3 rounded text-[15px]"
                style={IBM}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                maxLength={100}
              />
              <span className="text-[13px] text-[#888888] mt-1 block text-right" style={IBM}>{description.length}/100</span>
            </div>
          </div>
        )}

        {/* Step 2: Stage */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="text-2xl text-[#00FF41]" style={SM}>STEP 2: YOUR STAGE</h2>
            <p className="text-[15px] text-[#888888]" style={IBM}>Where are you in the game?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {STAGES.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStage(index)}
                  className="p-6 rounded-lg text-left text-[15px] transition-all cursor-pointer"
                  style={{
                    border: stage === index ? "2px solid #00FF41" : "2px solid rgba(255,255,255,0.1)",
                    color: stage === index ? "#00FF41" : "#888888",
                    backgroundColor: stage === index ? "rgba(0,255,65,0.05)" : "transparent",
                    ...SM,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Audience */}
        {step === 2 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="text-2xl text-[#00FF41]" style={SM}>STEP 3: YOUR AUDIENCE</h2>
            <p className="text-[15px] text-[#888888]" style={IBM}>Who are you building for?</p>
            <div className="flex flex-wrap justify-center gap-3">
              {AUDIENCES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAudience(item)}
                  className="px-5 py-2.5 rounded text-[15px] transition-all cursor-pointer"
                  style={{
                    border: audiences.includes(item) ? "2px solid #FF00FF" : "2px solid rgba(255,255,255,0.1)",
                    color: audiences.includes(item) ? "#FF00FF" : "#888888",
                    backgroundColor: audiences.includes(item) ? "rgba(255,0,255,0.05)" : "transparent",
                    ...SM,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Competitors */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="text-2xl text-[#00FF41]" style={SM}>STEP 4: ADD COMPETITORS</h2>
            <p className="text-[15px] text-[#888888]" style={IBM}>Add competitor names + URLs so ingestion APIs can scrape them.</p>
            <div className="w-full max-w-xl space-y-3">
              <div>
                <label className="text-[14px] text-[#888888] block mb-2" style={IBM}>Competitor Name</label>
                <input
                  className="terminal-input w-full px-4 py-3 rounded text-[15px]"
                  style={IBM}
                  value={competitorNameInput}
                  onChange={(e) => setCompetitorNameInput(e.target.value)}
                  placeholder="e.g. Notion"
                />
              </div>
              <div>
                <label className="text-[14px] text-[#888888] block mb-2" style={IBM}>Competitor URL</label>
                <input
                  className="terminal-input w-full px-4 py-3 rounded text-[15px]"
                  style={IBM}
                  value={competitorUrlInput}
                  onChange={(e) => setCompetitorUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }}
                  placeholder="https://competitor.com"
                />
              </div>
              <button
                type="button"
                onClick={addCompetitor}
                className="px-5 py-2.5 rounded text-[14px] transition-colors"
                style={{ border: "1px solid #FF00FF", color: "#FF00FF", ...SM }}
              >
                + ADD COMPETITOR
              </button>
              <div className="space-y-2 pt-2">
                {competitors.map((item) => (
                  <div
                    key={`${item.name}:${item.url}`}
                    className="px-3 py-2 rounded-lg flex items-center justify-between"
                    style={{ border: "1px solid #00FF41", backgroundColor: "rgba(0,255,65,0.05)" }}
                  >
                    <div>
                      <p className="text-[14px] text-[#00FF41]" style={SM}>{item.name}</p>
                      <p className="text-[13px] text-[#888888]" style={IBM}>{item.url}</p>
                    </div>
                    <button
                      type="button"
                      className="text-[13px] text-red-400 hover:text-red-300"
                      style={SM}
                      onClick={() => setCompetitors((prev) => prev.filter((v) => v.name !== item.name))}
                    >
                      REMOVE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Goal */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="text-2xl text-[#00FF41]" style={SM}>STEP 5: YOUR MISSION</h2>
            <p className="text-[15px] text-[#888888]" style={IBM}>What&apos;s your main goal right now?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {GOALS.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGoal(index)}
                  className="p-6 rounded-lg text-left text-[15px] transition-all cursor-pointer"
                  style={{
                    border: goal === index ? "2px solid #00FF41" : "2px solid rgba(255,255,255,0.1)",
                    color: goal === index ? "#00FF41" : "#888888",
                    backgroundColor: goal === index ? "rgba(0,255,65,0.05)" : "transparent",
                    ...SM,
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Final */}
        {step === 5 && (
          <div className="flex flex-col items-center gap-8">
            <h2 className="text-3xl text-[#00FF41] animate-pulse" style={SM}>READY TO LAUNCH</h2>
            <p className="text-[15px] text-[#888888]" style={IBM}>Your competitive intelligence engine is about to start.</p>
            <button
              type="button"
              onClick={() => void submitOnboarding()}
              disabled={loading}
              className="px-8 py-4 rounded text-[18px] transition-all disabled:opacity-50"
              style={{ border: "2px solid #00FF41", color: "#00FF41", ...SM }}
            >
              {loading ? "INITIALIZING..." : "ENTER THE ARENA →"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="pb-2 text-center">
          <p className="text-[14px] text-red-400" style={IBM}>{error}</p>
        </div>
      )}

      {step < 5 && (
        <div className="p-6 flex justify-center gap-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((v) => v - 1)}
              className="px-6 py-3 rounded text-[15px] transition-all cursor-pointer"
              style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#888888", ...SM }}
            >
              ← BACK
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep((v) => v + 1)}
            disabled={!canNext()}
            className="px-6 py-3 rounded text-[15px] transition-all cursor-pointer disabled:opacity-30"
            style={{
              border: canNext() ? "2px solid #00FF41" : "2px solid rgba(255,255,255,0.1)",
              color: canNext() ? "#00FF41" : "#888888",
              ...SM,
            }}
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}
