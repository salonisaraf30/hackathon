"use client";

import { usePathname } from "next/navigation";
import CyberneticGridShader from "@/components/ui/cybernetic-grid-shader";
import DashboardSidebar from "./DashboardSidebar";

const SIDEBAR_PATHS = ["/dashboard", "/competitors", "/signals", "/digest", "/settings"];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = SIDEBAR_PATHS.some((p) => pathname === p || (p !== "/dashboard" && pathname.startsWith(p)));

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex relative">
      <CyberneticGridShader />
      <div className="scanlines" aria-hidden />
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
