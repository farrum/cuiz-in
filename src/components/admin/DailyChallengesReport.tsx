
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
      
      // For each challenge, calculate metrics
      const challengesWithStats = await Promise.all(challengesData?.map(async challenge => {
        // Get user challenge progress for this challenge
        const { data: progressData, error: progressError } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('challenge_id', challenge.id);
          
        if (progressError) throw progressError;
        
        const participantCount = progressData?.length || 0;
        
        // Get quiz answers to calculate actual attempts and correct answers
        const { data: answersData, error: answersError } = await supabase
          .from('quiz_answers')
          .select('user_id, question_id, correct')
          .in('question_id', challenge.question_ids || []);
          
        if (answersError) throw answersError;
        
        // Process data for analytics
        const totalQuestionsAvailable = participantCount * challenge.num_questions;
        
        // Count attempted questions from answers - group by user to count unique question attempts
        let totalAttemptedQuestions = 0;
        let totalCorrectAnswers = 0;
        
        if (answersData && answersData.length > 0) {
          // Group answers by user to count unique question attempts
          const userAttempts = new Map();
          
          answersData.forEach(answer => {
            const key = `${answer.user_id}-${answer.question_id}`;
            if (!userAttempts.has(key)) {
              userAttempts.set(key, true);
              totalAttemptedQuestions++;
              
              if (answer.correct) {
                totalCorrectAnswers++;
              }
            }
          });
        }
        
        // Calculate completion rate - percentage of total questions attempted out of total available
        const completionRate = totalQuestionsAvailable > 0 
          ? ((totalAttemptedQuestions / totalQuestionsAvailable) * 100).toFixed(1) + '%'
          : '0%';
        
        // Calculate average score from progress data
        let totalScore = 0;
        progressData?.forEach(progress => {
          totalScore += progress.score || 0;
        });
        
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
      }) || []);
      
      setChallenges(challengesWithStats || []);
      
      // If there are challenges, set the first one as selected
      if (challengesWithStats && challengesWithStats.length > 0) {
        setSelectedChallenge(challengesWithStats[0].id);
        fetchPlayerParticipationData(challengesWithStats[0].id);
      } else {
        setPlayerParticipation([]);
        setPlayerDataLoading(false);
      }
    } catch (error) {
      console.error('Error fetching challenges data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch challenges data",
        variant: "destructive"
      });
      setPlayerParticipation([]);
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
      
      if (!progressData || progressData.length === 0) {
        setPlayerParticipation([]);
        setPlayerDataLoading(false);
        return;
      }
      
      // Get usernames from profiles
      const userIds = progressData.map(progress => progress.user_id);
      
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

      // Fetch all quiz answers for this challenge to accurately count attempts and correct answers
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .in('user_id', userIds)
        .in('question_id', challengeData.question_ids)
        .order('answered_at', { ascending: true });
        
      if (answersError) throw answersError;
      
      // Create data structure to track user attempts and correct answers
      const userStats: Record<string, {
        attempted: Set<string>,
        correct: Set<string>
      }> = {};
      
      // Initialize stats for each user
      userIds.forEach(userId => {
        userStats[userId] = {
          attempted: new Set(),
          correct: new Set()
        };
      });
      
      // Process all answers to get accurate counts
      if (answersData) {
        answersData.forEach(answer => {
          if (userStats[answer.user_id]) {
            // Track attempted questions (unique question IDs)
            userStats[answer.user_id].attempted.add(answer.question_id);
            
            // Track correct answers
            if (answer.correct) {
              userStats[answer.user_id].correct.add(answer.question_id);
            }
          }
        });
      }
      
      // Build player participation data
      const playerData = progressData.map(progress => {
        const stats = userStats[progress.user_id] || { 
          attempted: new Set(), 
          correct: new Set()
        };
        
        // Calculate attempted and correct counts
        const attemptedCount = stats.attempted.size;
        const correctCount = stats.correct.size;
        
        return {
          id: progress.id,
          user_id: progress.user_id,
          username: usernameMap[progress.user_id] || 'Unknown User',
          challenge_id: challengeId,
          challenge_title: challengeData.title,
          total_questions: challengeData.num_questions,
          attempted_questions: attemptedCount,
          correct_answers: correctCount,
          score: progress.score || 0,
          completion_status: progress.completed ? 'Completed' : 'In Progress'
        };
      });
      
      setPlayerParticipation(playerData);
    } catch (error) {
      console.error('Error fetching player participation data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch player participation data",
        variant: "destructive"
      });
      setPlayerParticipation([]);
    } finally {
      setPlayerDataLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengesData();
  }, []);

  const filteredChallenges = challenges.filter(challenge => {
    if (!dateRange?.from || !dateRange?.to) return true;
    
    const challengeDate = new Date(challenge.start_date);
    return (
      challengeDate >= dateRange.from &&
      challengeDate <= dateRange.to
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
