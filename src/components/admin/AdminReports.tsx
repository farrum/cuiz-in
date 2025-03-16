import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { 
  ChevronDownIcon, 
  FileDownIcon, 
  BarChart3, 
  Users, 
  Calendar,
  PlayCircle, 
  LogIn,
  Trophy
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

// Function to export data to CSV
const downloadCSV = (data: any[], filename: string) => {
  const csvContent = data.reduce((csv, row) => {
    const rowContent = Object.values(row).join(',');
    return `${csv}${rowContent}\n`;
  }, Object.keys(data[0]).join(',') + '\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Daily Login Reports Tab
const DailyLoginReports = () => {
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const fetchLoginData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('login_logs')
        .select('*')
        .order('login_time', { ascending: false });
        
      if (error) throw error;
      
      const loginData = data?.map(log => ({
        id: log.id,
        username: log.username,
        date: log.login_time ? new Date(log.login_time).toLocaleDateString() : 'Unknown',
        time: log.login_time ? new Date(log.login_time).toLocaleTimeString() : 'Unknown',
        device: log.device || 'Unknown',
        ip_address: log.ip_address || 'Unknown',
        successful: log.successful ? 'Yes' : 'No'
      })) || [];
      
      setLogins(loginData);
    } catch (error) {
      console.error('Error fetching login data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch login data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginData();
  }, []);

  const filteredLogins = logins.filter(login => {
    const loginDate = new Date(login.date);
    return (
      (!dateRange?.from || loginDate >= dateRange.from) &&
      (!dateRange?.to || loginDate <= dateRange.to)
    );
  });

  const aggregateByDate = () => {
    const aggregated: Record<string, number> = {};
    
    filteredLogins.forEach(login => {
      if (aggregated[login.date]) {
        aggregated[login.date]++;
      } else {
        aggregated[login.date] = 1;
      }
    });
    
    return Object.entries(aggregated).map(([date, count]) => ({
      date,
      count
    }));
  };

  const loginsByDate = aggregateByDate();

  const columns = [
    { header: 'Date', accessorKey: 'date' },
    { header: 'Time', accessorKey: 'time' },
    { header: 'Username', accessorKey: 'username' },
    { header: 'Device', accessorKey: 'device' },
    { header: 'IP Address', accessorKey: 'ip_address' },
    { header: 'Successful', accessorKey: 'successful' }
  ];

  const summaryColumns = [
    { header: 'Date', accessorKey: 'date' },
    { header: 'Login Count', accessorKey: 'count' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Login Reports</h2>
        
        <div className="flex items-center gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range)}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDownIcon className="mr-2 h-4 w-4" />
                Export
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => downloadCSV(filteredLogins, 'login-reports-detailed')}>
                Export Detailed Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadCSV(loginsByDate, 'login-reports-summary')}>
                Export Summary Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={fetchLoginData}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Logins</CardTitle>
            <CardDescription>All time login count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{logins.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Today's Logins</CardTitle>
            <CardDescription>Logins in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {logins.filter(login => login.date === new Date().toLocaleDateString()).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Unique Users</CardTitle>
            <CardDescription>Distinct users logged in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(logins.map(login => login.username)).size}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="detailed">
        <TabsList>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Login Details</CardTitle>
              <CardDescription>
                Showing {filteredLogins.length} login records for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <DataTable 
                  columns={columns} 
                  data={filteredLogins}
                  isLoading={loading}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Login Summary by Date</CardTitle>
              <CardDescription>
                Aggregated login counts by date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <DataTable 
                  columns={summaryColumns} 
                  data={loginsByDate}
                  isLoading={loading}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Daily Play Reports Tab
const DailyPlayReports = () => {
  const [plays, setPlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const fetchPlayData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select('*, question_id(question)')
        .order('answered_at', { ascending: false });
        
      if (error) throw error;
      
      const playData = data?.map(play => ({
        id: play.id,
        username: play.user_id,
        date: play.answered_at ? new Date(play.answered_at).toLocaleDateString() : 'Unknown',
        time: play.answered_at ? new Date(play.answered_at).toLocaleTimeString() : 'Unknown',
        question: play.question_id?.question || 'Unknown',
        answer: play.selected_answer,
        correct: play.correct ? 'Yes' : 'No',
        points: play.points_earned || 0
      })) || [];
      
      setPlays(playData);
    } catch (error) {
      console.error('Error fetching play data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch play data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayData();
  }, []);

  const filteredPlays = plays.filter(play => {
    const playDate = new Date(play.date);
    return (
      (!dateRange?.from || playDate >= dateRange.from) &&
      (!dateRange?.to || playDate <= dateRange.to)
    );
  });

  const aggregateByDate = () => {
    const aggregated: Record<string, {count: number, correctCount: number, totalPoints: number}> = {};
    
    filteredPlays.forEach(play => {
      if (aggregated[play.date]) {
        aggregated[play.date].count++;
        if (play.correct === 'Yes') aggregated[play.date].correctCount++;
        aggregated[play.date].totalPoints += play.points;
      } else {
        aggregated[play.date] = { 
          count: 1, 
          correctCount: play.correct === 'Yes' ? 1 : 0,
          totalPoints: play.points
        };
      }
    });
    
    return Object.entries(aggregated).map(([date, stats]) => ({
      date,
      count: stats.count,
      correctCount: stats.correctCount,
      accuracy: `${((stats.correctCount / stats.count) * 100).toFixed(1)}%`,
      totalPoints: stats.totalPoints
    }));
  };

  const playsByDate = aggregateByDate();

  const columns = [
    { header: 'Date', accessorKey: 'date' },
    { header: 'Time', accessorKey: 'time' },
    { header: 'User ID', accessorKey: 'username' },
    { header: 'Question', accessorKey: 'question' },
    { header: 'Answer', accessorKey: 'answer' },
    { header: 'Correct', accessorKey: 'correct' },
    { header: 'Points', accessorKey: 'points' }
  ];

  const summaryColumns = [
    { header: 'Date', accessorKey: 'date' },
    { header: 'Total Plays', accessorKey: 'count' },
    { header: 'Correct Answers', accessorKey: 'correctCount' },
    { header: 'Accuracy', accessorKey: 'accuracy' },
    { header: 'Total Points', accessorKey: 'totalPoints' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Play Reports</h2>
        
        <div className="flex items-center gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range)}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDownIcon className="mr-2 h-4 w-4" />
                Export
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => downloadCSV(filteredPlays, 'play-reports-detailed')}>
                Export Detailed Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadCSV(playsByDate, 'play-reports-summary')}>
                Export Summary Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={fetchPlayData}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Plays</CardTitle>
            <CardDescription>All time play count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{plays.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Today's Plays</CardTitle>
            <CardDescription>Plays in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {plays.filter(play => play.date === new Date().toLocaleDateString()).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Average Accuracy</CardTitle>
            <CardDescription>Correct answers percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {plays.length ? 
                `${((plays.filter(play => play.correct === 'Yes').length / plays.length) * 100).toFixed(1)}%` : 
                '0%'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="detailed">
        <TabsList>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Play Details</CardTitle>
              <CardDescription>
                Showing {filteredPlays.length} play records for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <DataTable 
                  columns={columns} 
                  data={filteredPlays}
                  isLoading={loading}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Play Summary by Date</CardTitle>
              <CardDescription>
                Aggregated play statistics by date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <DataTable 
                  columns={summaryColumns} 
                  data={playsByDate}
                  isLoading={loading}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Ad Views Reports Tab
const AdViewsReports = () => {
  const [adViews, setAdViews] = useState<any[]>([]);
  const [adSlots, setAdSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdData = async () => {
    setLoading(true);
    try {
      const { data: slotsData, error: slotsError } = await supabase
        .from('ad_slots')
        .select('*');
        
      if (slotsError) throw slotsError;
      
      setAdSlots(slotsData || []);
      
      const mockData = slotsData?.map(slot => {
        const viewsToday = Math.floor(Math.random() * 100) + 20;
        const viewsYesterday = Math.floor(Math.random() * 100) + 10;
        const clicksToday = Math.floor(viewsToday * (Math.random() * 0.2));
        
        return {
          id: slot.id,
          name: slot.name,
          position: slot.position,
          active: slot.active ? 'Yes' : 'No',
          viewsToday,
          viewsYesterday,
          clicksToday,
          ctr: `${((clicksToday / viewsToday) * 100).toFixed(1)}%`
        };
      }) || [];
      
      setAdViews(mockData);
      
      toast({
        title: "Info",
        description: "This is demo data. Set up ad tracking for real data.",
      });
    } catch (error) {
      console.error('Error fetching ad data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ad data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdData();
  }, []);

  const columns = [
    { header: 'Ad Name', accessorKey: 'name' },
    { header: 'Position', accessorKey: 'position' },
    { header: 'Status', accessorKey: 'active' },
    { header: 'Views Today', accessorKey: 'viewsToday' },
    { header: 'Views Yesterday', accessorKey: 'viewsYesterday' },
    { header: 'Clicks Today', accessorKey: 'clicksToday' },
    { header: 'CTR', accessorKey: 'ctr' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ad Views Reports</h2>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => downloadCSV(adViews, 'ad-views-reports')}
          >
            <FileDownIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button onClick={fetchAdData}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Ad Slots</CardTitle>
            <CardDescription>Number of configured ad positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{adSlots.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Ads</CardTitle>
            <CardDescription>Currently active ad slots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {adSlots.filter(slot => slot.active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Views Today</CardTitle>
            <CardDescription>Cumulative ad impressions today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {adViews.reduce((sum, ad) => sum + ad.viewsToday, 0)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ad Performance Details</CardTitle>
          <CardDescription>
            Performance metrics for all ad slots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={adViews}
            isLoading={loading}
          />
        </CardContent>
      </Card>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            Enable Detailed Ad Tracking
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Ad Tracking</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              To enable detailed ad tracking, you need to implement ad view and click tracking in your application.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Create an ad_views table in your database</li>
              <li>Track impressions when ads are shown</li>
              <li>Track clicks when users interact with ads</li>
              <li>Implement reporting functionality based on this data</li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Top Performers Report
const TopPerformersReport = () => {
  const [dailyPerformers, setDailyPerformers] = useState<any[]>([]);
  const [monthlyPerformers, setMonthlyPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformersData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_points')
        .select('user_id, points')
        .eq('date', today)
        .order('points', { ascending: false })
        .limit(10);
        
      if (dailyError) throw dailyError;
      
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_points')
        .select('user_id, points')
        .eq('month', currentMonth)
        .order('points', { ascending: false })
        .limit(10);
        
      if (monthlyError) throw monthlyError;
      
      const userIds = [...new Set([
        ...(dailyData?.map(item => item.user_id) || []),
        ...(monthlyData?.map(item => item.user_id) || [])
      ])];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      const profileMap: Record<string, string> = {};
      profiles?.forEach(profile => {
        profileMap[profile.id] = profile.username;
      });
      
      const dailyPerformersWithRank = dailyData?.map((item, index) => ({
        rank: index + 1,
        userId: item.user_id,
        username: profileMap[item.user_id] || 'Unknown User',
        points: Number(item.points).toFixed(1),
        type: 'daily'
      })) || [];
      
      const monthlyPerformersWithRank = monthlyData?.map((item, index) => ({
        rank: index + 1,
        userId: item.user_id,
        username: profileMap[item.user_id] || 'Unknown User',
        points: Number(item.points).toFixed(1),
        type: 'monthly'
      })) || [];
      
      setDailyPerformers(dailyPerformersWithRank);
      setMonthlyPerformers(monthlyPerformersWithRank);
    } catch (error) {
      console.error('Error fetching top performers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch top performers data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformersData();
  }, []);

  const dailyColumns = [
    { header: 'Rank', accessorKey: 'rank' },
    { header: 'Username', accessorKey: 'username' },
    { header: 'Points Today', accessorKey: 'points' }
  ];

  const monthlyColumns = [
    { header: 'Rank', accessorKey: 'rank' },
    { header: 'Username', accessorKey: 'username' },
    { header: 'Points This Month', accessorKey: 'points' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Top Performers</h2>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDownIcon className="mr-2 h-4 w-4" />
                Export
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => downloadCSV(dailyPerformers, 'daily-top-performers')}>
                Export Daily Top Performers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadCSV(monthlyPerformers, 'monthly-top-performers')}>
                Export Monthly Top Performers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={fetchPerformersData}>
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Top Performers</CardTitle>
            <CardDescription>
              Top point earners for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={dailyColumns} 
              data={dailyPerformers}
              isLoading={loading}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Top Performers</CardTitle>
            <CardDescription>
              Top point earners for this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={monthlyColumns} 
              data={monthlyPerformers}
              isLoading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main Reports Component
const AdminReports = () => {
  return (
    <Tabs defaultValue="top-performers">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            View and analyze reports for your quiz application
          </p>
        </div>
      </div>
      
      <TabsList className="mb-4">
        <TabsTrigger value="top-performers" className="flex items-center">
          <Trophy className="w-4 h-4 mr-2" />
          Top Performers
        </TabsTrigger>
        <TabsTrigger value="login-reports" className="flex items-center">
          <LogIn className="w-4 h-4 mr-2" />
          Login Reports
        </TabsTrigger>
        <TabsTrigger value="play-reports" className="flex items-center">
          <PlayCircle className="w-4 h-4 mr-2" />
          Play Reports
        </TabsTrigger>
        <TabsTrigger value="ad-reports" className="flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Ad Reports
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="top-performers">
        <TopPerformersReport />
      </TabsContent>
      
      <TabsContent value="login-reports">
        <DailyLoginReports />
      </TabsContent>
      
      <TabsContent value="play-reports">
        <DailyPlayReports />
      </TabsContent>
      
      <TabsContent value="ad-reports">
        <AdViewsReports />
      </TabsContent>
    </Tabs>
  );
};

export default AdminReports;

