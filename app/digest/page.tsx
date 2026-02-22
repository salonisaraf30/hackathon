"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_DIGESTS } from "@/lib/mock-data";

const BRIEFS = [
  { id: "dig-1", label: "BRIEF #003", range: "Feb 14 – 20, 2025", status: "NEW" },
  { id: "dig-2", label: "BRIEF #002", range: "Feb 7 – 13, 2025", status: "READ" },
];

export default function DigestPage() {
  const [selectedId, setSelectedId] = useState(BRIEFS[0]?.id ?? null);

  return (
    <div className="flex gap-6">
      <div className="w-full lg:w-[30%] shrink-0 space-y-4">
        <div>
          <h1 className="text-[#FFD700] text-lg uppercase tracking-wider" style={{ fontFamily: "var(--font-space-mono)" }}>Intelligence Briefs</h1>
          <p className="text-white/50 text-sm mt-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>AI-generated weekly analysis. Personalized to your positioning.</p>
        </div>
        <div className="space-y-1">
          {BRIEFS.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedId === b.id ? "border-[#FFD700] bg-[#FFD700]/10" : "border-white/10 hover:bg-white/5"
              }`}
            >
              <p className="text-white text-xs" style={{ fontFamily: "var(--font-space-mono)" }}>{b.label}</p>
              <p className="text-white/50 text-xs mt-0.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>{b.range}</p>
              {b.status === "NEW" ? <span className="inline-block mt-2 px-2 py-0.5 rounded bg-[#FF00FF]/30 text-[#FF00FF] text-[10px] animate-pulse" style={{ fontFamily: "var(--font-space-mono)" }}>NEW</span> : <span className="inline-block mt-2 px-2 py-0.5 rounded bg-[#00FF41]/20 text-[#00FF41] text-[10px]" style={{ fontFamily: "var(--font-space-mono)" }}>READ</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {selectedId ? (
          <Link href={`/digest/${selectedId}`} className="block">
            <div className="bg-[#0a0a0a] border border-[#FFD700] rounded-lg p-6 hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] transition-shadow">
              <p className="text-[#00FF41] text-xs" style={{ fontFamily: "var(--font-space-mono)" }}>View full brief →</p>
              <p className="text-white font-medium mt-2" style={{ fontFamily: "var(--font-space-mono)" }}>{MOCK_DIGESTS.find((d) => d.id === selectedId)?.title}</p>
            </div>
          </Link>
        ) : null}
      </div>

      <div className="w-[200px] shrink-0">
        <Link href="/digest/new" className="block p-4 rounded-lg border-2 border-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/10 transition-colors text-center digest-pulse">
          <p className="text-[#FFD700] text-xs" style={{ fontFamily: "var(--font-space-mono)" }}>GENERATE NEW BRIEF →</p>
        </Link>
      </div>
    </div>
  );
}
