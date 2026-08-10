import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { useTeamMembers } from '@/hooks/team-members';
import { useTeamLeaderEarnings } from '@/hooks/useTeamLeaderEarnings';

export interface BaronTask {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  type: 'quests' | 'games' | 'riddles';
  frequency?: 'daily' | 'weekly' | 'monthly';
  rewardGems: number;
  rewardStars: number;
  rewardShards: number;
  shardType: 'Socrates' | 'Aryabhata' | 'Chanakya' | 'Ramanujan';
  status: 'active' | 'completed' | 'claimed';
  assignedTo: string; // 'all' or specific member ID
  assignedToName: string;
  parentTaskId?: string;
}

export const useTeamLeaderDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [isTeamLeader, setIsTeamLeader] = useState<boolean>(false);
  const [isMainTeamLeader, setIsMainTeamLeader] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('infantry');
  
  const { 
    teamMembers: rawMembers = [], 
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

  const [assignedTasks, setAssignedTasks] = useState<BaronTask[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  // Real presence data (last activity timestamp + games played) per member.
  const [presence, setPresence] = useState<Record<string, { lastSeen: string | null; gamesPlayed: number }>>({});

  // Load tasks from Supabase empire_tasks
  const fetchTasks = async (storedUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('empire_tasks' as any)
        .select('*')
        .or(`assigned_to.eq.${storedUserId},assigned_by.eq.${storedUserId}`);
      
      if (!error && data) {
        const mapped: BaronTask[] = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          targetCount: t.target_count,
          currentCount: t.current_count,
          type: t.type,
          rewardGems: t.reward_gems,
          rewardStars: t.reward_stars,
          rewardShards: t.reward_shards,
          shardType: t.shard_type,
          status: t.status,
          assignedTo: t.assigned_to || 'all',
          assignedToName: ''
        }));
        setAssignedTasks(mapped);
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
    }
  };

  // Load join requests for approval
  const fetchJoinRequests = async (leaderId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_join_requests' as any)
        .select('*, profiles(username, display_name)')
        .eq('target_leader_id', leaderId)
        .eq('status', 'pending');

      if (!error && data) {
        setJoinRequests(data);
      }
    } catch (e) {
      console.error('Error fetching join requests:', e);
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (storedUserId) {
      setUserId(storedUserId);
      fetchTasks(storedUserId);
      fetchJoinRequests(storedUserId);
    }
  }, [userId]);

  const assignTask = async (taskData: Omit<BaronTask, 'id' | 'currentCount' | 'status'>) => {
    try {
      const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!storedUserId) return;

      const { data, error } = await supabase
        .from('empire_tasks' as any)
        .insert({
          title: taskData.title,
          description: taskData.description,
          target_count: taskData.targetCount,
          current_count: 0,
          type: taskData.type,
          reward_gems: taskData.rewardGems,
          reward_stars: taskData.rewardStars,
          reward_shards: taskData.rewardShards,
          shard_type: taskData.shardType,
          status: 'active',
          assigned_by: storedUserId,
          assigned_to: taskData.assignedTo === 'all' ? null : taskData.assignedTo
        })
        .select()
        .single();

      if (error) throw error;

      const newTask: BaronTask = {
        ...taskData,
        id: (data as any).id,
        currentCount: 0,
        status: 'active'
      };
      
      setAssignedTasks([newTask, ...assignedTasks]);
      window.dispatchEvent(new CustomEvent('baronTasksUpdated'));

      toast({
        title: "Contract Assigned",
        description: `Quest "${taskData.title}" has been successfully assigned.`,
      });
    } catch (e) {
      console.error('Error assigning task:', e);
    }
  };

  const redistributeTask = async (parentTask: BaronTask, targetAssignee: string = 'all') => {
    try {
      const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!storedUserId) return;

      await assignTask({
        title: `[Sub-Task] ${parentTask.title}`,
        description: parentTask.description,
        targetCount: parentTask.targetCount,
        type: parentTask.type,
        frequency: parentTask.frequency || 'daily',
        rewardGems: parentTask.rewardGems,
        rewardStars: parentTask.rewardStars,
        rewardShards: parentTask.rewardShards,
        shardType: parentTask.shardType,
        assignedTo: targetAssignee,
        assignedToName: targetAssignee === 'all' ? 'All Sub-Squad' : 'Mercenary',
        parentTaskId: parentTask.id
      });

      toast({
        title: "Task Cascaded to Squad",
        description: `Successfully redistributed task "${parentTask.title}" to your sub-squad.`,
      });
    } catch (e) {
      console.error('Error redistributing task:', e);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('empire_tasks' as any)
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setAssignedTasks(assignedTasks.filter(t => t.id !== taskId));
      window.dispatchEvent(new CustomEvent('baronTasksUpdated'));
      
      toast({
        title: "Contract Canceled",
        description: "Assigned contract has been deleted.",
      });
    } catch (e) {
      console.error('Error deleting task:', e);
    }
  };

  const awardBonus = async (memberId: string, name: string, stars: number, gems: number) => {
    try {
      const { data: memberProfile } = await (supabase as any)
        .from('profiles')
        .select('points, stars')
        .eq('id', memberId)
        .maybeSingle();

      const currentGems = memberProfile?.points || 0;
      const currentStars = memberProfile?.stars || 0;

      await (supabase as any)
        .from('profiles')
        .update({ 
          points: currentGems + gems,
          stars: currentStars + stars
        })
        .eq('id', memberId);

      toast({
        title: "Tribute Sent!",
        description: `Awarded +${stars}★ and +${gems} Gems bonus to ${name}!`,
      });
      if (refreshMembers) refreshMembers();
    } catch (e) {
      console.warn("Failed to award bonus to database", e);
    }
  };

  // Fetch REAL presence for the roster (last quiz answer / login timestamp).
  const memberIdsKey = rawMembers.map((m) => m.id).sort().join(',');
  useEffect(() => {
    const ids = memberIdsKey ? memberIdsKey.split(',') : [];
    if (ids.length === 0) {
      setPresence({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.rpc('get_my_team_presence' as any, { p_member_ids: ids });
      if (cancelled || error || !data) return;
      const map: Record<string, { lastSeen: string | null; gamesPlayed: number }> = {};
      (data as any[]).forEach((row) => {
        map[row.member_id] = {
          lastSeen: row.last_seen ?? null,
          gamesPlayed: Number(row.games_played) || 0,
        };
      });
      setPresence(map);
    };
    load();
    // Presence goes stale quickly — refresh while the dashboard is open.
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [memberIdsKey]);

  /** A member counts as online only if they did something in the last 5 minutes. */
  const ONLINE_WINDOW_MS = 5 * 60 * 1000;

  const formatLastSeen = (lastSeen: string | null): string => {
    if (!lastSeen) return 'Never';
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < ONLINE_WINDOW_MS) return 'Active now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Enrich members with REAL activity data. No synthetic/random values —
  // showing invented "online" states was misleading.
  const teamMembers = rawMembers.map((member) => {
    const p = presence[member.id];
    const lastSeen = p?.lastSeen ?? null;
    const isOnline = !!lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;

    return {
      ...member,
      isOnline,
      lastSeen,
      gamesPlayed: p?.gamesPlayed ?? member.questionsAnswered ?? 0,
      lastOnline: formatLastSeen(lastSeen),
      activePlayTime: '—',
      activeActivity: isOnline ? 'Playing' : 'Idle',
    };
  });

  const onlineMembers = teamMembers.filter((m) => m.isOnline).length;

  useEffect(() => {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    
    if (!storedUserId) {
      navigate('/login');
      return;
    }
    
    const checkTeamLeaderStatus = async () => {
      try {
        const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'infantry';
        setCurrentUserRole(userRole);
        const isLeader = ['admin', 'king', 'baron', 'knight', 'officer', 'team_leader', 'junior_team_leader'].includes(userRole);
        
        setIsTeamLeader(isLeader);
        setIsMainTeamLeader(['admin', 'king', 'baron', 'team_leader'].includes(userRole));
        
        if (!isLeader) {
          toast({
            title: "Access Denied",
            description: "Only Barons, Knights, and Officers can access the War Room.",
            variant: "destructive",
          });
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error checking team leader status:', error);
        setIsTeamLeader(false);
      }
    };
    
    checkTeamLeaderStatus();
  }, [navigate, toast]);

  const promoteToJunior = async (memberId: string, roleToPromote: string = 'officer') => {
    try {
      const { error } = await supabase
        .rpc('promote_member_manually' as any, { 
          p_member_id: memberId,
          p_new_role: roleToPromote 
        });
        
      if (error) throw error;
      
      toast({
        title: "Vassal Commissioned",
        description: `Mercenary has been successfully promoted to ${roleToPromote} rank.`,
      });
      
      if (refreshMembers) refreshMembers();
    } catch (err: any) {
      console.error('Error promoting member:', err);
    }
  };

  const demoteToPlayer = async (memberId: string) => {
    try {
      const { error } = await supabase
        .rpc('promote_member_manually' as any, { 
          p_member_id: memberId,
          p_new_role: 'infantry'
        });
        
      if (error) throw error;
      
      toast({
        title: "Demoted to Infantry",
        description: "Officer has been demoted back to Infantry.",
      });
      
      if (refreshMembers) refreshMembers();
    } catch (err: any) {
      console.error('Error demoting member:', err);
    }
  };

  const approveJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .rpc('approve_team_join_request' as any, { p_request_id: requestId });

      if (error) throw error;

      toast({
        title: "Request Approved",
        description: "The mercenary has joined your team!",
      });

      if (userId) {
        fetchJoinRequests(userId);
      }
      if (refreshMembers) refreshMembers();
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  const rejectJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('team_join_requests' as any)
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "The team join request has been declined.",
      });

      if (userId) {
        fetchJoinRequests(userId);
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const memberColumns = [
    {
      header: "Mercenary",
      accessorKey: "name",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <span className="font-bold">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Rank",
      accessorKey: "role",
      cell: (row: any) => {
        const r = row.role || 'infantry';
        return r.charAt(0).toUpperCase() + r.slice(1);
      }
    },
    {
      header: "Current Activity",
      accessorKey: "activeActivity",
    },
    {
      header: "Last Online",
      accessorKey: "lastOnline",
    },
    {
      header: "Play Time",
      accessorKey: "activePlayTime",
    },
    {
      header: "Games",
      accessorKey: "gamesPlayed",
    },
    {
      header: "Gold Gems",
      accessorKey: "totalEarned",
      cell: (row: any) => <span>{row.totalEarned}</span>,
    }
  ];

  const earningsColumns = [
    {
      header: "Month",
      accessorKey: "month",
    },
    {
      header: "Active Mercenaries",
      accessorKey: "membersCount",
    },
    {
      header: "Taxes Collected (Gems)",
      accessorKey: "amount",
      cell: (row: any) => <span>{row.amount}</span>,
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
    requestAccountAction: teamMemberRequestAction,
    memberColumns,
    earningsColumns,
    refreshMembers,
    isMainTeamLeader,
    currentUserRole,
    promoteToJunior,
    demoteToPlayer,
    assignedTasks,
    assignTask,
    redistributeTask,
    deleteTask,
    awardBonus,
    joinRequests,
    approveJoinRequest,
    rejectJoinRequest
  };
};
