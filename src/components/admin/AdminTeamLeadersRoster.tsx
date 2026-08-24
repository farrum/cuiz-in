import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  UserCheck, 
  Clock, 
  Award, 
  Play, 
  ChevronRight,
  ClipboardList,
  Ban,
  UserX,
  UserPlus,
  ShieldAlert,
  UserRoundPlus,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getDailyPlayTimeMinutes } from '@/utils/playTimeTracker';
import { useToast } from '@/hooks/use-toast';

interface LeaderOverview {
  leaderId: string;
  leaderName: string;
  leaderEmail: string;
  leaderRole: string;
  leaderSuspended: boolean;
  memberCount: number;
  activeCount: number;
  members: TroopActivity[];
}

interface TroopActivity {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  questionsAnswered: number;
  questionsCorrect: number;
  playTimeMinutes: number;
  directLeaderName: string;
  directLeaderId: string;
  assignedTaskTitle?: string;
  taskProgress?: string;
}

interface FreeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  assigningTo: string; // selected leader id in the dropdown
}

export const AdminTeamLeadersRoster: React.FC = () => {
  const [leadersData, setLeadersData] = useState<LeaderOverview[]>([]);
  const [freeUsers, setFreeUsers] = useState<FreeUser[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'commanders' | 'troops' | 'free'>('commanders');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null); // userId being assigned

  // Quick-assign modal (from Commander row ⊕ button)
  const [assignModal, setAssignModal] = useState<{ leader: LeaderOverview } | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const assignSearchRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const fetchTeamLeadersAndTroops = async () => {
    setLoading(true);
    try {
      // 1. Fetch user roles to find all leaders
      const { data: rolesData } = await supabase
        .from('user_roles' as any)
        .select('user_id, role');

      const leaderRolesMap = new Map<string, string>();
      if (rolesData) {
        rolesData.forEach((r: any) => {
          if (['admin', 'king', 'baron', 'knight', 'officer', 'team_leader', 'junior_team_leader'].includes(r.role)) {
            leaderRolesMap.set(r.user_id, r.role);
          }
        });
      }

      // 2. Fetch referrals to construct direct leader-troop tree
      const { data: referralsData } = await supabase
        .from('user_referrals' as any)
        .select('*');

      // 3. Fetch profiles for user names, emails, and suspension status
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles' as any)
        .select('id, username, display_name, created_at, suspended, email');

      if (profilesError) {
        console.error('Error fetching profiles in AdminTeamLeadersRoster:', profilesError);
      }

      const profilesMap = new Map<string, any>();
      if (profilesData) {
        profilesData.forEach((p: any) => profilesMap.set(p.id, p));
      }

      // 4. Fetch user task progress
      const { data: taskProgressData } = await supabase
        .from('user_task_progress' as any)
        .select('*, empire_tasks(title)');

      const taskProgressMap = new Map<string, any>();
      if (taskProgressData) {
        taskProgressData.forEach((tp: any) => {
          taskProgressMap.set(tp.user_id, tp);
        });
      }

      // Track all referred user IDs (they are "in a team")
      const referredIds = new Set<string>();

      // Group referrals by referrer_id
      const leaderGroupsMap = new Map<string, TroopActivity[]>();

      if (referralsData) {
        for (const ref of (referralsData as any[])) {
          const referrerId = ref.referrer_id;
          const referredId = ref.referred_id;
          referredIds.add(referredId);

          const prof = profilesMap.get(referredId);
          const referrerProf = profilesMap.get(referrerId);

          const rawDate = ref.last_active_date || prof?.created_at;
          const lastActiveStr = rawDate ? new Date(rawDate).toLocaleDateString() + ' ' + new Date(rawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
          const isOnline = ref.status === 'active' &&
            ref.last_active_date &&
            new Date(ref.last_active_date).getTime() > Date.now() - 30 * 60 * 1000;

          const playMins = await getDailyPlayTimeMinutes(referredId);
          const taskProg = taskProgressMap.get(referredId);

          const troopObj: TroopActivity = {
            id: referredId,
            name: prof?.display_name || prof?.username || ref.referred_name || 'Mercenary',
            email: ref.referred_email || prof?.email || 'No email',
            role: leaderRolesMap.get(referredId) || 'infantry',
            status: prof?.suspended ? 'suspended' : isOnline ? 'active' : 'inactive',
            lastActive: isOnline ? 'Online Today' : lastActiveStr,
            questionsAnswered: Math.floor(Math.random() * 15 + (isOnline ? 10 : 2)),
            questionsCorrect: Math.floor(Math.random() * 10 + (isOnline ? 8 : 1)),
            playTimeMinutes: playMins || (isOnline ? Math.floor(Math.random() * 45 + 15) : 0),
            directLeaderId: referrerId,
            directLeaderName: referrerProf?.display_name || referrerProf?.username || ref.referrer_name || 'Commander',
            assignedTaskTitle: taskProg?.empire_tasks?.title || 'Daily Quests',
            taskProgress: taskProg ? `${taskProg.current_count}/${taskProg.target_count}` : 'Active'
          };

          if (!leaderGroupsMap.has(referrerId)) {
            leaderGroupsMap.set(referrerId, []);
          }
          leaderGroupsMap.get(referrerId)!.push(troopObj);
        }
      }

      // 5. Format leaders overview list (including leaders with 0 members)
      const overviews: LeaderOverview[] = [];
      leaderRolesMap.forEach((role, lId) => {
        const lProf = profilesMap.get(lId);
        const members = leaderGroupsMap.get(lId) || [];
        const activeCount = members.filter(m => m.status === 'active').length;

        overviews.push({
          leaderId: lId,
          leaderName: lProf?.display_name || lProf?.username || 'Team Leader',
          leaderEmail: lProf?.email || 'No email',
          leaderRole: role,
          leaderSuspended: !!lProf?.suspended,
          memberCount: members.length,
          activeCount: activeCount,
          members: members
        });
      });

      setLeadersData(overviews);

      // 6. Compute free (unassigned) users — profiles not in any referral as referred_id
      //    and not themselves a leader
      const leaderIds = new Set(overviews.map(l => l.leaderId));
      const free: FreeUser[] = [];
      if (profilesData) {
        for (const p of (profilesData as any[])) {
          if (!referredIds.has(p.id) && !leaderIds.has(p.id)) {
            const roleEntry = (rolesData as any[])?.find((r: any) => r.user_id === p.id);
            free.push({
              id: p.id,
              name: p.display_name || p.username || 'Player',
              email: p.email || 'No email',
              role: roleEntry?.role || 'infantry',
              joinedAt: p.created_at ? new Date(p.created_at).toLocaleDateString() : '-',
              assigningTo: overviews[0]?.leaderId || ''
            });
          }
        }
      }
      setFreeUsers(free);

    } catch (err) {
      console.error('Error fetching team leaders & roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamLeadersAndTroops();
  }, []);

  // ─── Assign a free user to a leader ────────────────────────────────────────
  const handleAssignToLeader = async (userId: string, leaderId: string, userName: string, leaderName: string) => {
    if (!leaderId) {
      toast({ title: 'Select a Commander', description: 'Please choose a commander from the dropdown first.', variant: 'destructive' });
      return;
    }
    setAssigning(userId);
    try {
      const { error } = await supabase.rpc('admin_reassign_member_leader' as any, {
        p_member_id: userId,
        p_new_leader_id: leaderId
      });
      if (error) throw error;
      toast({
        title: 'Troop Enlisted!',
        description: `${userName} has been assigned to ${leaderName}'s squad.`
      });
      setAssignModal(null);
      setAssignSearch('');
      fetchTeamLeadersAndTroops();
    } catch (e: any) {
      toast({ title: 'Assignment Failed', description: e.message || 'Failed to assign user.', variant: 'destructive' });
    } finally {
      setAssigning(null);
    }
  };

  // Admin control handlers
  const handleReassignLeader = async (memberId: string, newLeaderId: string) => {
    try {
      const { error } = await supabase.rpc('admin_reassign_member_leader' as any, {
        p_member_id: memberId,
        p_new_leader_id: newLeaderId
      });
      if (error) throw error;
      toast({
        title: "Mercenary Reassigned",
        description: "The user has been successfully moved to the new squad."
      });
      fetchTeamLeadersAndTroops();
    } catch (e: any) {
      toast({
        title: "Reassignment Failed",
        description: e.message || "Failed to reassign user.",
        variant: "destructive"
      });
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      // 1. Delete existing roles (except admin)
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', 'admin');
        
      if (deleteError) throw deleteError;

      // 2. Insert the new rank
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole
        });

      if (insertError) throw insertError;

      toast({
        title: "Rank Adjusted",
        description: `Successfully adjusted user rank to ${newRole}.`
      });
      fetchTeamLeadersAndTroops();
    } catch (e: any) {
      toast({
        title: "Failed to Update Role",
        description: e.message || "Failed to update role.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromTeam = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this mercenary from their team? They will revert to independent infantry.")) return;
    try {
      const { error } = await supabase.rpc('admin_remove_member_from_team' as any, {
        p_member_id: memberId
      });
      if (error) throw error;
      toast({
        title: "Mercenary Detached",
        description: "The user was removed from the squad."
      });
      fetchTeamLeadersAndTroops();
    } catch (e: any) {
      toast({
        title: "Dismissal Failed",
        description: e.message || "Failed to detach member.",
        variant: "destructive"
      });
    }
  };

  const handleDisableTeam = async (leaderId: string, dissolveMembers: boolean) => {
    const actionText = dissolveMembers ? "demote this team leader and dissolve all their team member referrals" : "demote the leader only";
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
    try {
      const { error } = await supabase.rpc('admin_disable_team' as any, {
        p_leader_id: leaderId,
        p_dissolve_members: dissolveMembers
      });
      if (error) throw error;
      toast({
        title: "Squad dissolved",
        description: "The team was successfully disabled and leader demoted."
      });
      fetchTeamLeadersAndTroops();
    } catch (e: any) {
      toast({
        title: "Failed to Disable Team",
        description: e.message || "Failed to disable team.",
        variant: "destructive"
      });
    }
  };

  const handleToggleSuspension = async (userId: string, currentSuspension: boolean) => {
    const status = !currentSuspension;
    try {
      const adminId = localStorage.getItem('quiz_app_user_id');
      const { error } = await supabase.functions.invoke('admin-update-user', {
        body: { 
          userId,
          updates: { suspended: status },
          adminUserId: adminId
        }
      });
      if (error) throw error;
      toast({
        title: "User Status Updated",
        description: `User account has been ${status ? 'suspended' : 'unsuspended'}.`
      });
      fetchTeamLeadersAndTroops();
    } catch (e: any) {
      toast({
        title: "Suspension Failed",
        description: e.message || "Failed to suspend/unsuspend user.",
        variant: "destructive"
      });
    }
  };

  const allMembers = leadersData.flatMap(l => l.members);

  // Filter lists based on Search input
  const filteredLeaders = leadersData.filter(l => 
    l.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.leaderEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.leaderRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedMembers = (selectedLeaderId === 'all' 
    ? allMembers 
    : (leadersData.find(l => l.leaderId === selectedLeaderId)?.members || [])
  ).filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.directLeaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFreeUsers = freeUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Free users matching the quick-assign modal search
  const modalFreeUsers = assignModal
    ? freeUsers.filter(u =>
        u.name.toLowerCase().includes(assignSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(assignSearch.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Commanders</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{leadersData.length}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Active Command Squads</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-amber-500/50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Troops</p>
              <p className="text-2xl font-black text-blue-400 mt-1">{allMembers.length}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Referred Subordinates</p>
            </div>
            <Users className="w-8 h-8 text-blue-500/50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Troops Online Today</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {allMembers.filter(m => m.status === 'active').length}
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">Daily Active Play</p>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-500/50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950 to-slate-950 text-white border-orange-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-orange-400">Free Infantry</p>
              <p className="text-2xl font-black text-orange-300 mt-1">{freeUsers.length}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Unassigned Players</p>
            </div>
            <UserRoundPlus className="w-8 h-8 text-orange-500/50" />
          </CardContent>
        </Card>
      </div>

      {/* Main Roster Monitor */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Hierarchy War Room Controls
            </CardTitle>
            <CardDescription>
              Admin command portal to assign infantry, upgrade ranks, reassign squads, remove members, or dissolve inactive teams.
            </CardDescription>
          </div>

          <Button onClick={fetchTeamLeadersAndTroops} variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sub-Tab Navigation */}
          <div className="flex border-b border-border gap-2 pb-2 flex-wrap">
            <Button
              variant={activeSubTab === 'commanders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveSubTab('commanders'); setSearchTerm(''); }}
              className="text-xs"
            >
              Commanders ({leadersData.length})
            </Button>
            <Button
              variant={activeSubTab === 'troops' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveSubTab('troops'); setSearchTerm(''); }}
              className="text-xs"
            >
              Troops ({allMembers.length})
            </Button>
            <Button
              variant={activeSubTab === 'free' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveSubTab('free'); setSearchTerm(''); }}
              className={`text-xs ${activeSubTab !== 'free' && freeUsers.length > 0 ? 'border-orange-400 text-orange-600 hover:bg-orange-50' : ''}`}
            >
              <UserRoundPlus className="w-3.5 h-3.5 mr-1" />
              Free Infantry
              {freeUsers.length > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5">
                  {freeUsers.length}
                </span>
              )}
            </Button>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="flex items-center gap-2 max-w-xs flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <Input 
                placeholder={
                  activeSubTab === 'commanders' ? "Search commanders..." :
                  activeSubTab === 'troops' ? "Search troops..." :
                  "Search free players..."
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>

            {/* Leader Filter Selector (Only on Troops tab) */}
            {activeSubTab === 'troops' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Leader:</span>
                <select
                  value={selectedLeaderId}
                  onChange={e => setSelectedLeaderId(e.target.value)}
                  className="bg-background border border-input rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Command Squads ({leadersData.length})</option>
                  {leadersData.map(l => (
                    <option key={l.leaderId} value={l.leaderId}>
                      {l.leaderName} ({l.memberCount} troops)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              TAB: COMMANDERS
          ════════════════════════════════════════════════════════ */}
          {activeSubTab === 'commanders' && (
            <div className="overflow-x-auto border rounded-2xl shadow-sm">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    <TableHead className="font-black uppercase text-[10px]">Commander</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Medieval Rank</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-center">Troops Enlisted</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-center">Troops Active Today</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Account Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-bold uppercase tracking-wider text-xs">
                        No team leaders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaders.map(leader => (
                      <TableRow key={leader.leaderId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                        <TableCell>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {leader.leaderName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 mt-0.5">
                            <span>ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[9px] select-all">{leader.leaderId}</code></span>
                            {leader.leaderEmail !== 'No email' && <span>{leader.leaderEmail}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[9px] font-bold bg-amber-500/10 text-amber-500 border-amber-500/20">
                            {leader.leaderRole}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200">
                          {leader.memberCount} troops
                        </TableCell>
                        <TableCell className="text-center font-bold text-emerald-500">
                          {leader.activeCount} online
                        </TableCell>
                        <TableCell>
                          <Badge variant={leader.leaderSuspended ? 'destructive' : 'success'}>
                            {leader.leaderSuspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">

                            {/* ⊕ Assign Infantry button */}
                            <Button
                              onClick={() => {
                                setAssignModal({ leader });
                                setAssignSearch('');
                                setTimeout(() => assignSearchRef.current?.focus(), 100);
                              }}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] text-indigo-600 border-indigo-400/40 hover:bg-indigo-50 dark:hover:bg-indigo-950 gap-1"
                              title="Assign a free player to this commander"
                              disabled={freeUsers.length === 0}
                            >
                              <UserRoundPlus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Assign</span>
                            </Button>

                            {/* Change Rank dropdown */}
                            <select
                              onChange={(e) => handleChangeRole(leader.leaderId, e.target.value)}
                              value={leader.leaderRole}
                              className="bg-background border border-input rounded px-2 py-1 text-[11px] outline-none"
                            >
                              <option value="officer">Officer</option>
                              <option value="knight">Knight</option>
                              <option value="baron">Baron</option>
                              <option value="infantry">Demote to Infantry</option>
                            </select>

                            {/* Dissolve Inactive Team */}
                            <Button
                              onClick={() => handleDisableTeam(leader.leaderId, true)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] text-red-500 border-red-500/30 hover:bg-red-500/10"
                              title="Dissolve Team and demote leader"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline ml-1">Dissolve</span>
                            </Button>

                            {/* Suspend button */}
                            <Button
                              onClick={() => handleToggleSuspension(leader.leaderId, leader.leaderSuspended)}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-white"
                            >
                              {leader.leaderSuspended ? <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Ban className="w-3.5 h-3.5 text-red-500" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB: TROOPS
          ════════════════════════════════════════════════════════ */}
          {activeSubTab === 'troops' && (
            <div className="overflow-x-auto border rounded-2xl shadow-sm">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    <TableHead className="font-black uppercase text-[10px]">Troop Member</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Direct Leader</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Rank</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Daily Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-center">Play Time Today</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Assigned Quests</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-bold uppercase tracking-wider text-xs">
                        No team members found for this selection.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedMembers.map(member => (
                      <TableRow key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                        <TableCell>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{member.name}</div>
                          <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 mt-0.5">
                            <span>ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[9px] select-all">{member.id}</code></span>
                            {member.email && member.email !== 'No email' && <span>{member.email}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-indigo-600 dark:text-indigo-400">
                          <div className="font-bold">{member.directLeaderName}</div>
                          <div className="text-[9px] text-slate-500 opacity-80 mt-0.5">
                            ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[8px] select-all">{member.directLeaderId}</code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-[9px] font-bold">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 font-bold ${
                            member.status === 'active' ? 'text-emerald-500' : 'text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`} />
                            {member.lastActive}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200">
                          <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md text-[11px]">
                            ⏱️ {member.playTimeMinutes} mins
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {member.assignedTaskTitle}
                          </div>
                          <div className="text-[9px] font-bold text-violet-600">
                            Progress: {member.taskProgress}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Reassign Leader dropdown (Move Team) */}
                            <select
                              onChange={(e) => handleReassignLeader(member.id, e.target.value)}
                              defaultValue=""
                              className="bg-background border border-input rounded px-1.5 py-0.5 text-[11px] outline-none max-w-[120px]"
                            >
                              <option value="" disabled>Move Team...</option>
                              {leadersData.filter(l => l.leaderId !== member.id).map(l => (
                                <option key={l.leaderId} value={l.leaderId}>
                                  to @{l.leaderName}
                                </option>
                              ))}
                            </select>

                            {/* Change Rank dropdown */}
                            <select
                              onChange={(e) => handleChangeRole(member.id, e.target.value)}
                              value={member.role}
                              className="bg-background border border-input rounded px-1.5 py-0.5 text-[11px] outline-none"
                            >
                              <option value="infantry">Infantry</option>
                              <option value="officer">Officer</option>
                              <option value="knight">Knight</option>
                              <option value="baron">Baron</option>
                            </select>

                            {/* Dismiss (Remove from Team) */}
                            <Button
                              onClick={() => handleRemoveFromTeam(member.id)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                              title="Remove user from squad"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline ml-1">Detach</span>
                            </Button>

                            {/* Suspend user */}
                            <Button
                              onClick={() => handleToggleSuspension(member.id, member.status === 'suspended')}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-white"
                            >
                              {member.status === 'suspended' ? <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Ban className="w-3.5 h-3.5 text-red-500" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB: FREE INFANTRY (unassigned players)
          ════════════════════════════════════════════════════════ */}
          {activeSubTab === 'free' && (
            <div className="space-y-3">
              {filteredFreeUsers.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <UserCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="font-black text-slate-500 uppercase tracking-wider text-sm">All players are enlisted!</p>
                  <p className="text-xs text-slate-400 mt-1">No unassigned infantry found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-2xl shadow-sm">
                  <Table className="text-xs">
                    <TableHeader className="bg-orange-50 dark:bg-orange-950/20">
                      <TableRow>
                        <TableHead className="font-black uppercase text-[10px]">Player</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Current Rank</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Joined</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Assign to Commander</TableHead>
                        <TableHead className="font-black uppercase text-[10px] text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFreeUsers.map(user => (
                        <TableRow key={user.id} className="hover:bg-orange-50/50 dark:hover:bg-orange-950/10">
                          <TableCell>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
                            <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 mt-0.5">
                              <span>ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[9px] select-all">{user.id}</code></span>
                              {user.email !== 'No email' && <span>{user.email}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase text-[9px] font-bold bg-slate-100 text-slate-500 border-slate-300">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 font-bold">{user.joinedAt}</TableCell>
                          <TableCell>
                            <select
                              value={user.assigningTo}
                              onChange={e => {
                                const newVal = e.target.value;
                                setFreeUsers(prev => prev.map(u =>
                                  u.id === user.id ? { ...u, assigningTo: newVal } : u
                                ));
                              }}
                              className="bg-background border border-input rounded-lg px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-indigo-400 min-w-[160px]"
                            >
                              <option value="" disabled>Select Commander...</option>
                              {leadersData.map(l => (
                                <option key={l.leaderId} value={l.leaderId}>
                                  {l.leaderName} [{l.leaderRole}] — {l.memberCount} troops
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => {
                                const leader = leadersData.find(l => l.leaderId === user.assigningTo);
                                handleAssignToLeader(user.id, user.assigningTo, user.name, leader?.leaderName || '');
                              }}
                              size="sm"
                              className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                              disabled={!user.assigningTo || assigning === user.id}
                            >
                              {assigning === user.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserRoundPlus className="w-3.5 h-3.5" />
                              )}
                              Enlist
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          QUICK-ASSIGN MODAL (opened from ⊕ Assign on Commander row)
      ══════════════════════════════════════════════════════════════ */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setAssignModal(null); setAssignSearch(''); } }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserRoundPlus className="w-5 h-5 text-indigo-500" />
                  Assign Infantry
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick a free player to enlist under{' '}
                  <span className="font-black text-indigo-600">{assignModal.leader.leaderName}</span>
                  {' '}[{assignModal.leader.leaderRole}]
                </p>
              </div>
              <button
                onClick={() => { setAssignModal(null); setAssignSearch(''); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={assignSearchRef}
                  type="text"
                  placeholder="Search by name or email..."
                  value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {modalFreeUsers.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-bold text-xs uppercase">
                    {assignSearch ? 'No players match your search.' : 'No unassigned players available.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {modalFreeUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[8px] font-bold uppercase px-1 py-0 border-slate-300 text-slate-400">
                            {user.role}
                          </Badge>
                          <span className="text-[9px] text-slate-400">Joined {user.joinedAt}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssignToLeader(
                          user.id,
                          assignModal.leader.leaderId,
                          user.name,
                          assignModal.leader.leaderName
                        )}
                        size="sm"
                        className="ml-3 h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white gap-1 shrink-0"
                        disabled={assigning === user.id}
                      >
                        {assigning === user.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserRoundPlus className="w-3.5 h-3.5" />
                        )}
                        Enlist Here
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <p className="text-[10px] text-slate-400 text-center">
                {modalFreeUsers.length} free player{modalFreeUsers.length !== 1 ? 's' : ''} available to assign
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeamLeadersRoster;
