
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { 
  FileDownIcon, 
  ChevronDownIcon,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { format } from "date-fns";
import { downloadCSV } from '@/utils/excelUtils';

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  num_questions: number;
  total_participants: number;
  avg_score: number;
  completion_rate: string;
}

const DailyChallengesReport: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const fetchChallengesData = async () => {
    setLoading(true);
    try {
      // Fetch challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*')
        .order('start_date', { ascending: false });
        
      if (challengesError) throw challengesError;
      
      // Fetch user challenge progress for stats
      const { data: progressData, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, score, completed');
        
      if (progressError) throw progressError;
      
      // Process and combine the data
      const challengesWithStats = challengesData?.map(challenge => {
        const relatedProgress = progressData?.filter(progress => progress.challenge_id === challenge.id) || [];
        const participantCount = relatedProgress.length;
        const completedCount = relatedProgress.filter(p => p.completed).length;
        const completionRate = participantCount > 0 
          ? `${((completedCount / participantCount) * 100).toFixed(1)}%` 
          : '0%';
        const totalScore = relatedProgress.reduce((sum, p) => sum + (p.score || 0), 0);
        const avgScore = participantCount > 0 
          ? parseFloat((totalScore / participantCount).toFixed(1)) 
          : 0;
        
        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description || '',
          start_date: new Date(challenge.start_date).toLocaleDateString(),
          end_date: new Date(challenge.end_date).toLocaleDateString(),
          num_questions: challenge.num_questions,
          total_participants: participantCount,
          avg_score: avgScore,
          completion_rate: completionRate
        };
      });
      
      setChallenges(challengesWithStats || []);
    } catch (error) {
      console.error('Error fetching challenges data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch challenges data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengesData();
  }, []);

  const filteredChallenges = challenges.filter(challenge => {
    const challengeDate = new Date(challenge.start_date);
    return (
      (!dateRange?.from || challengeDate >= dateRange.from) &&
      (!dateRange?.to || challengeDate <= dateRange.to)
    );
  });

  const columns = [
    { header: 'Title', accessorKey: 'title' },
    { header: 'Start Date', accessorKey: 'start_date' },
    { header: 'End Date', accessorKey: 'end_date' },
    { header: 'Questions', accessorKey: 'num_questions' },
    { header: 'Participants', accessorKey: 'total_participants' },
    { header: 'Avg Score', accessorKey: 'avg_score' },
    { header: 'Completion Rate', accessorKey: 'completion_rate' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Challenges Reports</h2>
        
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
              <DropdownMenuItem onClick={() => downloadCSV(filteredChallenges, 'daily-challenges-report')}>
                Export Challenges Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={fetchChallengesData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Challenges</CardTitle>
            <CardDescription>Number of challenges created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{challenges.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Challenges</CardTitle>
            <CardDescription>Currently active challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {challenges.filter(c => {
                const now = new Date();
                const start = new Date(c.start_date);
                const end = new Date(c.end_date);
                return start <= now && end >= now;
              }).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Avg Participation</CardTitle>
            <CardDescription>Average participants per challenge</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {challenges.length 
                ? (challenges.reduce((sum, c) => sum + c.total_participants, 0) / challenges.length).toFixed(1) 
                : '0'}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Challenges Performance</CardTitle>
          <CardDescription>
            Details of all daily challenges and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={filteredChallenges}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyChallengesReport;
