"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STAGES = [
  "💡 Just an idea",
  "🛠️ Building the MVP",
  "🚀 Live, pre-revenue",
  "💰 Making money",
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
  "📣 Build brand awareness",
  "🧲 Generate leads",
  "💼 Attract investors",
  "🔍 Understand the market",
];

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
  const xpPercent = ((step + 1) / totalSteps) * 100;

  return (
    <div className="scanlines min-h-screen bg-background flex flex-col">
      <div className="w-full p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between mb-1">
            <span className="font-pixel text-[8px] text-muted-foreground">XP</span>
            <span className="font-pixel text-[8px] text-primary">{step + 1}/{totalSteps}</span>
          </div>
          <div className="w-full h-3 border border-primary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {step === 0 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-lg">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 1: YOUR STARTUP
            </h2>
            <div className="w-full">
              <label className="font-pixel text-[10px] text-muted-foreground block mb-3">
                What&apos;s your startup called?
              </label>
              <input
                className="terminal-input w-full font-pixel text-xs sm:text-sm py-2 px-1"
                value={startupName}
                onChange={(event) => setStartupName(event.target.value)}
                autoFocus
              />
            </div>
            <div className="w-full">
              <label className="font-pixel text-[10px] text-muted-foreground block mb-3">
                Describe it in one line:
              </label>
              <input
                className="terminal-input w-full font-pixel text-[10px] sm:text-xs py-2 px-1"
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 100))}
                maxLength={100}
              />
              <span className="font-terminal text-sm text-muted-foreground mt-1 block text-right">
                {description.length}/100
              </span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 2: YOUR STAGE
            </h2>
            <p className="font-pixel text-[10px] text-muted-foreground">
              Where are you in the game?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {STAGES.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStage(index)}
                  className={`font-pixel text-[10px] sm:text-xs border-2 p-6 text-left transition-all duration-200 cursor-pointer ${
                    stage === index
                      ? "border-primary text-primary glow-green"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 3: YOUR PLAYERS
            </h2>
            <p className="font-pixel text-[10px] text-muted-foreground">
              Who are you building for?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {AUDIENCES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleAudience(item)}
                  className={`font-pixel text-[10px] border-2 px-4 py-2 transition-all duration-200 cursor-pointer ${
                    audiences.includes(item)
                      ? "border-secondary text-secondary glow-magenta"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 4: ADD COMPETITORS
            </h2>
            <p className="font-pixel text-[10px] text-muted-foreground">
              Add competitor names + URLs so ingestion APIs can scrape them.
            </p>

            <div className="w-full max-w-xl space-y-3">
              <div>
                <label className="font-pixel text-[10px] text-muted-foreground block mb-2">
                  Competitor Name
                </label>
                <input
                  className="terminal-input w-full font-pixel text-[10px] py-2 px-1"
                  value={competitorNameInput}
                  onChange={(event) => setCompetitorNameInput(event.target.value)}
                  placeholder="e.g. Notion"
                />
              </div>

              <div>
                <label className="font-pixel text-[10px] text-muted-foreground block mb-2">
                  Competitor URL
                </label>
                <input
                  className="terminal-input w-full font-pixel text-[10px] py-2 px-1"
                  value={competitorUrlInput}
                  onChange={(event) => setCompetitorUrlInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCompetitor();
                    }
                  }}
                  placeholder="https://competitor.com"
                />
              </div>

              <button
                type="button"
                onClick={addCompetitor}
                className="font-pixel text-[9px] border border-secondary text-secondary px-4 py-2 glow-magenta"
              >
                + ADD COMPETITOR
              </button>

              <div className="space-y-2 pt-2">
                {competitors.map((item) => (
                  <div
                    key={`${item.name}:${item.url}`}
                    className="border border-primary px-3 py-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-pixel text-[9px] text-primary">{item.name}</p>
                      <p className="font-terminal text-xs text-muted-foreground">{item.url}</p>
                    </div>
                    <button
                      type="button"
                      className="font-pixel text-[8px] text-primary"
                      onClick={() =>
                        setCompetitors((prev) =>
                          prev.filter((value) => value.name !== item.name)
                        )
                      }
                    >
                      REMOVE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 5: YOUR MISSION
            </h2>
            <p className="font-pixel text-[10px] text-muted-foreground">
              What&apos;s your main goal right now?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {GOALS.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGoal(index)}
                  className={`font-pixel text-[10px] sm:text-xs border-2 p-6 text-left transition-all duration-200 cursor-pointer ${
                    goal === index
                      ? "border-primary text-primary glow-green"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col items-center gap-8">
            <h2 className="font-pixel text-xl sm:text-3xl text-primary text-glow-green animate-flash">
              PLAYER READY!
            </h2>
            <button
              type="button"
              onClick={() => void submitOnboarding()}
              disabled={loading}
              className="font-pixel text-sm border-2 border-primary text-primary px-8 py-4 glow-green hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? "SAVING..." : "ENTER THE ARENA →"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="pb-2 text-center">
          <p className="font-pixel text-[10px] text-red-500">{error}</p>
        </div>
      )}

      {step < 5 && (
        <div className="p-6 flex justify-center gap-6">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((value) => value - 1)}
              className="font-pixel text-[10px] sm:text-xs border border-muted-foreground/30 text-muted-foreground px-6 py-3 hover:border-foreground hover:text-foreground transition-all cursor-pointer"
            >
              ← BACK
            </button>
          )}
          <button
            type="button"
            onClick={() => setStep((value) => value + 1)}
            disabled={!canNext()}
            className={`font-pixel text-[10px] sm:text-xs border-2 px-6 py-3 transition-all cursor-pointer ${
              canNext()
                ? "border-primary text-primary glow-green hover:bg-primary hover:text-primary-foreground"
                : "border-muted-foreground/20 text-muted-foreground/40 cursor-not-allowed"
            }`}
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}
