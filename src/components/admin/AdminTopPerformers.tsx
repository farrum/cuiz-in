
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
import { Award, Calendar, BarChart, Trash2, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TopPerformer {
  username: string;
  points: number;
  rank: number;
}

const AdminTopPerformers: React.FC = () => {
  const [dailyPerformers, setDailyPerformers] = useState<TopPerformer[]>([]);
  const [monthlyPerformers, setMonthlyPerformers] = useState<TopPerformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isListening } = useRealtimeUpdates('quiz_answers', 'INSERT');
  const { toast } = useToast();

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
      toast({
        title: "Failed to fetch top performers",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Fetch data initially and on realtime updates
  useEffect(() => {
    fetchTopPerformers();
  }, [isListening]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTopPerformers();
  };
  
  const handleExportCSV = (type: 'daily' | 'monthly') => {
    const performers = type === 'daily' ? dailyPerformers : monthlyPerformers;
    const csv = [
      ['Rank', 'Username', 'Points'],
      ...performers.map(p => [p.rank, p.username, p.points])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-top-performers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Export successful",
      description: `${type === 'daily' ? 'Daily' : 'Monthly'} top performers exported to CSV`,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Award className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>Top Performers</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExportCSV('daily')}
                disabled={dailyPerformers.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
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
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExportCSV('monthly')}
                disabled={monthlyPerformers.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
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
