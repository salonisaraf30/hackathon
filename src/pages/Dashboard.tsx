import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import QuickStats from "@/components/dashboard/QuickStats";
import TopCompetitorCard from "@/components/dashboard/TopCompetitorCard";
import CompetitorGrid from "@/components/dashboard/CompetitorGrid";
import SignalsTimeline from "@/components/dashboard/SignalsTimeline";
import ThreatRadar from "@/components/dashboard/ThreatRadar";
import WeeklyDigestCTA from "@/components/dashboard/WeeklyDigestCTA";

const Dashboard = () => {
  return (
    <div className="scanlines min-h-screen bg-background">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="ml-60 p-6 space-y-6 overflow-y-auto min-h-screen dashboard-scroll">
        {/* Quick Stats */}
        <QuickStats />

        {/* Top Competitor Hero */}
        <TopCompetitorCard />

        {/* Competitor Grid */}
        <div>
          <h2 className="font-pixel text-xs text-foreground mb-4">👾 COMPETITOR ROSTER</h2>
          <CompetitorGrid />
        </div>

        {/* Signals + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SignalsTimeline />
          </div>
          <div>
            <ThreatRadar />
          </div>
        </div>

        {/* Weekly Digest CTA */}
        <WeeklyDigestCTA />
      </main>
    </div>
  );
};

export default Dashboard;
