import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const STAGES = ["💡 Just an idea", "🛠️ Building the MVP", "🚀 Live, pre-revenue", "💰 Making money"];
const AUDIENCES = ["Founders", "Developers", "Designers", "Enterprises", "Consumers", "Students"];
const GOALS = ["📣 Build brand awareness", "🧲 Generate leads", "💼 Attract investors", "🔍 Understand the market"];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0-3 = steps, 4 = final
  const [startupName, setStartupName] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<number | null>(null);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [goal, setGoal] = useState<number | null>(null);

  const xpPercent = ((step + 1) / 5) * 100;

  const toggleAudience = useCallback((a: string) => {
    setAudiences((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }, []);

  const addCompetitor = useCallback(() => {
    const val = competitorInput.trim();
    if (val && !competitors.includes(val)) {
      setCompetitors((prev) => [...prev, val]);
      setCompetitorInput("");
    }
  }, [competitorInput, competitors]);

  const canNext = () => {
    if (step === 0) return startupName.trim().length > 0;
    if (step === 1) return stage !== null;
    if (step === 2) return audiences.length > 0;
    if (step === 3) return goal !== null;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center gap-8 w-full max-w-lg">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 1: YOUR STARTUP
            </h2>
            <div className="w-full">
              <label className="font-pixel text-[10px] text-muted-foreground block mb-3">
                What's your startup called?
              </label>
              <input
                className="terminal-input w-full font-pixel text-xs sm:text-sm py-2 px-1"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                maxLength={100}
              />
              <span className="font-terminal text-sm text-muted-foreground mt-1 block text-right">
                {description.length}/100
              </span>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 2: YOUR STAGE
            </h2>
            <p className="font-pixel text-[10px] text-muted-foreground">
              Where are you in the game?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {STAGES.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setStage(i)}
                  className={`font-pixel text-[10px] sm:text-xs border-2 p-6 text-left transition-all duration-200 cursor-pointer ${
                    stage === i
                      ? "border-primary text-primary glow-green"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 3: YOUR PLAYERS
            </h2>
            <p className="font-pixel text-[10px] text-muted-foreground">
              Who are you building for?
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAudience(a)}
                  className={`font-pixel text-[10px] border-2 px-4 py-2 transition-all duration-200 cursor-pointer ${
                    audiences.includes(a)
                      ? "border-secondary text-secondary glow-magenta"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="w-full max-w-lg">
              <label className="font-pixel text-[10px] text-muted-foreground block mb-3">
                Who do you already know is competing with you?
              </label>
              <div className="flex gap-2">
                <input
                  className="terminal-input flex-1 font-pixel text-[10px] py-2 px-1"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                  placeholder="Type & press Enter"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {competitors.map((c) => (
                  <span
                    key={c}
                    className="font-pixel text-[8px] border border-primary text-primary px-3 py-1 glow-green cursor-pointer"
                    onClick={() =>
                      setCompetitors((prev) => prev.filter((x) => x !== c))
                    }
                  >
                    {c} ✕
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
            <h2 className="font-pixel text-sm sm:text-base text-primary text-glow-green">
              LEVEL 4: YOUR MISSION
            </h2>
            <p className="font-pixel text-[10px] text-muted-foreground">
              What's your main goal right now?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {GOALS.map((g, i) => (
                <button
                  key={g}
                  onClick={() => setGoal(i)}
                  className={`font-pixel text-[10px] sm:text-xs border-2 p-6 text-left transition-all duration-200 cursor-pointer ${
                    goal === i
                      ? "border-primary text-primary glow-green"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center gap-8">
            <h2 className="font-pixel text-xl sm:text-3xl text-primary text-glow-green animate-flash">
              PLAYER READY!
            </h2>
            <button
              onClick={() => navigate("/dashboard")}
              className="font-pixel text-sm border-2 border-primary text-primary px-8 py-4 glow-green hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer"
            >
              ENTER THE ARENA →
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="scanlines min-h-screen bg-background flex flex-col">
      {/* XP Bar */}
      <div className="w-full p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between mb-1">
            <span className="font-pixel text-[8px] text-muted-foreground">XP</span>
            <span className="font-pixel text-[8px] text-primary">
              {step + 1}/5
            </span>
          </div>
          <div className="w-full h-3 border border-primary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="p-6 flex justify-center gap-6">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="font-pixel text-[10px] sm:text-xs border border-muted-foreground/30 text-muted-foreground px-6 py-3 hover:border-foreground hover:text-foreground transition-all cursor-pointer"
            >
              ← BACK
            </button>
          )}
          <button
            onClick={() => setStep((s) => s + 1)}
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
};

export default Onboarding;
