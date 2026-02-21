import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Users,
  Radio,
  Mail,
  Settings,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Competitors", url: "/competitors", icon: Users },
  { title: "Signals", url: "/signals", icon: Radio },
  { title: "Digest", url: "/digest", icon: Mail },
  { title: "Settings", url: "/settings", icon: Settings },
];

const DashboardSidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-background border-r border-primary flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-muted">
        <span className="font-pixel text-[10px] text-primary text-glow-green leading-relaxed">
          ⚡ Competitor
          <br />
          &nbsp;&nbsp;&nbsp;Pulse
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className="flex items-center gap-3 px-5 py-3 font-terminal text-lg text-muted-foreground hover:text-primary transition-colors border-l-2 border-transparent"
            activeClassName="border-l-2 !border-primary !text-primary"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Player Profile */}
      <div className="p-4 border-t border-muted">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8 border border-primary glow-green">
            <AvatarFallback className="bg-card text-primary font-pixel text-[8px]">
              P1
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-pixel text-[7px] text-primary">PLAYER 1</p>
            <p className="font-terminal text-xs text-muted-foreground">LVL 12</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between font-terminal text-[10px] text-muted-foreground">
            <span>XP</span>
            <span>2,450 / 3,000</span>
          </div>
          <Progress value={82} className="h-2 bg-muted [&>div]:bg-primary" />
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
