
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

      let members: TeamMember[] = [];

      // 1. Primary: Try fetching from RPC get_my_team_hierarchy
      try {
        const { data: teamData, error: fetchError } = await supabase
          .rpc('get_my_team_hierarchy' as any);

        if (!fetchError && teamData && (teamData as any).length > 0) {
          members = (teamData as any).map((m: any) => {
            const status = m.status || 'inactive';
            return {
              id: m.member_id,
              name: m.display_name || m.username || 'Unknown',
              email: m.email || '',
              status: status as 'active' | 'inactive' | 'suspended',
              lastActive: m.last_active_date || '-',
              daysActive: calculateDaysActive(m.join_date, m.last_active_date || '', status),
              joinDate: m.join_date,
              totalEarned: 0,
              role: m.role || 'player',
              directLeaderId: m.direct_leader_id,
              directLeaderUsername: m.direct_leader_username,
              questionsAnswered: Number(m.questions_answered) || 0,
              questionsCorrect: Number(m.questions_correct) || 0
            };
          });
        }
      } catch (rpcErr) {
        console.warn('[TeamMembers] RPC get_my_team_hierarchy unavailable, switching to table query:', rpcErr);
      }

      // 2. Fallback: Direct query to user_referrals table if RPC returned no members or failed
      if (members.length === 0) {
        const { data: refData, error: refError } = await supabase
          .from('user_referrals')
          .select('*')
          .eq('referrer_id', userId);

        if (refError) {
          console.error('[TeamMembers] Fallback user_referrals query error:', refError);
        } else if (refData && refData.length > 0) {
          const referredIds = refData.map(r => r.referred_id).filter(Boolean);

          let profilesMap = new Map<string, any>();
          let rolesMap = new Map<string, string>();

          if (referredIds.length > 0) {
            const [profilesRes, rolesRes] = await Promise.all([
              supabase.from('profiles').select('id, username, display_name, created_at').in('id', referredIds),
              supabase.from('user_roles' as any).select('user_id, role').in('user_id', referredIds)
            ]);

            if (profilesRes.data) {
              profilesRes.data.forEach(p => profilesMap.set(p.id, p));
            }
            if (rolesRes.data) {
              rolesRes.data.forEach((r: any) => rolesMap.set(r.user_id, r.role));
            }
          }

          members = refData.map(ref => {
            const prof = profilesMap.get(ref.referred_id);
            const status = (ref.status || 'inactive') as 'active' | 'inactive' | 'suspended';
            const joinDate = ref.date || new Date().toISOString();
            const lastActive = ref.last_active_date || prof?.created_at || '-';

            return {
              id: ref.referred_id,
              name: prof?.display_name || prof?.username || ref.referred_name || 'Mercenary',
              email: ref.referred_email || '',
              status: status,
              lastActive: lastActive,
              daysActive: calculateDaysActive(joinDate, lastActive, status),
              joinDate: joinDate,
              totalEarned: status === 'active' ? 500 : 0,
              role: rolesMap.get(ref.referred_id) || 'player',
              directLeaderId: userId,
              directLeaderUsername: '',
              questionsAnswered: 0,
              questionsCorrect: 0
            };
          });
        }
      }

      setTeamMembers(members);
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
