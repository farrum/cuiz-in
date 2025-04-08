
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
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useTeamLeaderEarnings } from '@/hooks/useTeamLeaderEarnings';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TeamLeaderDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isTeamLeader, setIsTeamLeader] = useState<boolean>(false);
  const { 
    teamMembers, 
    activeMembers, 
    inactiveMembers, 
    suspendedMembers, 
    isLoading: membersLoading,
    handleStatusChange
  } = useTeamMembers();
  const {
    earnings,
    totalEarnings,
    isLoading: earningsLoading
  } = useTeamLeaderEarnings();

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
        // Get user role from localStorage
        const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
        const isLeaderRole = userRole === 'team_leader' || userRole === 'teamleader';
        
        if (isLeaderRole) {
          setIsTeamLeader(true);
        } else {
          // Fetch from database to make sure
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', storedUserId)
            .maybeSingle();
            
          if (error) throw error;
          
          const role = data?.role;
          const isLeader = role === 'team_leader' || role === 'teamleader';
          
          setIsTeamLeader(isLeader);
          
          if (!isLeader) {
            toast({
              title: "Access Denied",
              description: "Only Team Leaders can access this dashboard. Refer at least 10 active users to become a Team Leader.",
              variant: "destructive",
            });
            navigate('/profile');
          }
        }
      } catch (error) {
        console.error('Error checking team leader status:', error);
        setIsTeamLeader(false);
      }
    };
    
    checkTeamLeaderStatus();
  }, [navigate, toast]);

  const requestAccountAction = async (memberId: string, action: 'suspend' | 'reactivate') => {
    try {
      // Send notification to admin
      const { error } = await supabase.from('admin_notifications').insert({
        type: `account_${action}_request`,
        message: `Team leader ${userId} has requested to ${action} account ${memberId}`,
        data: { team_leader_id: userId, member_id: memberId, action }
      });
      
      if (error) throw error;
      
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

  const isLoading = membersLoading || earningsLoading;

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

  // Prepare data for the earnings chart
  const chartData = earnings.slice(0, 6).map(item => ({
    month: item.month,
    amount: item.amount,
    members: item.membersCount
  })).reverse();

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
        
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Monthly Earnings Trend</CardTitle>
              <CardDescription>
                View your earnings over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="amount" name="Earnings (₹)" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="members" name="Active Members" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        
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
