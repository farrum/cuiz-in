
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, RefreshCw, Calendar } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface TopPerformer {
  userId: string;
  username: string;
  gems: number;
  rank: number;
}

const AdminTopPerformers: React.FC = () => {
  const [dailyTopUsers, setDailyTopUsers] = useState<TopPerformer[]>([]);
  const [monthlyTopUsers, setMonthlyTopUsers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('daily');
  const { toast } = useToast();

  useEffect(() => {
    fetchTopPerformers();
  }, []);

  const fetchTopPerformers = async () => {
    setLoading(true);
    console.log("Fetching top performers...");

    try {
      const adminUserId = localStorage.getItem('quiz_app_user_id');
      // Fetch daily performers
      const { data: dailyData, error: dailyError } = await supabase.functions.invoke('admin-get-reports', {
        body: { 
          reportType: 'daily-top-performers',
          adminUserId
        }
      });

      if (dailyError) throw dailyError;
      
      // Fetch monthly performers
      const { data: monthlyData, error: monthlyError } = await supabase.functions.invoke('admin-get-reports', {
        body: { 
          reportType: 'monthly-top-performers',
          adminUserId
        }
      });

      if (monthlyError) throw monthlyError;

      console.log("Daily performers:", dailyData?.performers);
      console.log("Monthly performers:", monthlyData?.performers);
      
      setDailyTopUsers(dailyData?.performers || []);
      setMonthlyTopUsers(monthlyData?.performers || []);
    } catch (error) {
      console.error('Error in fetchTopPerformers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch top performers data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTopPerformers();
    toast({
      title: "Refreshing",
      description: "Updating top performers data"
    });
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 inline-flex items-center justify-center text-muted-foreground">{position}</span>;
    }
  };

  const getPositionClass = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-50 dark:bg-yellow-950/30";
      case 2:
        return "bg-gray-50 dark:bg-gray-900/30";
      case 3:
        return "bg-amber-50 dark:bg-amber-950/30";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <CardTitle>Top Performers</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <CardDescription>See who's leading in daily and monthly rankings</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="daily">
              <Calendar className="h-4 w-4 mr-2" />
              Daily Leaders
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Calendar className="h-4 w-4 mr-2" />
              Monthly Leaders
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-0">
            {loading ? (
              <div className="py-8 text-center">
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-secondary rounded"></div>
                  <div className="h-10 bg-secondary rounded"></div>
                  <div className="h-10 bg-secondary rounded"></div>
                </div>
              </div>
            ) : dailyTopUsers.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <div className="bg-muted/50 p-2 text-sm text-muted-foreground">
                  Today's Top Players
                </div>
                <div className="divide-y">
                  {dailyTopUsers.map((user) => (
                    <div
                      key={user.userId}
                      className={`flex items-center justify-between p-3 ${getPositionClass(user.rank)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          {getPositionIcon(user.rank)}
                        </div>
                        <div className="font-medium">{user.username}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.rank <= 3 ? "default" : "secondary"}>
                          {user.gems.toFixed(1)} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No daily scores recorded yet
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-0">
            {loading ? (
              <div className="py-8 text-center">
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-secondary rounded"></div>
                  <div className="h-10 bg-secondary rounded"></div>
                  <div className="h-10 bg-secondary rounded"></div>
                </div>
              </div>
            ) : monthlyTopUsers.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <div className="bg-muted/50 p-2 text-sm text-muted-foreground">
                  This Month's Top Players
                </div>
                <div className="divide-y">
                  {monthlyTopUsers.map((user) => (
                    <div
                      key={user.userId}
                      className={`flex items-center justify-between p-3 ${getPositionClass(user.rank)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          {getPositionIcon(user.rank)}
                        </div>
                        <div className="font-medium">{user.username}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.rank <= 3 ? "default" : "secondary"}>
                          {user.gems.toFixed(1)} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No monthly scores recorded yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminTopPerformers;
