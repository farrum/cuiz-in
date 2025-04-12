
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { isUserActive } from '@/utils/accountSuspension';
import { TeamMember } from './types';

// Hook for fetching team members data
export const useFetchTeamMembers = (teamLeaderId?: string | null) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
            // Fetch the latest attendance dates for each user
            const { data: attendance, error: attendanceError } = await supabase
              .from('user_attendance')
              .select('user_id, attendance_date, login_time')
              .order('attendance_date', { ascending: false });
              
            if (attendanceError) console.error("Error fetching attendance:", attendanceError);
            
            // Create a map of user_id to their most recent login date
            const lastActiveMap = new Map();
            if (attendance) {
              attendance.forEach(record => {
                if (!lastActiveMap.has(record.user_id)) {
                  lastActiveMap.set(record.user_id, {
                    date: record.attendance_date,
                    time: record.login_time
                  });
                }
              });
            }
            
            const members = profiles.map(profile => {
              // Get the last active date for this user
              const lastActive = lastActiveMap.get(profile.id);
              const lastActiveDate = lastActive 
                ? new Date(lastActive.date).toLocaleDateString() + ' ' + new Date(lastActive.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '-';
              
              return {
                id: profile.id,
                name: profile.username || 'Unknown',
                // Use phone as email or fallback to a dash if not available
                email: profile.phone || '-',
                status: profile.suspended ? 'suspended' as const : 'active' as const,
                lastActive: lastActiveDate,
                daysActive: profile.suspended ? 'N/A' : 'Active',
                joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '-',
                totalEarned: 0
              };
            });
            
            setTeamMembers(members);
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

  return { 
    teamMembers,
    isLoading,
    error,
  };
};
