
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { useTeamLeaderDashboard } from '@/hooks/useTeamLeaderDashboard';
import TeamLeaderAccessCheck from '@/components/team-leader/TeamLeaderAccessCheck';
import StatsCards from '@/components/team-leader/StatsCards';
import EarningsChart from '@/components/team-leader/EarningsChart';
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
    <div className="min-h-screen flex flex-col bg-background container max-w-6xl mx-auto px-4 pt-8 pb-12">
      <Header />
      <main className="flex-1 space-y-8">
        <AdvertisementBanner position="top" slotId="team-leader-top" pageSection="team-leader-dashboard" />
        
        <TeamLeaderAccessCheck 
          isTeamLeader={isTeamLeader} 
          isLoading={isLoading} 
        />
        
        {isTeamLeader && !isLoading && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Leader Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your team members and track your earnings.
                </p>
              </div>
              <Button onClick={() => navigate('/profile')}>
                Back to Profile
              </Button>
            </div>
            
            <StatsCards
              totalEarnings={totalEarnings}
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
        
        <AdvertisementBanner position="bottom" slotId="team-leader-bottom" pageSection="team-leader-dashboard" />
      </main>
      <Footer />
    </div>
  );
};

export default TeamLeaderDashboardPage;
