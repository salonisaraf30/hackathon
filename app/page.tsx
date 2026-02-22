"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PHRASES = [
  "Scanning competitors...",
  "Loading signals...",
  "Initializing intelligence...",
];

const FULL_TEXT = "Welcome to CompetitorPulse";
const TYPEWRITER_DURATION_MS = 2500;
const LOADING_BAR_DURATION_MS = 1500;
const PHRASE_INTERVAL_MS = 800;
const TOTAL_BEFORE_REDIRECT = TYPEWRITER_DURATION_MS + LOADING_BAR_DURATION_MS + 800;

export default function LoadingPage() {
  const router = useRouter();
  const [visibleLength, setVisibleLength] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const [barProgress, setBarProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const charCount = FULL_TEXT.length;
    const interval = TYPEWRITER_DURATION_MS / charCount;
    const t = setInterval(() => {
      setVisibleLength((n) => {
        if (n >= charCount) {
          clearInterval(t);
          setShowBar(true);
          return n;
        }
        return n + 1;
      });
    }, interval);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!showBar) return;
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / LOADING_BAR_DURATION_MS);
      setBarProgress(p);
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [showBar]);

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
    }, PHRASE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setFadeOut(true);
    }, TOTAL_BEFORE_REDIRECT);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!fadeOut) return;
    const t = setTimeout(() => {
      router.replace("/landing");
    }, 600);
    return () => clearTimeout(t);
  }, [fadeOut, router]);

  return (
    <div
      className={`fixed inset-0 bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="scanlines" aria-hidden />

      <div className="relative z-10 flex flex-col items-center max-w-2xl px-6">
        <h1
          className="font-[family-name:var(--font-press-start)] text-[#00FF41] text-center text-xl sm:text-2xl md:text-3xl mb-6"
          style={{ fontFamily: "var(--font-press-start)" }}
        >
          {FULL_TEXT.slice(0, visibleLength)}
          <span
            className="inline-block w-2 h-6 sm:h-8 ml-0.5 align-middle bg-[#00FF41] animate-pulse"
            style={{ animationDuration: "0.6s" }}
          />
        </h1>

        {showBar && (
          <div className="w-full max-w-md h-3 border border-[#00FF41] rounded-sm overflow-hidden bg-black mb-6">
            <div
              className="h-full bg-[#00FF41] transition-all duration-75"
              style={{
                width: `${barProgress * 100}%`,
                boxShadow: "0 0 10px #00FF41",
              }}
            />
          </div>
        )}

        {showBar && (
          <p
            className="text-[#00FF41]/90 text-sm sm:text-base"
            style={{ fontFamily: "var(--font-press-start)" }}
          >
            {PHRASES[phraseIndex]}
          </p>
        )}
      </div>

      {/* Pac-Man dots row at bottom */}
      <div
        className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-1 px-4 overflow-hidden"
        style={{ fontFamily: "var(--font-press-start)" }}
      >
        <div className="flex items-center gap-1 animate-pacman-track">
          <span
            className="inline-block w-2 h-2 rounded-full bg-[#00FF41] opacity-90"
            style={{ boxShadow: "0 0 6px #00FF41" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full bg-[#00FF41] opacity-90"
            style={{ boxShadow: "0 0 6px #00FF41" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full bg-[#00FF41] opacity-90"
            style={{ boxShadow: "0 0 6px #00FF41" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full bg-[#00FF41] opacity-90"
            style={{ boxShadow: "0 0 6px #00FF41" }}
          />
          <span
            className="inline-block w-2 h-2 rounded-full bg-[#00FF41] opacity-90"
            style={{ boxShadow: "0 0 6px #00FF41" }}
          />
          <span
            className="pacman-mouth inline-block w-4 h-4 rounded-full border-2 border-[#00FF41] border-r-transparent bg-transparent"
            style={{ boxShadow: "0 0 8px #00FF41" }}
          />
        </div>
      </div>
    </div>
  );
}
