"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Radio, FileText, Settings } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/competitors", label: "Competitors", icon: Users },
  { href: "/signals", label: "Signals", icon: Radio },
  { href: "/digest", label: "Digest", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
        className="w-[240px] shrink-0 flex flex-col"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(0, 255, 65, 0.3)",
          boxShadow: "4px 0 24px rgba(0, 0, 0, 0.3)",
        }}
      >
      <div className="p-4 border-b border-[#00FF41]/30">
        <span className="text-[#00FF41] text-xs" style={{ fontFamily: "var(--font-space-mono)" }}>
          ⚡ CompetitorPulse
        </span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-r text-sm transition-colors relative ${
                isActive ? "text-[#00FF41]" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              {isActive && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#00FF41] rounded-r" />}
              <Icon className="w-5 h-5 shrink-0 ml-0.5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#00FF41]/30 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-[#00FF41]/50 flex items-center justify-center text-[#00FF41] text-xs font-bold" style={{ fontFamily: "var(--font-space-mono)" }}>
          U
        </div>
        <span className="text-white/50 text-xs truncate" style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
          user@competitorpulse.io
        </span>
      </div>
    </aside>
  );
}
