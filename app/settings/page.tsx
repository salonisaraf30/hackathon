"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [name, setName] = useState("TaskFlow");
  const [description, setDescription] = useState("Smart task management for remote teams");
  const [positioning, setPositioning] = useState("We are Notion for async-first teams.");
  const [targetMarket, setTargetMarket] = useState("Remote-first startups, 10–100 people");
  const [keyFeatures, setKeyFeatures] = useState("Async standups, Integrations, Meeting-free updates");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Persist to Supabase user_products or profile when table exists
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl text-white" style={{ fontFamily: "var(--font-space-mono)" }}>Settings</h1>
        <p className="text-white/50 text-sm mt-1" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Product positioning and preferences</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 border border-[#00FF41]/40 rounded bg-black/50 space-y-5">
          <h2 className="text-xs text-[#00FF41] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-mono)" }}>Your product</h2>
          <div>
            <label className="block text-white/80 text-sm mb-1.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Product name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>One-line description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Positioning statement</label>
            <input type="text" value={positioning} onChange={(e) => setPositioning(e.target.value)} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Target market</label>
            <input type="text" value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1.5" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>Key features (comma-separated)</label>
            <input type="text" value={keyFeatures} onChange={(e) => setKeyFeatures(e.target.value)} className="w-full px-4 py-3 bg-black border border-[#00FF41] text-white focus:outline-none focus:ring-1 focus:ring-[#00FF41]" style={{ fontFamily: "var(--font-ibm-plex-mono)" }} />
          </div>
        </div>
        <button type="submit" className="px-6 py-2.5 border border-[#00FF41] bg-[#00FF41] text-black hover:brightness-110 transition-colors text-sm" style={{ fontFamily: "var(--font-space-mono)" }}>
          {saved ? "Saved" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
