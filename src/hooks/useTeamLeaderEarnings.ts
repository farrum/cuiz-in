
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

export interface EarningDetail {
  month: string;
  year: number;
  amount: number;
  membersCount: number;
}

export const useTeamLeaderEarnings = (teamLeaderId?: string | null) => {
  const [earnings, setEarnings] = useState<EarningDetail[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEarnings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the provided teamLeaderId or get it from localStorage
        const userId = teamLeaderId || localStorage.getItem(STORAGE_KEYS.USER_ID);
        
        if (!userId) {
          setError('User ID not found');
          return;
        }

        // Fetch from Supabase
        // Using the raw SQL query to work around TypeScript type limitations
        const { data, error } = await supabase
          .from('team_leader_earnings')
          .select('*')
          .eq('team_leader_id', userId)
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (error) throw error;

        if (data) {
          // Convert to our EarningDetail format
          const formattedEarnings: EarningDetail[] = data.map(item => ({
            month: `${item.month} ${item.year}`,
            year: item.year,
            amount: Number(item.amount),
            membersCount: item.active_members
          }));

          setEarnings(formattedEarnings);
          
          // Calculate total earnings
          const total = formattedEarnings.reduce((sum, item) => sum + item.amount, 0);
          setTotalEarnings(total);
        }
      } catch (err) {
        console.error('Error fetching team leader earnings:', err);
        setError('Failed to load earnings data');
        
        toast({
          title: "Error",
          description: "Failed to load earnings data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEarnings();
  }, [teamLeaderId, toast]);

  return { earnings, totalEarnings, isLoading, error };
};
