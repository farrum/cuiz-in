
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { 
  FileDownIcon, 
  ChevronDownIcon,
  Loader2,
  UsersIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface PlayerParticipation {
  id: string;
  user_id: string;
  username: string;
  challenge_id: string;
  challenge_title: string;
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  score: number;
  completion_status: string;
}

const DailyChallengesReport: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [playerParticipation, setPlayerParticipation] = useState<PlayerParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerDataLoading, setPlayerDataLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
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
      
      // If there are challenges, set the first one as selected
      if (challengesWithStats && challengesWithStats.length > 0) {
        setSelectedChallenge(challengesWithStats[0].id);
        fetchPlayerParticipationData(challengesWithStats[0].id);
      }
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

  const fetchPlayerParticipationData = async (challengeId: string) => {
    setPlayerDataLoading(true);
    try {
      // Get the selected challenge data
      const { data: challengeData, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();
        
      if (challengeError) throw challengeError;
      
      // Get all user progress for this challenge
      const { data: progressData, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('challenge_id', challengeId);
        
      if (progressError) throw progressError;
      
      // Get usernames from profiles
      const userIds = progressData?.map(progress => progress.user_id) || [];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      // Create a mapping of user IDs to usernames
      const usernameMap: Record<string, string> = {};
      profilesData?.forEach(profile => {
        usernameMap[profile.id] = profile.username;
      });

      // Process player participation data
      const playerData = progressData?.map(progress => {
        const totalQuestions = challengeData.num_questions;
        // For this example, we'll estimate attempted questions from the score
        // In a real app, you might have more detailed tracking
        const attempted = Math.ceil(progress.score / 10); // Assuming 10 points per question
        const correct = Math.floor(progress.score / 10);
        
        return {
          id: progress.id,
          user_id: progress.user_id,
          username: usernameMap[progress.user_id] || 'Unknown User',
          challenge_id: challengeId,
          challenge_title: challengeData.title,
          total_questions: totalQuestions,
          attempted_questions: Math.min(attempted, totalQuestions),
          correct_answers: Math.min(correct, totalQuestions),
          score: progress.score,
          completion_status: progress.completed ? 'Completed' : 'In Progress'
        };
      });
      
      setPlayerParticipation(playerData || []);
    } catch (error) {
      console.error('Error fetching player participation data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch player participation data",
        variant: "destructive"
      });
    } finally {
      setPlayerDataLoading(false);
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

  const playerColumns = [
    { header: 'Username', accessorKey: 'username' },
    { header: 'Total Questions', accessorKey: 'total_questions' },
    { header: 'Attempted', accessorKey: 'attempted_questions' },
    { header: 'Correct', accessorKey: 'correct_answers' },
    { header: 'Score', accessorKey: 'score' },
    { header: 'Status', accessorKey: 'completion_status' }
  ];

  const handleChallengeSelect = (challengeId: string) => {
    setSelectedChallenge(challengeId);
    fetchPlayerParticipationData(challengeId);
  };

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
              <DropdownMenuItem onClick={() => downloadCSV(playerParticipation, 'player-participation-report')}>
                Export Player Participation
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
      
      <Tabs defaultValue="challenges">
        <TabsList>
          <TabsTrigger value="challenges">Challenge Performance</TabsTrigger>
          <TabsTrigger value="players" className="flex items-center">
            <UsersIcon className="h-4 w-4 mr-2" />
            Player Participation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="challenges">
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
        </TabsContent>
        
        <TabsContent value="players">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle>Player Participation</CardTitle>
                  <CardDescription>
                    Player performance for selected challenge
                  </CardDescription>
                </div>
                
                <div className="w-full md:w-64">
                  <select 
                    className="w-full px-3 py-2 border rounded-md"
                    value={selectedChallenge || ''}
                    onChange={(e) => handleChallengeSelect(e.target.value)}
                    disabled={loading || challenges.length === 0}
                  >
                    {challenges.map(challenge => (
                      <option key={challenge.id} value={challenge.id}>
                        {challenge.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={playerColumns} 
                data={playerParticipation}
                isLoading={playerDataLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyChallengesReport;
