import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  Press_Start_2P,
  VT323,
  Space_Mono,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "CompetitorPulse — AI Competitive Intelligence",
  description: "Know every move your competitors make.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${vt323.variable} ${spaceMono.variable} ${ibmPlexMono.variable}`}
    >
      <body className="antialiased bg-black text-white min-h-screen">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
