
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  daysActive: number; // Changed from monthsActive to daysActive
  joinDate: string;
  totalEarned: number;
}

export const useTeamMembers = (teamLeaderId?: string | null) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeMembers, setActiveMembers] = useState<number>(0);
  const [inactiveMembers, setInactiveMembers] = useState<number>(0);
  const [suspendedMembers, setSuspendedMembers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTeamMembers = async () => {
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
        const { data: referrals, error } = await supabase
          .from('user_referrals')
          .select('*')
          .eq('referrer_id', userId);

        if (error) throw error;
        
        if (referrals) {
          const members = referrals.map(r => {
            // Calculate days active based on join date or last active date (whichever is later)
            const joinDate = new Date(r.date);
            const lastActiveDate = r.last_active_date ? new Date(r.last_active_date) : null;
            
            // Use the later of the two dates
            const latestActivity = lastActiveDate && lastActiveDate > joinDate ? lastActiveDate : joinDate;
            
            // Calculate days active
            const daysActive = Math.ceil((new Date().getTime() - latestActivity.getTime()) / (24 * 60 * 60 * 1000));
            
            return {
              id: r.referred_id || r.id,
              name: r.referred_name,
              email: r.referred_email || '',
              status: r.status as 'active' | 'inactive' | 'suspended',
              lastActive: r.last_active_date || '-',
              daysActive: Math.max(1, daysActive), // Ensure at least 1 day active
              joinDate: r.date,
              totalEarned: Number(r.earnings) || 0
            };
          });

          setTeamMembers(members);
          
          // Update status counts
          setActiveMembers(members.filter(m => m.status === 'active').length);
          setInactiveMembers(members.filter(m => m.status === 'inactive').length);
          setSuspendedMembers(members.filter(m => m.status === 'suspended').length);
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

  const handleStatusChange = async (memberId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      // Update in local state first for responsive UI
      const updatedMembers = teamMembers.map(member => {
        if (member.id === memberId) {
          return { ...member, status: newStatus };
        }
        return member;
      });
      
      setTeamMembers(updatedMembers);
      
      // Update status counts
      setActiveMembers(updatedMembers.filter(m => m.status === 'active').length);
      setInactiveMembers(updatedMembers.filter(m => m.status === 'inactive').length);
      setSuspendedMembers(updatedMembers.filter(m => m.status === 'suspended').length);
      
      // Update in database
      const { error } = await supabase
        .from('user_referrals')
        .update({ status: newStatus })
        .eq('referred_id', memberId);
        
      if (error) throw error;
      
      toast({
        title: "Status Updated",
        description: `Member status has been updated to ${newStatus}.`,
      });
    } catch (err) {
      console.error('Error updating member status:', err);
      toast({
        title: "Error",
        description: "Failed to update member status.",
        variant: "destructive",
      });
    }
  };

  return { 
    teamMembers, 
    activeMembers, 
    inactiveMembers, 
    suspendedMembers, 
    isLoading, 
    error,
    handleStatusChange 
  };
};
