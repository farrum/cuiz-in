
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, Users, UserCheck, UserX, CalendarDays, 
  CheckCircle, XCircle, AlertCircle, RefreshCw, Ban
} from 'lucide-react';
import AdvertisementBanner from '@/components/AdvertisementBanner';

// Types for team members
interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  monthsActive: number;
  joinDate: string;
  totalEarned: number;
}

// Types for earnings
interface EarningDetail {
  month: string;
  amount: number;
  membersCount: number;
  breakdown: {
    memberId: string;
    memberName: string;
    amount: number;
  }[];
}

const TeamLeaderDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [earnings, setEarnings] = useState<EarningDetail[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [activeMembers, setActiveMembers] = useState<number>(0);
  const [inactiveMembers, setInactiveMembers] = useState<number>(0);
  const [suspendedMembers, setSuspendedMembers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTeamLeader, setIsTeamLeader] = useState<boolean>(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    
    if (!storedUserId) {
      navigate('/login');
      return;
    }

    setUserId(storedUserId);
    
    // Check if user is a team leader
    const checkTeamLeaderStatus = async () => {
      try {
        // First check local referrals
        const savedReferrals = localStorage.getItem(STORAGE_KEYS.REFERRALS);
        if (savedReferrals) {
          const parsedReferrals = JSON.parse(savedReferrals);
          const activeReferrals = parsedReferrals.filter((r: any) => r.status === 'active').length;
          const isLeader = activeReferrals >= 10;
          
          setIsTeamLeader(isLeader);
          
          if (!isLeader) {
            toast({
              title: "Access Denied",
              description: "Only Team Leaders can access this dashboard. Refer at least 10 active users to become a Team Leader.",
              variant: "destructive",
            });
            navigate('/profile');
            return;
          }
        }
        
        // Then fetch from Supabase for the most up-to-date data
        fetchTeamMembers(storedUserId);
        fetchEarnings(storedUserId);
      } catch (error) {
        console.error('Error checking team leader status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkTeamLeaderStatus();
  }, [navigate, toast]);

  // Fetch team members data
  const fetchTeamMembers = async (leaderId: string) => {
    try {
      const { data: referrals, error } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', leaderId);

      if (error) throw error;
      
      if (referrals) {
        const members = referrals.map(r => ({
          id: r.referred_id || r.id,
          name: r.referred_name,
          email: r.referred_email || '',
          status: r.status as 'active' | 'inactive' | 'suspended',
          lastActive: r.last_active_date || '-',
          monthsActive: Math.max(1, Math.floor((new Date().getTime() - new Date(r.date).getTime()) / (30 * 24 * 60 * 60 * 1000))),
          joinDate: r.date,
          totalEarned: Number(r.earnings) || 0
        }));

        setTeamMembers(members);
        
        // Update status counts
        setActiveMembers(members.filter(m => m.status === 'active').length);
        setInactiveMembers(members.filter(m => m.status === 'inactive').length);
        setSuspendedMembers(members.filter(m => m.status === 'suspended').length);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      toast({
        title: "Error",
        description: "Failed to load team members data.",
        variant: "destructive",
      });
    }
  };

  // Fetch earnings data
  const fetchEarnings = async (leaderId: string) => {
    try {
      // For this example, we'll simulate earnings data
      // In a real application, this should come from the database
      
      // Get the current month and previous 5 months
      const months = [];
      const now = new Date();
      
      for (let i = 0; i < 6; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = month.toLocaleString('default', { month: 'long', year: 'numeric' });
        months.push(monthStr);
      }
      
      // Get saved referrals for mockup earnings data
      const savedReferrals = localStorage.getItem(STORAGE_KEYS.REFERRALS);
      let referrals: any[] = [];
      
      if (savedReferrals) {
        referrals = JSON.parse(savedReferrals);
      }
      
      // Create earnings data
      const earningsData: EarningDetail[] = months.map((month, index) => {
        // For the mockup: more earnings for recent months, less for older months
        const activeCount = Math.max(10, referrals.filter(r => r.status === 'active').length);
        const monthAmount = activeCount * 500;
        
        const mockBreakdown = referrals
          .filter(r => r.status === 'active')
          .map(r => ({
            memberId: r.id,
            memberName: r.name,
            amount: 500
          }));
        
        return {
          month,
          amount: monthAmount,
          membersCount: activeCount,
          breakdown: mockBreakdown
        };
      });
      
      setEarnings(earningsData);
      
      // Calculate total earnings
      const total = earningsData.reduce((sum, month) => sum + month.amount, 0);
      setTotalEarnings(total);
      
    } catch (err) {
      console.error('Error fetching earnings:', err);
      toast({
        title: "Error",
        description: "Failed to load earnings data.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      // Update in local state first for responsive UI
      const updatedMembers = teamMembers.map(member => {
        if (member.id === memberId) {
          return { ...member, status: newStatus };
        }
        return member;
      });
      
      setTeamMembers(updatedMembers);
      
      // Update status counts
      setActiveMembers(updatedMembers.filter(m => m.status === 'active').length);
      setInactiveMembers(updatedMembers.filter(m => m.status === 'inactive').length);
      setSuspendedMembers(updatedMembers.filter(m => m.status === 'suspended').length);
      
      // In a real application, send this update to the server
      // await supabase.from('user_referrals').update({ status: newStatus }).eq('referred_id', memberId);
      
      toast({
        title: "Status Updated",
        description: `Member status has been updated to ${newStatus}.`,
      });
    } catch (err) {
      console.error('Error updating member status:', err);
      toast({
        title: "Error",
        description: "Failed to update member status.",
        variant: "destructive",
      });
    }
  };

  const requestAccountAction = async (memberId: string, action: 'suspend' | 'reactivate') => {
    try {
      // In a real application, send this request to the server
      // await supabase.from('account_action_requests').insert({
      //   team_leader_id: userId,
      //   member_id: memberId,
      //   action_requested: action,
      //   request_date: new Date().toISOString(),
      //   status: 'pending'
      // });
      
      toast({
        title: "Request Submitted",
        description: `Your request to ${action} this account has been submitted for admin review.`,
      });
    } catch (err) {
      console.error(`Error requesting account ${action}:`, err);
      toast({
        title: "Error",
        description: `Failed to submit ${action} request.`,
        variant: "destructive",
      });
    }
  };

  // Define columns for the team members table
  const memberColumns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => {
        const status = row.status;
        return (
          <Badge variant={
            status === 'active' ? 'success' : 
            status === 'inactive' ? 'secondary' : 
            'destructive'
          }>
            {status === 'active' && <UserCheck className="h-3 w-3 mr-1" />}
            {status === 'inactive' && <UserX className="h-3 w-3 mr-1" />}
            {status === 'suspended' && <Ban className="h-3 w-3 mr-1" />}
            {status}
          </Badge>
        );
      },
    },
    {
      header: "Last Active",
      accessorKey: "lastActive",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>{row.lastActive || 'Never'}</span>
        </div>
      ),
    },
    {
      header: "Months Active",
      accessorKey: "monthsActive",
    },
    {
      header: "Earnings",
      accessorKey: "totalEarned",
      cell: (row: any) => <span>₹{row.totalEarned}</span>,
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {row.status !== 'suspended' && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => requestAccountAction(row.id, 'suspend')}
            >
              Request Suspension
            </Button>
          )}
          {row.status === 'suspended' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => requestAccountAction(row.id, 'reactivate')}
            >
              Request Reactivation
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Define columns for the earnings table
  const earningsColumns = [
    {
      header: "Month",
      accessorKey: "month",
    },
    {
      header: "Active Members",
      accessorKey: "membersCount",
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (row: any) => <span>₹{row.amount}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-6xl pt-8 pb-12 px-4">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isTeamLeader) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-6xl pt-8 pb-12 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                Only Team Leaders can access this dashboard. Refer at least 10 active users to become a Team Leader.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-6xl pt-8 pb-12 px-4">
        <AdvertisementBanner position="top" slotId="team-leader-top" pageSection="team-leader-dashboard" />
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">₹{totalEarnings}</p>
              <p className="text-muted-foreground text-sm">Lifetime earnings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Active Members</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-green-500" />
              <p className="text-3xl font-bold">{activeMembers}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Inactive Members</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <UserX className="h-6 w-6 text-amber-500" />
              <p className="text-3xl font-bold">{inactiveMembers}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Suspended Members</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Ban className="h-6 w-6 text-red-500" />
              <p className="text-3xl font-bold">{suspendedMembers}</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="members" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <CalendarDays className="h-4 w-4 mr-2" />
              Monthly Earnings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Your Team Members</CardTitle>
                <CardDescription>
                  View and manage the status of your referred team members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={memberColumns} 
                  data={teamMembers} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
                <CardDescription>
                  View your monthly earnings from active members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={earningsColumns} 
                  data={earnings} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <AdvertisementBanner position="bottom" slotId="team-leader-bottom" pageSection="team-leader-dashboard" />
      </main>
      <Footer />
    </div>
  );
};

export default TeamLeaderDashboardPage;
