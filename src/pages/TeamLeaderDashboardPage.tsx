import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { useTeamLeaderDashboard } from '@/hooks/useTeamLeaderDashboard';
import TeamLeaderAccessCheck from '@/components/team-leader/TeamLeaderAccessCheck';
import StatsCards from '@/components/team-leader/StatsCards';
import TabsSection from '@/components/team-leader/TabsSection';

const TeamLeaderDashboardPage = () => {
  const navigate = useNavigate();
  const {
    isTeamLeader,
    activeMembers,
    inactiveMembers,
    suspendedMembers,
    teamMembers,
    totalEarnings,
    chartData,
    isLoading,
    membersLoading,
    earnings,
    handleStatusChange,
    requestAccountAction,
    earningsColumns
  } = useTeamLeaderDashboard();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-6xl pt-8 pb-12 px-4">
        <SimpleAdBanner position="header" className="mb-6" />
        
        <TeamLeaderAccessCheck 
          isTeamLeader={isTeamLeader} 
          isLoading={isLoading} 
        />
        
        {isTeamLeader && !isLoading && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Leader Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your team members and track activity.
                </p>
              </div>
              <Button onClick={() => navigate('/profile')}>
                Back to Profile
              </Button>
            </div>
            
            <StatsCards
              activeMembers={activeMembers}
              inactiveMembers={inactiveMembers}
              suspendedMembers={suspendedMembers}
            />
            
            <EarningsChart chartData={chartData} />
            
            <TabsSection
              teamMembers={teamMembers}
              earnings={earnings}
              membersLoading={membersLoading}
              handleStatusChange={handleStatusChange}
              requestAccountAction={requestAccountAction}
              earningsColumns={earningsColumns}
            />
          </>
        )}
        
        <SimpleAdBanner position="footer" className="mt-6" />
      </main>
      <Footer />
    </div>
  );
};

export default TeamLeaderDashboardPage;
