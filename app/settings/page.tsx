"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const SM = { fontFamily: "var(--font-space-mono)" };
const IBM = { fontFamily: "var(--font-ibm-plex-mono)" };

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "My Startup",
    email: "founder@startup.com",
    description: "AI-powered competitive intelligence platform",
  });

  const [notifications, setNotifications] = useState({
    digestEmail: true,
    signalAlerts: true,
    competitorUpdates: false,
    weeklyReport: true,
  });

  const [preferences, setPreferences] = useState({
    autoIngest: true,
    darkMode: true,
    compactView: false,
  });

  return (
    <div className="p-8 space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-lg text-[#00FFFF]" style={SM}>
          SETTINGS
        </h1>
        <p className="text-[12px] text-[#888888] mt-1" style={IBM}>
          Configure your CompetitorPulse workspace
        </p>
      </div>

      {/* Profile Section */}
      <section
        className="rounded-xl p-6 space-y-4"
        style={{
          border: "1px solid #00FF41",
          backgroundColor: "rgba(0,255,65,0.02)",
        }}
      >
        <h2 className="text-[13px] text-[#00FF41] uppercase" style={SM}>
          Profile
        </h2>
        <div className="space-y-3">
          <div>
            <label
              className="text-[11px] text-[#888888] block mb-1"
              style={IBM}
            >
              Startup Name
            </label>
            <input
              className="terminal-input w-full px-3 py-2 rounded text-[13px]"
              style={IBM}
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className="text-[11px] text-[#888888] block mb-1"
              style={IBM}
            >
              Email
            </label>
            <input
              className="terminal-input w-full px-3 py-2 rounded text-[13px]"
              style={IBM}
              value={profile.email}
              onChange={(e) =>
                setProfile((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className="text-[11px] text-[#888888] block mb-1"
              style={IBM}
            >
              Description
            </label>
            <input
              className="terminal-input w-full px-3 py-2 rounded text-[13px]"
              style={IBM}
              value={profile.description}
              onChange={(e) =>
                setProfile((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
          <button
            className="mt-2 px-4 py-2 rounded text-[12px] transition-colors hover:bg-[#00FF41]/10"
            style={{ border: "1px solid #00FF41", color: "#00FF41", ...SM }}
          >
            SAVE PROFILE
          </button>
        </div>
      </section>

      {/* Notifications Section */}
      <section
        className="rounded-xl p-6 space-y-4"
        style={{
          border: "1px solid #FF00FF",
          backgroundColor: "rgba(255,0,255,0.02)",
        }}
      >
        <h2 className="text-[13px] text-[#FF00FF] uppercase" style={SM}>
          Notifications
        </h2>
        <div className="space-y-3">
          {[
            {
              key: "digestEmail" as const,
              label: "Weekly Digest Email",
              desc: "Receive intelligence briefs every Monday",
            },
            {
              key: "signalAlerts" as const,
              label: "Signal Alerts",
              desc: "Get notified for high-importance signals",
            },
            {
              key: "competitorUpdates" as const,
              label: "Competitor Updates",
              desc: "Alerts when competitors make major changes",
            },
            {
              key: "weeklyReport" as const,
              label: "Weekly Summary Report",
              desc: "Aggregated weekly performance report",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="text-[12px] text-white" style={SM}>
                  {item.label}
                </p>
                <p className="text-[11px] text-[#888888]" style={IBM}>
                  {item.desc}
                </p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(val) =>
                  setNotifications((n) => ({ ...n, [item.key]: val }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* Preferences Section */}
      <section
        className="rounded-xl p-6 space-y-4"
        style={{
          border: "1px solid #00FFFF",
          backgroundColor: "rgba(0,255,255,0.02)",
        }}
      >
        <h2 className="text-[13px] text-[#00FFFF] uppercase" style={SM}>
          Preferences
        </h2>
        <div className="space-y-3">
          {[
            {
              key: "autoIngest" as const,
              label: "Auto-Ingest",
              desc: "Automatically scrape competitor data on schedule",
            },
            {
              key: "darkMode" as const,
              label: "Dark Mode",
              desc: "Terminal aesthetic (always on)",
            },
            {
              key: "compactView" as const,
              label: "Compact View",
              desc: "Reduce spacing in signal and competitor lists",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="text-[12px] text-white" style={SM}>
                  {item.label}
                </p>
                <p className="text-[11px] text-[#888888]" style={IBM}>
                  {item.desc}
                </p>
              </div>
              <Switch
                checked={preferences[item.key]}
                onCheckedChange={(val) =>
                  setPreferences((p) => ({ ...p, [item.key]: val }))
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section
        className="rounded-xl p-6 space-y-4"
        style={{
          border: "1px solid rgba(255,60,60,0.4)",
          backgroundColor: "rgba(255,60,60,0.02)",
        }}
      >
        <h2 className="text-[13px] text-red-400 uppercase" style={SM}>
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] text-white" style={SM}>
              Delete Account
            </p>
            <p className="text-[11px] text-[#888888]" style={IBM}>
              Permanently delete your account and all data
            </p>
          </div>
          <button
            className="px-4 py-2 rounded text-[12px] text-red-400 transition-colors hover:bg-red-400/10"
            style={{ border: "1px solid rgba(255,60,60,0.4)", ...SM }}
          >
            DELETE
          </button>
        </div>
      </section>
    </div>
  );
}
