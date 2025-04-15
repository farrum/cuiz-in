
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { isUserActive } from '@/utils/accountSuspension';
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

  useEffect(() => {
    const fetchTeamMembers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current user ID (team leader)
        const userId = teamLeaderId || localStorage.getItem(STORAGE_KEYS.USER_ID);
        
        if (!userId) {
          setError('User ID not found');
          setIsLoading(false);
          return;
        }

        // Fetch only the referred members for this team leader
        const { data: referrals, error } = await supabase
          .from('user_referrals')
          .select('*')
          .eq('referrer_id', userId);

        if (error) throw error;
        
        if (referrals && referrals.length > 0) {
          const membersPromises = referrals.map(async (r) => {
            const isActive = await isUserActive(r.referred_id);
            
            let status = r.status;
            
            const { data: profile } = await supabase
              .from('profiles')
              .select('suspended')
              .eq('id', r.referred_id)
              .maybeSingle();
              
            if (profile?.suspended) {
              status = 'suspended';
            }
            
            return {
              id: r.referred_id,
              name: r.referred_name,
              email: r.referred_email || '',
              status: status as 'active' | 'inactive' | 'suspended',
              lastActive: r.last_active_date || '-',
              daysActive: calculateDaysActive(r.date, r.last_active_date || '', status),
              joinDate: r.date,
              totalEarned: Number(r.earnings) || 0
            };
          });
          
          const members = await Promise.all(membersPromises);
          setTeamMembers(members);
        } else {
          // No referred members for this team leader
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
    
    fetchTeamMembers();
  }, [teamLeaderId, toast]);

  return { 
    teamMembers,
    isLoading,
    error,
  };
};
