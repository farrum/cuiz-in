
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { TeamMember } from './types';

// Hook for team member status management actions
export const useTeamMemberActions = (teamMembers: TeamMember[], setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>) => {
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const { toast } = useToast();

  const handleStatusChange = async (memberId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    setActionInProgress(true);
    try {
      // Update in local state first for responsive UI
      const updatedMembers = teamMembers.map(member => {
        if (member.id === memberId) {
          return { 
            ...member, 
            status: newStatus,
            // If changing to inactive or suspended, set daysActive to "N/A"
            daysActive: newStatus === 'active' ? member.daysActive : "N/A"
          };
        }
        return member;
      });
      
      setTeamMembers(updatedMembers);
      
      // Update in user_referrals table
      const { error } = await supabase
        .from('user_referrals')
        .update({ status: newStatus })
        .eq('referred_id', memberId);
        
      if (error) throw error;
      
      // If setting to suspended, also update the profiles table
      if (newStatus === 'suspended') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ suspended: true })
          .eq('id', memberId);
          
        if (profileError) throw profileError;
      } 
      // If activating a user, make sure they're not suspended in profiles
      else if (newStatus === 'active') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ suspended: false })
          .eq('id', memberId);
          
        if (profileError) throw profileError;
      }
      
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
    } finally {
      setActionInProgress(false);
    }
  };

  return { 
    handleStatusChange,
    actionInProgress
  };
};
