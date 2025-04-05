
import React, { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from '../utils/quizData';
import { Button } from '@/components/ui/button';
import { UserPlus, Copy, ArrowUp, Award, Shield, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Separator } from "@/components/ui/separator";
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck, UserX, CalendarDays, Ban } from 'lucide-react';

interface ReferralEntry {
  id: string;
  email: string;
  name: string;
  date: string;
  status: 'pending' | 'active' | 'inactive';
  lastActive: string;
  monthsActive: number;
  totalEarned: number;
}

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

const ReferralSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Team Leader Dashboard states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [earnings, setEarnings] = useState<EarningDetail[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [activeMembers, setActiveMembers] = useState<number>(0);
  const [inactiveMembers, setInactiveMembers] = useState<number>(0);
  const [suspendedMembers, setSuspendedMembers] = useState<number>(0);
  
  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    
    if (userId) {
      setUserId(userId);
    }
    
    if (userName) {
      setUserName(userName);
    }
    
    const savedReferrals = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    if (savedReferrals) {
      const parsedReferrals = JSON.parse(savedReferrals);
      setReferrals(parsedReferrals);
      
      const activeReferrals = parsedReferrals.filter(r => r.status === 'active').length;
      setIsTeamLeader(activeReferrals >= 10);
    }
    
    fetchUserReferrals(userId);
    
    // Check user role
    if (userId) {
      fetchUserRole(userId);
    }
  }, []);
  
  const fetchUserRole = async (userId: string | null) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
        
      if (!error && data) {
        setUserRole(data.role);
        if (data.role === 'team_leader') {
          setIsTeamLeader(true);
          fetchTeamMembers(userId);
          fetchEarnings(userId);
        }
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };
  
  const fetchUserReferrals = async (userId: string | null) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', userId);
        
      if (error) {
        console.error('Error fetching referrals:', error);
      } else if (data && data.length > 0) {
        const mappedReferrals: ReferralEntry[] = data.map(r => ({
          id: r.id,
          email: r.referred_email || '',
          name: r.referred_name,
          date: r.date,
          status: r.status as 'pending' | 'active' | 'inactive',
          lastActive: r.last_active_date || '',
          monthsActive: Math.floor(Math.random() * 5) + 1,
          totalEarned: Number(r.earnings) || Math.floor(Math.random() * 1000) + 500
        }));
        
        setReferrals(mappedReferrals);
        localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(mappedReferrals));
        
        const activeReferrals = mappedReferrals.filter(r => r.status === 'active').length;
        setIsTeamLeader(activeReferrals >= 10 || userRole === 'team_leader');
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    if (referrals.some(r => r.email === email)) {
      toast({
        title: "Already Invited",
        description: "This email has already been invited",
        variant: "destructive",
      });
      return;
    }
    
    const newReferral: ReferralEntry = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      date: new Date().toISOString(),
      status: 'pending',
      lastActive: '',
      monthsActive: 0,
      totalEarned: 0
    };
    
    const updatedReferrals = [...referrals, newReferral];
    setReferrals(updatedReferrals);
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(updatedReferrals));
    
    toast({
      title: "Invitation Sent!",
      description: `An invitation has been sent to ${email}`,
    });
    
    setEmail('');
    
    setTimeout(() => {
      simulateSuccessfulReferral(newReferral.id);
    }, 5000);
  };
  
  const simulateSuccessfulReferral = (id: string) => {
    const updated = referrals.map(ref => {
      if (ref.id === id) {
        return { 
          ...ref, 
          status: 'active' as const,
          lastActive: new Date().toISOString(),
          monthsActive: 1,
          totalEarned: 500
        };
      }
      return ref;
    });
    
    setReferrals(updated);
    localStorage.setItem(STORAGE_KEYS.REFERRALS, JSON.stringify(updated));
    
    const currentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    const newPoints = currentPoints + 20;
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
    
    addReferralReward(500);
    
    window.dispatchEvent(new Event('pointsUpdated'));
    
    toast({
      title: "Referral Success!",
      description: "Your friend signed up! You'll earn ₹500 after they play for one day.",
    });
  };
  
  const addReferralReward = (amount: number) => {
    const achievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
    
    achievements.push({
      id: Date.now().toString(),
      type: 'referral_reward',
      month: new Date().toISOString().slice(0, 7),
      reward: amount,
      date: new Date().toISOString(),
      claimed: false
    });
    
    localStorage.setItem('quiz_app_achievements', JSON.stringify(achievements));
  };
  
  const copyReferralLink = () => {
    // Update to send directly to registration page with referral code
    const link = `${window.location.origin}/register?ref=${userName}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const remainingForLeader = Math.max(0, 10 - activeReferrals);
  const leaderProgressPercentage = Math.min(100, (activeReferrals / 10) * 100);

  // Define columns for the team members table
  const memberColumns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue("name")}</span>
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
        const status = row.getValue("status");
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
          <span>{row.getValue("lastActive") || 'Never'}</span>
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
      cell: (row: any) => <span>₹{row.getValue("totalEarned")}</span>,
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {row.getValue("status") !== 'suspended' && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => requestAccountAction(row.getValue("id"), 'suspend')}
            >
              Request Suspension
            </Button>
          )}
          {row.getValue("status") === 'suspended' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => requestAccountAction(row.getValue("id"), 'reactivate')}
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
      cell: (row: any) => <span>₹{row.getValue("amount")}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="quiz-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">Refer Friends</h3>
          <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
            {isTeamLeader ? "Team Leader" : "Regular Member"}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-secondary/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-full">
                {isTeamLeader ? <Shield className="h-5 w-5 text-primary" /> : <Award className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <h4 className="font-medium text-lg">{isTeamLeader ? "Team Leader Benefits" : "Regular Referral Bonus"}</h4>
                {isTeamLeader ? (
                  <p className="text-muted-foreground mt-1">
                    As a Team Leader, you earn ₹500 per month for each active referred player!
                    Your members must remain active for the full month for you to receive the bonus.
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-1">
                    Invite your friends to play QuizPoints and earn ₹500 for each friend who joins and plays actively for one day.
                  </p>
                )}
              </div>
            </div>
          </div>

          {isTeamLeader && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-100 dark:bg-blue-800/30 p-2 rounded-full">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">Team Leader Dashboard</h4>
                  <p className="text-muted-foreground mt-1">
                    You can manage your team members and track your earnings directly below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isTeamLeader && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-100 dark:bg-blue-800/30 p-2 rounded-full">
                  <ArrowUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">Become a Team Leader</h4>
                  <p className="text-muted-foreground mt-1">
                    Refer 10 active friends to unlock Team Leader status and earn ₹500 monthly from each active referred player!
                  </p>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress: {activeReferrals} / 10 active referrals</span>
                      <span>{remainingForLeader} more needed</span>
                    </div>
                    <Progress value={leaderProgressPercentage} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Separator className="my-6" />
        
        <form onSubmit={handleInvite} className="mb-6">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <UserPlus className="w-4 h-4 mr-2" />
              <span>Invite</span>
            </Button>
          </div>
        </form>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Or share your referral link</span>
          <Button variant="outline" size="sm" onClick={copyReferralLink}>
            <Copy className="w-4 h-4 mr-2" />
            <span>Copy Link</span>
          </Button>
        </div>
      </div>

      <div className="quiz-card">
        <h3 className="text-xl font-medium mb-6">Your Referral Stats</h3>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-secondary p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Invited</div>
              <div className="text-2xl font-bold">{referrals.length}</div>
            </div>
            
            <div className="bg-secondary p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Active Friends</div>
              <div className="text-2xl font-bold">{activeReferrals}</div>
            </div>
            
            <div className="bg-secondary p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Earned</div>
              <div className="text-2xl font-bold">
                ₹{referrals.reduce((sum, r) => sum + (r.status === 'active' ? 500 : 0), 0)}
              </div>
            </div>
          </div>
        )}
        
        {referrals.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>You haven't referred any friends yet</p>
            <p className="text-sm mt-1">Share your referral link to get started!</p>
          </div>
        )}
      </div>

      {/* Team Leader Dashboard - Only show if user is a team leader */}
      {isTeamLeader && (
        <div className="space-y-8">
          <h3 className="text-2xl font-bold tracking-tight">Team Leader Dashboard</h3>
          
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
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
