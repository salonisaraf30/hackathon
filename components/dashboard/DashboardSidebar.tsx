"use client";

import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Users,
  Radio,
  FileText,
  Settings,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Competitors", url: "/competitors", icon: Users },
  { title: "Signals", url: "/signals", icon: Radio },
  { title: "Digest", url: "/digest", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export default function DashboardSidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40 sidebar-glass"
      style={{ width: 240 }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <span
          className="text-[#00FF41] text-sm tracking-wider"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          CompetitorPulse
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className="flex items-center gap-3 px-5 py-3 text-white/70 hover:text-white transition-colors border-l-4 border-transparent"
              activeClassName="!border-l-4 !border-[#00FF41] !text-[#00FF41]"
            >
              <Icon className="h-4 w-4" />
              <span
                className="text-[13px] tracking-wide"
                style={{ fontFamily: "var(--font-space-mono)" }}
              >
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-[#00FF41] flex items-center justify-center"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            <span className="text-[#00FF41] text-[10px]">U</span>
          </div>
          <span
            className="text-white/50 text-[12px]"
            style={{ fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            user@competitorpulse.io
          </span>
        </div>
      </div>
    </aside>
  );
}
