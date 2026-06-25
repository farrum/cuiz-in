
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { useTeamMembers } from '@/hooks/team-members';
import { useTeamLeaderEarnings } from '@/hooks/useTeamLeaderEarnings';
import { AdminNotificationInsert } from '@/types/adminNotification';

export const useTeamLeaderDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isTeamLeader, setIsTeamLeader] = useState<boolean>(false);
  const [isMainTeamLeader, setIsMainTeamLeader] = useState<boolean>(false);
  const { 
    teamMembers, 
    activeMembers, 
    inactiveMembers, 
    suspendedMembers, 
    isLoading: membersLoading,
    handleStatusChange,
    requestAccountAction: teamMemberRequestAction,
    refreshMembers
  } = useTeamMembers();
  
  const {
    earnings,
    totalEarnings,
    isLoading: earningsLoading
  } = useTeamLeaderEarnings();

  useEffect(() => {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    
    if (!storedUserId) {
      navigate('/login');
      return;
    }

    setUserId(storedUserId);
    
    const checkTeamLeaderStatus = async () => {
      try {
        const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
        const isLeaderRole = userRole === 'team_leader' || userRole === 'teamleader' || userRole === 'junior_team_leader';
        
        if (isLeaderRole) {
          setIsTeamLeader(true);
          setIsMainTeamLeader(userRole === 'team_leader' || userRole === 'teamleader');
        } else {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', storedUserId)
            .maybeSingle();
            
          if (error) throw error;
          
          const role = data?.role;
          const isLeader = role === 'team_leader' || role === 'teamleader' || role === 'junior_team_leader';
          
          setIsTeamLeader(isLeader);
          setIsMainTeamLeader(role === 'team_leader' || role === 'teamleader');
          
          if (!isLeader) {
            toast({
              title: "Access Denied",
              description: "Only Team Leaders can access this dashboard. Refer at least 10 active users to become a Team Leader.",
              variant: "destructive",
            });
            navigate('/profile');
          }
        }
      } catch (error) {
        console.error('Error checking team leader status:', error);
        setIsTeamLeader(false);
      }
    };
    
    checkTeamLeaderStatus();
  }, [navigate, toast]);

  const promoteToJunior = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('promote_member_to_junior_leader' as any, { p_member_id: memberId });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Member has been promoted to Junior Team Leader successfully.",
      });
      
      if (refreshMembers) refreshMembers();
    } catch (err: any) {
      console.error('Error promoting member:', err);
      toast({
        title: "Promotion Failed",
        description: err.message || "Failed to promote member.",
        variant: "destructive"
      });
    }
  };

  const demoteToPlayer = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('demote_junior_leader' as any, { p_member_id: memberId });
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Junior Team Leader has been demoted back to Player successfully.",
      });
      
      if (refreshMembers) refreshMembers();
    } catch (err: any) {
      console.error('Error demoting member:', err);
      toast({
        title: "Demotion Failed",
        description: err.message || "Failed to demote member.",
        variant: "destructive"
      });
    }
  };

  const memberColumns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => row.status,
    },
    {
      header: "Last Active",
      accessorKey: "lastActive",
      cell: (row: any) => row.lastActive,
    },
    {
      header: "Days Active",
      accessorKey: "daysActive",
      cell: (row: any) => row.daysActive,
    },
    {
      header: "Gems",
      accessorKey: "totalEarned",
      cell: (row: any) => <span>{row.totalEarned} pts</span>,
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: any) => row.id,
    },
  ];

  const earningsColumns = [
    {
      header: "Month",
      accessorKey: "month",
    },
    {
      header: "Active Members",
      accessorKey: "membersCount",
    },
    {
      header: "Gems",
      accessorKey: "amount",
      cell: (row: any) => <span>{row.amount} pts</span>,
    },
  ];
  
  // Prepare chart data
  const chartData = earnings.slice(0, 6).map(item => ({
    month: item.month,
    amount: item.amount,
    members: item.membersCount
  })).reverse();

  const isLoading = membersLoading || earningsLoading;

  return {
    userId,
    isTeamLeader,
    teamMembers,
    activeMembers,
    inactiveMembers,
    suspendedMembers,
    earnings,
    totalEarnings,
    chartData,
    isLoading,
    membersLoading,
    earningsLoading,
    handleStatusChange,
    requestAccountAction: teamMemberRequestAction, // Return the renamed function with the expected name
    memberColumns,
    earningsColumns,
    refreshMembers,
    isMainTeamLeader,
    promoteToJunior,
    demoteToPlayer
  };
};
