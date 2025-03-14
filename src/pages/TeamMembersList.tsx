
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Users, UserCheck, Search, Calendar, BarChart3, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface TeamMember {
  id: string;
  username: string;
  points: number;
  created_at: string;
  daily_points: number;
  monthly_points: number;
}

const TeamMembersList: React.FC = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalTeamPoints, setTotalTeamPoints] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadTeamMembers = async () => {
      setIsLoading(true);
      try {
        // Get referrals where current user is the referrer
        const { data: referralData, error: referralError } = await supabase
          .from('referrals')
          .select('referee_id')
          .eq('referrer_id', user.id);

        if (referralError) throw referralError;

        if (!referralData || referralData.length === 0) {
          setTeamMembers([]);
          setIsLoading(false);
          return;
        }

        // Get all referee IDs
        const refereeIds = referralData.map(ref => ref.referee_id);

        // Get profile data for all team members
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', refereeIds);

        if (profilesError) throw profilesError;

        // Get today's date and current month for filtering
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '_');

        // Get daily points for team members
        const { data: dailyPointsData, error: dailyPointsError } = await supabase
          .from('daily_points')
          .select('user_id, points')
          .in('user_id', refereeIds)
          .eq('date', today);

        if (dailyPointsError) throw dailyPointsError;

        // Get monthly points for team members
        const { data: monthlyPointsData, error: monthlyPointsError } = await supabase
          .from('monthly_points')
          .select('user_id, points')
          .in('user_id', refereeIds)
          .eq('year_month', currentMonth);

        if (monthlyPointsError) throw monthlyPointsError;

        // Combine the data
        const members: TeamMember[] = profilesData.map(profile => {
          const dailyPointsRecord = dailyPointsData?.find(dp => dp.user_id === profile.id);
          const monthlyPointsRecord = monthlyPointsData?.find(mp => mp.user_id === profile.id);

          return {
            id: profile.id,
            username: profile.username,
            points: profile.points || 0,
            created_at: profile.created_at,
            daily_points: dailyPointsRecord?.points || 0,
            monthly_points: monthlyPointsRecord?.points || 0
          };
        });

        setTeamMembers(members);
        
        // Calculate total team points
        const total = members.reduce((sum, member) => sum + member.points, 0);
        setTotalTeamPoints(total);
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamMembers();
  }, [user]);

  // Filter members based on search term
  const filteredMembers = teamMembers.filter(member => 
    member.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Team Members</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search members..."
              className="w-64 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Team Size</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">Total team members</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeamPoints}</div>
              <p className="text-xs text-muted-foreground">Combined team points</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Daily Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.reduce((sum, member) => sum + member.daily_points, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Points earned today</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>You don't have any team members yet. Share your referral link to build your team.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Total Points</TableHead>
                      <TableHead>Today's Points</TableHead>
                      <TableHead>Monthly Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(member.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>{member.points}</TableCell>
                        <TableCell>{member.daily_points}</TableCell>
                        <TableCell>{member.monthly_points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TeamMembersList;
