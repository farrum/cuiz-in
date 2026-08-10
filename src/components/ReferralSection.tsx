
import React, { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from '../utils/quizData';
import { Button } from '@/components/ui/button';
import { UserPlus, Copy, ArrowUp, Award, Shield, Users, BarChartIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Separator } from "@/components/ui/separator";
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/ui/data-table';
import { buildReferralLink } from '@/utils/referralLink';

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

interface TeamMemberData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  joinDate: string;
  lastActive: string;
  monthsActive: number;
  monthlyEarning: number;
  daysActive: number;
}

const ReferralSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeamMembersLoading, setIsTeamMembersLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [totalTeamEarnings, setTotalTeamEarnings] = useState(0);
  
  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    
    if (userId) {
      setUserId(userId);
    }
    
    if (userName) {
      setUserName(userName);
    }
    
    if (userRole === 'team_leader' || userRole === 'teamleader' || userRole === 'junior_team_leader') {
      setIsTeamLeader(true);
      console.log('User is a team leader based on role:', userRole);
    }
    
    const savedReferrals = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    if (savedReferrals) {
      const parsedReferrals = JSON.parse(savedReferrals);
      setReferrals(parsedReferrals);
      
      if (userRole !== 'team_leader' && userRole !== 'teamleader' && userRole !== 'junior_team_leader') {
        const activeReferrals = parsedReferrals.filter((r: any) => r.status === 'active').length;
        const shouldBeTeamLeader = activeReferrals >= 10;
        
        if (shouldBeTeamLeader) {
          setIsTeamLeader(true);
          console.log('User should be a team leader based on referrals count:', activeReferrals);
        }
      }
    }
    
    fetchUserReferrals(userId);
    checkIfTeamLeader(userId);
    
    const handleRoleUpdate = () => {
      const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
      setIsTeamLeader(userRole === 'team_leader' || userRole === 'teamleader' || userRole === 'junior_team_leader');
      console.log('Role update received in ReferralSection, new role:', userRole);
    };
    
    window.addEventListener('currentUserRoleUpdated', handleRoleUpdate);
    window.addEventListener('userRoleUpdated', handleRoleUpdate);
    
    return () => {
      window.removeEventListener('currentUserRoleUpdated', handleRoleUpdate);
      window.removeEventListener('userRoleUpdated', handleRoleUpdate);
    };
  }, []);

  const checkIfTeamLeader = async (userId: string | null) => {
    if (!userId) return;
    
    try {
      const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
      if (userRole === 'team_leader' || userRole === 'teamleader' || userRole === 'junior_team_leader') {
        setIsTeamLeader(true);
        fetchTeamMembers(userId);
        calculateEarnings(userId);
        return;
      }
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error checking team leader role:', error);
      } else if (data) {
        const role = data.role;
        const isTeamLeaderRole = role === 'team_leader' || role === 'teamleader' || role === 'junior_team_leader';
        
        if (isTeamLeaderRole) {
          setIsTeamLeader(true);
          localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
          fetchTeamMembers(userId);
          calculateEarnings(userId);
        }
      }
    } catch (err) {
      console.error('Failed to check team leader status:', err);
    }
  };
  
  const calculateDaysActive = (joinDate: string, lastActive: string): number => {
    const today = new Date();
    let comparisonDate: Date;
    
    if (lastActive && new Date(lastActive) > new Date(joinDate)) {
      comparisonDate = new Date(lastActive);
    } else {
      comparisonDate = new Date(joinDate);
    }
    
    const diffTime = today.getTime() - comparisonDate.getTime();
    return Math.max(1, Math.floor(diffTime / (24 * 60 * 60 * 1000)));
  };
  
  const fetchTeamMembers = async (userId: string) => {
    setIsTeamMembersLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('referrer_id', userId);
        
      if (error) {
        console.error('Error fetching team members:', error);
      } else if (data) {
        const mappedMembers: TeamMemberData[] = data.map(member => {
          const daysActive = calculateDaysActive(member.date, member.last_active_date || '');
          
          return {
            id: member.referred_id,
            name: member.referred_name,
            email: member.referred_email || '',
            status: member.status as 'active' | 'inactive',
            joinDate: member.date,
            lastActive: member.last_active_date || '',
            daysActive: daysActive,
            monthsActive: Math.ceil(daysActive / 30),
            monthlyEarning: member.status === 'active' ? 500 : 0 // gems
          };
        });
        
        console.log('Fetched and mapped team members:', mappedMembers);
        setTeamMembers(mappedMembers);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setIsTeamMembersLoading(false);
    }
  };
  
  const calculateEarnings = (userId: string) => {
    const monthlyAmount = referrals.filter(r => r.status === 'active').length * 500;
    setMonthlyEarnings(monthlyAmount);
    
    const totalAmount = referrals.reduce((sum, r) => sum + r.totalEarned, 0);
    setTotalTeamEarnings(totalAmount);
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
        if (activeReferrals >= 10) {
          setIsTeamLeader(true);
          fetchTeamMembers(userId);
          calculateEarnings(userId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setIsLoading(false);
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
    
    const currentGems = parseInt(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0');
    const newGems = currentGems + 20;
    localStorage.setItem(STORAGE_KEYS.USER_GEMS, newGems.toString());
    
    addReferralReward(500);
    
    window.dispatchEvent(new Event('gemsUpdated'));
    
    toast({
      title: "Referral Success!",
      description: "Your friend signed up! You'll earn 500 bonus gems after they play for one day.",
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
    const link = buildReferralLink(userName);
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const remainingForLeader = Math.max(0, 10 - activeReferrals);
  const leaderProgressPercentage = Math.min(100, (activeReferrals / 10) * 100);

  const teamMemberColumns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => (
        <div className={`px-2 py-1 rounded-full text-xs inline-flex items-center ${
          row.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' : 
          'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400'
        }`}>
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </div>
      )
    },
    {
      header: "Join Date",
      accessorKey: "joinDate",
      cell: (row: any) => {
        try {
          return new Date(row.joinDate).toLocaleDateString();
        } catch (e) {
          return row.joinDate;
        }
      }
    },
    {
      header: "Last Active",
      accessorKey: "lastActive",
      cell: (row: any) => {
        if (!row.lastActive) return "N/A";
        try {
          return new Date(row.lastActive).toLocaleDateString();
        } catch (e) {
          return row.lastActive;
        }
      }
    },
    {
      header: "Days Active",
      accessorKey: "daysActive",
    },
    {
      header: "Monthly Gems",
      accessorKey: "monthlyEarning",
      cell: (row: any) => `${row.monthlyEarning} pts`
    }
  ];

  return (
    <div className="space-y-8">
      <div className="quiz-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium">{isTeamLeader ? "Invite Users to Your Team" : "Refer Friends"}</h3>
          <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">
            {localStorage.getItem(STORAGE_KEYS.USER_ROLE) === 'team_leader' ? "Main Team Leader" : 
             localStorage.getItem(STORAGE_KEYS.USER_ROLE) === 'junior_team_leader' ? "Junior Team Leader" : 
             "Regular Member"}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-secondary/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-full">
                {isTeamLeader ? <Shield className="h-5 w-5 text-primary" /> : <Award className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <h4 className="font-medium text-lg">{isTeamLeader ? "Team Leader Benefits" : "Referral Bonus"}</h4>
                {isTeamLeader ? (
                  <p className="text-muted-foreground mt-1">
                    As a Team Leader, you earn 500 bonus gems per month for each active referred player!
                    Your members must remain active for the full month for you to receive the bonus.
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-1">
                    Invite your friends to play CuizIN and earn 500 bonus gems for each friend who joins and plays actively for one day.
                  </p>
                )}
                
                {isTeamLeader && (
                  <div className="mt-4">
                    <Link to="/team-dashboard" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                      <BarChartIcon className="h-4 w-4" />
                      <span>View Team Dashboard</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isTeamLeader && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-100 dark:bg-blue-800/30 p-2 rounded-full">
                  <ArrowUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">Become a Team Leader</h4>
                  <p className="text-muted-foreground mt-1">
                    Refer 10 active friends to unlock Team Leader status and earn 500 bonus gems monthly from each active referred player!
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
      
      {isTeamLeader && (
        <div className="quiz-card">
          <h3 className="text-xl font-medium mb-6">Team Leader Dashboard</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground">Monthly Gems</h4>
              <p className="text-2xl font-bold mt-1">{monthlyEarnings} pts</p>
              <p className="text-xs text-muted-foreground mt-1">From {activeReferrals} active team members</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-muted-foreground">Total Team Gems</h4>
              <p className="text-2xl font-bold mt-1">{totalTeamEarnings} pts</p>
              <p className="text-xs text-muted-foreground mt-1">All-time gems from your team</p>
            </div>
          </div>
          
          <h4 className="text-lg font-medium mb-4">Your Team Members</h4>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Quick overview of your team</span>
            <Link to="/team-dashboard" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <BarChartIcon className="h-4 w-4" />
              <span>Full Team Dashboard</span>
            </Link>
          </div>
          
          {isTeamMembersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <DataTable
              columns={teamMemberColumns}
              data={teamMembers.slice(0, 10)}
              isLoading={isTeamMembersLoading}
            />
          )}
        </div>
      )}

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
              <div className="text-sm text-muted-foreground">Total Gems Earned</div>
              <div className="text-2xl font-bold">
                {referrals.reduce((sum, r) => sum + (r.status === 'active' ? 500 : 0), 0)} pts
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
    </div>
  );
};

export default ReferralSection;
