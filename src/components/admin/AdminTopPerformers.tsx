
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Award, Calendar, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface TopPerformer {
  username: string;
  points: number;
  rank: number;
}

const AdminTopPerformers: React.FC = () => {
  const [dailyPerformers, setDailyPerformers] = useState<TopPerformer[]>([]);
  const [monthlyPerformers, setMonthlyPerformers] = useState<TopPerformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isListening } = useRealtimeUpdates('quiz_answers', 'INSERT');

  // Function to fetch top performers
  const fetchTopPerformers = async () => {
    try {
      setIsLoading(true);
      
      // Get today's date
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      
      // Fetch daily top performers
      const { data: dailyData, error: dailyError } = await supabase
        .from('quiz_answers')
        .select(`
          user_id,
          points_earned
        `)
        .gte('answered_at', startOfDay);
        
      if (dailyError) throw dailyError;
      
      // Fetch monthly top performers
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('quiz_answers')
        .select(`
          user_id,
          points_earned
        `)
        .gte('answered_at', startOfMonth);
        
      if (monthlyError) throw monthlyError;
      
      // Process daily data
      const dailyUserPoints = dailyData.reduce((acc: Record<string, number>, item) => {
        if (!acc[item.user_id]) acc[item.user_id] = 0;
        acc[item.user_id] += item.points_earned || 0;
        return acc;
      }, {});
      
      // Process monthly data
      const monthlyUserPoints = monthlyData.reduce((acc: Record<string, number>, item) => {
        if (!acc[item.user_id]) acc[item.user_id] = 0;
        acc[item.user_id] += item.points_earned || 0;
        return acc;
      }, {});
      
      // Fetch user profiles for names
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, username');
      if (profilesError) throw profilesError;
      
      const profileMap = profiles.reduce((acc: Record<string, string>, profile) => {
        acc[profile.id] = profile.username;
        return acc;
      }, {});
      
      // Convert to array, sort, and add rank
      const dailyArray = Object.entries(dailyUserPoints)
        .map(([user_id, points]) => ({
          username: profileMap[user_id] || 'Unknown User',
          points,
          rank: 0
        }))
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({ ...user, rank: index + 1 }))
        .slice(0, 10);
        
      const monthlyArray = Object.entries(monthlyUserPoints)
        .map(([user_id, points]) => ({
          username: profileMap[user_id] || 'Unknown User',
          points,
          rank: 0
        }))
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({ ...user, rank: index + 1 }))
        .slice(0, 10);
      
      setDailyPerformers(dailyArray);
      setMonthlyPerformers(monthlyArray);
    } catch (error) {
      console.error('Error fetching top performers:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data initially and on realtime updates
  useEffect(() => {
    fetchTopPerformers();
  }, [isListening]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="mr-2 h-5 w-5 text-primary" />
          Top Performers
        </CardTitle>
        <CardDescription>
          View daily and monthly top quiz players based on points earned
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center">
              <BarChart className="mr-2 h-4 w-4" />
              Monthly
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading daily top performers...</p>
              </div>
            ) : dailyPerformers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quiz activity recorded today
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyPerformers.map((performer) => (
                    <TableRow key={performer.username + performer.rank}>
                      <TableCell className="font-medium">
                        {performer.rank <= 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                            {performer.rank}
                          </span>
                        ) : (
                          performer.rank
                        )}
                      </TableCell>
                      <TableCell>{performer.username}</TableCell>
                      <TableCell className="text-right">{performer.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="monthly" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading monthly top performers...</p>
              </div>
            ) : monthlyPerformers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quiz activity recorded this month
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyPerformers.map((performer) => (
                    <TableRow key={performer.username + performer.rank}>
                      <TableCell className="font-medium">
                        {performer.rank <= 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                            {performer.rank}
                          </span>
                        ) : (
                          performer.rank
                        )}
                      </TableCell>
                      <TableCell>{performer.username}</TableCell>
                      <TableCell className="text-right">{performer.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminTopPerformers;
