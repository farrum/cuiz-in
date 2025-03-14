
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const TeamPointsOverview: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [memberPerformance, setMemberPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadTeamData = async () => {
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
          setIsLoading(false);
          return;
        }

        // Extract all referee IDs
        const refereeIds = referralData.map(ref => ref.referee_id);

        // Get profiles for usernames
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', refereeIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setIsLoading(false);
          return;
        }

        // Get the date range for the last 14 days
        const endDate = new Date();
        const startDate = subDays(endDate, 13);
        
        // Generate array of dates
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        const formattedDates = dateRange.map(date => format(date, 'yyyy-MM-dd'));

        // Get daily points for the team over the last 14 days
        const { data: dailyPointsData, error: dailyPointsError } = await supabase
          .from('daily_points')
          .select('*')
          .in('user_id', refereeIds)
          .in('date', formattedDates);

        if (dailyPointsError) {
          console.error('Error fetching daily points:', dailyPointsError);
        }

        // Create daily chart data
        const dailyChartData = formattedDates.map(date => {
          const pointsForDate = dailyPointsData
            ?.filter(dp => dp.date === date)
            .reduce((sum, dp) => sum + (dp.points || 0), 0);
          
          return {
            date: format(new Date(date), 'MMM d'),
            points: pointsForDate || 0
          };
        });

        setDailyData(dailyChartData);

        // Get current month range
        const currentDate = new Date();
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);
        
        // Get the last 6 months
        const months = [];
        for (let i = 0; i < 6; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          months.push(format(date, 'yyyy-MM'));
        }
        
        // Get monthly points for the team
        const { data: monthlyPointsData, error: monthlyPointsError } = await supabase
          .from('monthly_points')
          .select('*')
          .in('user_id', refereeIds)
          .in('year_month', months);

        if (monthlyPointsError) {
          console.error('Error fetching monthly points:', monthlyPointsError);
        }

        // Create monthly chart data
        const monthlyChartData = months.map(month => {
          const pointsForMonth = monthlyPointsData
            ?.filter(mp => mp.year_month === month)
            .reduce((sum, mp) => sum + (mp.points || 0), 0);
          
          return {
            month: format(new Date(month + '-01'), 'MMM yyyy'),
            points: pointsForMonth || 0
          };
        }).reverse();

        setMonthlyData(monthlyChartData);

        // Create member performance data
        const memberData = profilesData.map(profile => {
          const currentMonthPoints = monthlyPointsData
            ?.filter(mp => mp.user_id === profile.id && mp.year_month === format(currentDate, 'yyyy-MM'))
            .reduce((sum, mp) => sum + (mp.points || 0), 0) || 0;
          
          return {
            name: profile.username || 'Anonymous',
            points: currentMonthPoints
          };
        }).sort((a, b) => b.points - a.points);

        setMemberPerformance(memberData);
      } catch (error) {
        console.error('Error loading team data:', error);
        toast({
          title: "Error",
          description: "Failed to load team statistics. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
  }, [user, toast]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Points</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Points</TabsTrigger>
          <TabsTrigger value="members">Member Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Daily Points</CardTitle>
              <CardDescription>Total points earned by your team over the last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : dailyData.length === 0 ? (
                <div className="w-full h-[300px] flex items-center justify-center border rounded-lg">
                  <p className="text-muted-foreground">No data available for this period</p>
                </div>
              ) : (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="points" stroke="#3b82f6" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Monthly Points</CardTitle>
              <CardDescription>Total points earned by your team over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="w-full h-[300px] flex items-center justify-center border rounded-lg">
                  <p className="text-muted-foreground">No data available for this period</p>
                </div>
              ) : (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="points" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Performance</CardTitle>
              <CardDescription>Current month's performance by team member</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : memberPerformance.length === 0 ? (
                <div className="w-full h-[300px] flex items-center justify-center border rounded-lg">
                  <p className="text-muted-foreground">No data available for team members</p>
                </div>
              ) : (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={memberPerformance} 
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Bar dataKey="points" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamPointsOverview;
