"use client";

import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: "🏠" },
  { title: "Competitors", url: "/competitors", icon: "👾" },
  { title: "Digest", url: "/digest", icon: "📬" },
  { title: "Signals", url: "/signals", icon: "📡" },
  
  { title: "Settings", url: "/settings", icon: "⚙" },
];

export default function DashboardSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-background border-r border-primary flex flex-col z-40">
      <div className="p-5 border-b border-muted">
        <span className="font-pixel text-xs text-primary text-glow-green leading-relaxed">
          ⚡ COMPETITOR
          <br />
          &nbsp;&nbsp;&nbsp;PULSE
        </span>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className="flex items-center gap-3 px-5 py-3 font-terminal text-lg text-muted-foreground hover:text-primary transition-colors border-l-2 border-transparent"
            activeClassName="border-l-2 !border-primary !text-primary"
          >
            <span>{item.icon}</span>
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-muted">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8 border border-primary glow-green">
            <AvatarFallback className="bg-card text-primary font-pixel text-[8px]">P1</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-pixel text-[7px] text-primary">PLAYER 1</p>
            <p className="font-terminal text-xs text-muted-foreground">LVL 4</p>
          </div>
        </div>
        <div className="font-terminal text-[10px] text-primary">
          <span>██████░░ 2400/3000 XP</span>
        </div>
      </div>
    </aside>
  );
}
