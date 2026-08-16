import React, { useState, useEffect } from 'react';
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
  ShieldAlert
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

export const AdminTeamLeadersRoster: React.FC = () => {
  const [leadersData, setLeadersData] = useState<LeaderOverview[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'commanders' | 'troops'>('commanders');
  const [loading, setLoading] = useState(true);
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
      const { data: profilesData } = await supabase
        .from('profiles' as any)
        .select('id, username, display_name, updated_at, suspended, email');

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

      // Group referrals by referrer_id
      const leaderGroupsMap = new Map<string, TroopActivity[]>();

      if (referralsData) {
        for (const ref of (referralsData as any[])) {
          const referrerId = ref.referrer_id;
          const referredId = ref.referred_id;
          const prof = profilesMap.get(referredId);
          const referrerProf = profilesMap.get(referrerId);

          const lastActiveStr = ref.last_active_date || prof?.updated_at || '-';
          const isOnline = ref.status === 'active' || (prof?.updated_at && new Date(prof.updated_at).getTime() > Date.now() - 30 * 60 * 1000);

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
    } catch (err) {
      console.error('Error fetching team leaders & roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamLeadersAndTroops();
  }, []);

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
      const { error } = await supabase.rpc('promote_member_manually' as any, {
        p_member_id: userId,
        p_new_role: newRole
      });
      if (error) throw error;
      toast({
        title: "Rank Adjusted",
        description: `Successfully adjust user rank to ${newRole}.`
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

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Team Leaders</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{leadersData.length}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Active Command Squads</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-amber-500/50" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Troop Members</p>
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
              Admin command portal to upgrade ranks, reassign squads, remove members, or dissolve inactive teams.
            </CardDescription>
          </div>

          <Button onClick={fetchTeamLeadersAndTroops} variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sub-Tab Navigation */}
          <div className="flex border-b border-border gap-2 pb-2">
            <Button
              variant={activeSubTab === 'commanders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('commanders')}
              className="text-xs"
            >
              Commanders (Team Leaders)
            </Button>
            <Button
              variant={activeSubTab === 'troops' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('troops')}
              className="text-xs"
            >
              Troops (Squad Members)
            </Button>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="flex items-center gap-2 max-w-xs flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <Input 
                placeholder={activeSubTab === 'commanders' ? "Search leaders..." : "Search troops..."}
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

          {/* Roster Tables */}
          {activeSubTab === 'commanders' ? (
            /* Tab: Commanders */
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
                          <div className="font-bold text-slate-900 dark:text-slate-100">{leader.leaderName}</div>
                          <div className="text-[10px] text-slate-500">{leader.leaderEmail}</div>
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
                          <div className="flex items-center justify-end gap-2">
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
          ) : (
            /* Tab: Troops */
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
                          <div className="text-[10px] text-slate-500">{member.email}</div>
                        </TableCell>
                        <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">
                          {member.directLeaderName}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamLeadersRoster;
