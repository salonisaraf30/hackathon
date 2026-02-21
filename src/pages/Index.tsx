import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TITLE = "Welcome to CompetitorPulse";
const PHRASES = [
  "Scanning competitors...",
  "Loading signals...",
  "Initializing intelligence...",
];

const Index = () => {
  const navigate = useNavigate();
  const [displayedChars, setDisplayedChars] = useState(0);
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [barProgress, setBarProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (displayedChars < TITLE.length) {
      const timeout = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
      }, 2500 / TITLE.length);
      return () => clearTimeout(timeout);
    } else {
      setTypewriterDone(true);
    }
  }, [displayedChars]);

  // Loading bar
  useEffect(() => {
    if (!typewriterDone) return;
    const start = Date.now();
    const duration = 1500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setBarProgress(progress);
      if (progress >= 1) {
        clearInterval(interval);
        setTimeout(() => setFadeOut(true), 300);
        setTimeout(() => navigate("/landing"), 800);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [typewriterDone, navigate]);

  // Cycling phrases
  useEffect(() => {
    if (!typewriterDone) return;
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }, 500);
    return () => clearInterval(interval);
  }, [typewriterDone]);

  return (
    <div
      className={`scanlines fixed inset-0 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      {/* Title */}
      <h1 className="font-pixel text-lg sm:text-2xl md:text-3xl text-primary text-glow-green mb-8 text-center px-4">
        {TITLE.slice(0, displayedChars)}
        {displayedChars < TITLE.length && (
          <span className="inline-block animate-pulse text-primary">█</span>
        )}
        {displayedChars >= TITLE.length && (
          <span className="cursor-blink" />
        )}
      </h1>

      {/* Loading bar */}
      {typewriterDone && (
        <div className="w-64 sm:w-80 h-4 border border-primary mb-6">
          <div
            className="h-full bg-primary transition-none"
            style={{ width: `${barProgress * 100}%` }}
          />
        </div>
      )}

      {/* Cycling phrases */}
      {typewriterDone && (
        <p className="font-pixel text-[10px] sm:text-xs text-primary text-glow-green">
          {PHRASES[phraseIndex]}
        </p>
      )}

      {/* Pac-Man dots at bottom */}
      <div className="fixed bottom-8 left-0 w-full overflow-hidden h-8">
        <div className="relative h-full flex items-center">
          {/* Dots */}
          <div className="absolute inset-0 flex items-center justify-around px-16">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary opacity-60"
              />
            ))}
          </div>
          {/* Pac-Man */}
          <div className="pacman-sprite absolute" />
        </div>
      </div>
    </div>
  );
};

export default Index;
