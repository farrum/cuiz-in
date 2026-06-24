
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { TeamMember } from './types';

export const useFetchTeamMembers = (teamLeaderId?: string | null) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateDaysActive = (joinDate: string, lastActive: string, status: string): number | string => {
    if (status === 'inactive' || status === 'suspended') {
      return "N/A";
    }
    
    const today = new Date();
    let comparisonDate: Date;
    
    if (status === 'active' && lastActive && new Date(lastActive) > new Date(joinDate)) {
      comparisonDate = new Date(lastActive);
    } else {
      comparisonDate = new Date(joinDate);
    }
    
    const diffTime = today.getTime() - comparisonDate.getTime();
    return Math.max(1, Math.floor(diffTime / (24 * 60 * 60 * 1000)));
  };

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = teamLeaderId || localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      if (!userId) {
        setError('User ID not found');
        setIsLoading(false);
        return;
      }

      // Fetch team members from hierarchy function
      const { data: teamData, error: fetchError } = await supabase
        .rpc('get_my_team_hierarchy');

      if (fetchError) throw fetchError;
      
      if (teamData && teamData.length > 0) {
        const members = teamData.map((m: any) => {
          const status = m.status || 'inactive';
          return {
            id: m.member_id,
            name: m.display_name || m.username || 'Unknown',
            email: m.email || '',
            status: status as 'active' | 'inactive' | 'suspended',
            lastActive: m.last_active_date || '-',
            daysActive: calculateDaysActive(m.join_date, m.last_active_date || '', status),
            joinDate: m.join_date,
            totalEarned: 0, // Earnings are aggregated at the end of the month
            role: m.role || 'player',
            directLeaderId: m.direct_leader_id,
            directLeaderUsername: m.direct_leader_username,
            questionsAnswered: Number(m.questions_answered) || 0,
            questionsCorrect: Number(m.questions_correct) || 0
          };
        });
        setTeamMembers(members);
      } else {
        setTeamMembers([]);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members data');
      
      toast({
        title: "Error",
        description: "Failed to load team members data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [teamLeaderId]);

  // Set up real-time subscription for questions answered
  useEffect(() => {
    console.log('[Realtime] Subscribing to quiz_answers PostgreSQL changes...');
    
    const channel = supabase
      .channel('team-answers-realtime-monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quiz_answers' },
        (payload: any) => {
          const newAnswer = payload.new;
          if (newAnswer && newAnswer.user_id) {
            setTeamMembers(prev => 
              prev.map(member => {
                if (member.id === newAnswer.user_id) {
                  return {
                    ...member,
                    questionsAnswered: (member.questionsAnswered || 0) + 1,
                    questionsCorrect: newAnswer.correct 
                      ? (member.questionsCorrect || 0) + 1 
                      : (member.questionsCorrect || 0)
                  };
                }
                return member;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[Realtime] Unsubscribing from quiz_answers...');
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    teamMembers,
    isLoading,
    error,
    refreshMembers: fetchTeamMembers
  };
};
