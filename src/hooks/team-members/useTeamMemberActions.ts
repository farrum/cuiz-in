
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { TeamMember } from './types';
import { notifySuspensionRequest } from '@/utils/notificationUtils';
import { AdminNotificationInsert } from '@/types/adminNotification';

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

  const requestAccountAction = async (memberId: string, action: 'suspend' | 'reactivate', teamLeaderId?: string) => {
    setActionInProgress(true);
    try {
      // Get the current user ID if not provided
      const userId = teamLeaderId || localStorage.getItem('quiz_app_user_id');
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Get team leader username
      const { data: leaderData, error: leaderError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();
        
      if (leaderError) throw leaderError;
      
      // Get member username
      const { data: memberData, error: memberError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', memberId)
        .single();
        
      if (memberError) throw memberError;
      
      // Create admin notification
      const notificationType = action === 'suspend' 
        ? 'account_suspend_request' as const
        : 'account_reactivate_request' as const;
      
      const notification: AdminNotificationInsert = {
        type: notificationType,
        message: `Team leader ${leaderData.username} requested ${action === 'suspend' ? 'suspension' : 'reactivation'} for ${memberData.username}`,
        read: false,
        user_id: memberId,
        data: {
          requesterUsername: leaderData.username,
          targetUsername: memberData.username,
          targetUserId: memberId,
          requesterId: userId,
          action: action
        }
      };
      
      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert(notification);
        
      if (notificationError) throw notificationError;
      
      toast({
        title: "Request Submitted",
        description: `Your request to ${action} this account has been submitted for admin review.`,
      });
      
      console.log(`Successfully submitted ${action} request for user ${memberId} by team leader ${userId}`);
      
    } catch (err) {
      console.error(`Error requesting account ${action}:`, err);
      toast({
        title: "Error",
        description: `Failed to submit ${action} request.`,
        variant: "destructive",
      });
    } finally {
      setActionInProgress(false);
    }
  };

  return { 
    handleStatusChange,
    requestAccountAction,
    actionInProgress
  };
};
