import type { Metadata } from "next";
import { Space_Mono, IBM_Plex_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import DashboardShell from "@/components/dashboard/DashboardShell";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "CompetitorPulse — AI Competitive Intelligence",
  description: "Know every move your competitors make.",
};

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${spaceMono.variable} ${ibmPlexMono.variable} antialiased bg-black text-white min-h-screen`}
        style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
      >
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
          <DashboardShell>{children}</DashboardShell>
        </Suspense>
      </body>
    </html>
  );
}
