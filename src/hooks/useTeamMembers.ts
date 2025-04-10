
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { isUserActive } from '@/utils/accountSuspension';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  daysActive: number | string;
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

  const calculateDaysActive = (joinDate: string, lastActive: string, status: string): number | string => {
    // For inactive or suspended users, return "N/A"
    if (status === 'inactive' || status === 'suspended') {
      return "N/A";
    }
    
    // For active users, calculate days active from the day they became active (last inactive date + 1)
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
        // For admin view, fetch all users
        if (!teamLeaderId) {
          // Fetch all profiles first
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
            
          if (profilesError) throw profilesError;
          
          if (profiles) {
            const members = profiles.map(profile => {
              return {
                id: profile.id,
                name: profile.username || 'Unknown',
                email: profile.email || '-',
                status: profile.suspended ? 'suspended' as const : 'active' as const,
                lastActive: '-',
                daysActive: profile.suspended ? 'N/A' : 'Active',
                joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-',
                totalEarned: 0
              };
            });
            
            setTeamMembers(members);
            setActiveMembers(members.filter(m => m.status === 'active').length);
            setSuspendedMembers(members.filter(m => m.status === 'suspended').length);
            setIsLoading(false);
            return;
          }
        }
        
        // Use the provided teamLeaderId or get it from localStorage for team leader view
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
          // Process each referral to get the latest status
          const membersPromises = referrals.map(async (r) => {
            // Get the referred user's status from profiles
            const isActive = await isUserActive(r.referred_id);
            
            // Determine status based on profile.suspended only
            let status = r.status;
            
            // Override status if suspended in profiles
            const { data: profile } = await supabase
              .from('profiles')
              .select('suspended')
              .eq('id', r.referred_id)
              .maybeSingle();
              
            if (profile?.suspended) {
              status = 'suspended';
            } else {
              status = 'active'; // All non-suspended users are now considered active
            }
            
            return {
              id: r.referred_id || r.id,
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
          
          // Update status counts
          setActiveMembers(members.filter(m => m.status === 'active').length);
          setInactiveMembers(members.filter(m => m.status === 'inactive').length);
          setSuspendedMembers(members.filter(m => m.status === 'suspended').length);
          
          // Also update the database with the latest status
          for (const member of members) {
            if (member.status !== referrals.find(r => r.referred_id === member.id)?.status) {
              await supabase
                .from('user_referrals')
                .update({ status: member.status })
                .eq('referred_id', member.id);
            }
          }
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
      
      // Update status counts
      setActiveMembers(updatedMembers.filter(m => m.status === 'active').length);
      setInactiveMembers(updatedMembers.filter(m => m.status === 'inactive').length);
      setSuspendedMembers(updatedMembers.filter(m => m.status === 'suspended').length);
      
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
