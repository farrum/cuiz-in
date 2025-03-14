
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, User, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  username: string;
  points: number;
  created_at: string;
  daily_points: number;
  monthly_points: number;
}

const TeamMembersList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalTeamPoints, setTotalTeamPoints] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadTeamMembers = async () => {
      try {
        setIsLoading(true);

        // Get referrals (team members) where current user is the referrer
        const { data: referralData, error: referralError } = await supabase
          .from('referrals')
          .select('referee_id')
          .eq('referrer_id', user.id);

        if (referralError) {
          console.error('Error fetching referrals:', referralError);
          toast({
            title: "Error loading team",
            description: referralError.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (!referralData || referralData.length === 0) {
          setTeamMembers([]);
          setIsLoading(false);
          return;
        }

        // Extract all referee IDs
        const refereeIds = referralData.map(ref => ref.referee_id);

        // Get profile info for all team members
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', refereeIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          toast({
            title: "Error loading team members",
            description: profilesError.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Get today's date and current month for filtering
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = `${today.slice(0, 4)}-${today.slice(5, 7)}`;

        // Get daily points for team members
        const { data: dailyPointsData, error: dailyPointsError } = await supabase
          .from('daily_points')
          .select('*')
          .in('user_id', refereeIds)
          .eq('date', today);

        if (dailyPointsError) {
          console.error('Error fetching daily points:', dailyPointsError);
        }

        // Get monthly points for team members
        const { data: monthlyPointsData, error: monthlyPointsError } = await supabase
          .from('monthly_points')
          .select('*')
          .in('user_id', refereeIds)
          .eq('year_month', currentMonth);

        if (monthlyPointsError) {
          console.error('Error fetching monthly points:', monthlyPointsError);
        }

        // Combine the data
        const members: TeamMember[] = profilesData.map(profile => {
          const dailyPointsRecord = dailyPointsData?.find(dp => dp.user_id === profile.id);
          const monthlyPointsRecord = monthlyPointsData?.find(mp => mp.user_id === profile.id);

          return {
            id: profile.id,
            username: profile.username || 'Anonymous User',
            points: profile.points || 0,
            created_at: profile.created_at || new Date().toISOString(),
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
        toast({
          title: "Error",
          description: "Failed to load team members. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamMembers();
  }, [user, toast]);

  // Filter members based on search term
  const filteredMembers = teamMembers.filter(member => 
    member.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold">Your Team Members</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search members..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{teamMembers.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Team Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalTeamPoints}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {filteredMembers.reduce((sum, member) => sum + member.daily_points, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : teamMembers.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <User className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p>You don't have any team members yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              When users join using your referral code, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Today's Points</TableHead>
                  <TableHead>Monthly Points</TableHead>
                  <TableHead>Total Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      No members match your search
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.username}</TableCell>
                      <TableCell>{format(new Date(member.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={member.daily_points > 0 ? "success" : "outline"}>
                          {member.daily_points}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.monthly_points > 50 ? "success" : "outline"}>
                          {member.monthly_points}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.points}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamMembersList;
