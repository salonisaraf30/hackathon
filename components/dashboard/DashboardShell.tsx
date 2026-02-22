"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardSidebar from "./DashboardSidebar";

const CyberneticGridShader = dynamic(
  () => import("@/components/ui/cybernetic-grid-shader"),
  { ssr: false }
);

const SIDEBAR_ROUTES = ["/dashboard", "/competitors", "/signals", "/digest", "/settings"];

function shouldShowSidebar(pathname: string): boolean {
  return SIDEBAR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);

  if (!showSidebar) {
    return (
      <div className="scanlines min-h-screen bg-black text-white">
        {children}
      </div>
    );
  }

  return (
    <div className="scanlines min-h-screen bg-black text-white flex relative">
      <CyberneticGridShader />
      <DashboardSidebar />
      <main className="flex-1 ml-[240px] overflow-auto p-6 md:p-8 dashboard-scroll">
        {children}
      </main>
    </div>
  );
}
