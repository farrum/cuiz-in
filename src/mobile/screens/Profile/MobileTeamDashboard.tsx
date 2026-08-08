import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  UserCheck, 
  Play, 
  Award, 
  Copy, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  Check, 
  X,
  ClipboardList,
  Sparkles,
  Coins,
  Star,
  CalendarDays,
  Plus
} from 'lucide-react';
import { useTeamLeaderDashboard } from '@/hooks/useTeamLeaderDashboard';
import TeamLeaderAttendanceTracker from '@/components/admin/attendance/TeamLeaderAttendanceTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { BurningTorch } from '@/components/gamification/BurningTorch';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MobileTeamDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isTeamLeader,
    activeMembers,
    teamMembers = [],
    isLoading,
    isMainTeamLeader,
    promoteToJunior,
    demoteToPlayer,
    handleStatusChange,
    requestAccountAction,
    assignedTasks = [],
    assignTask,
    redistributeTask,
    deleteTask,
    awardBonus,
    joinRequests = [],
    approveJoinRequest,
    rejectJoinRequest
  } = useTeamLeaderDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'mercenaries' | 'attendance' | 'requests' | 'tasks' | 'recruit'>('mercenaries');
  const [copied, setCopied] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Contract Creator state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskTarget, setTaskTarget] = useState(5);
  const [taskType, setTaskType] = useState<'quests' | 'games' | 'riddles'>('quests');
  const [taskFrequency, setTaskFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [rewardGems, setRewardGems] = useState(50);
  const [rewardStars, setRewardStars] = useState(10);
  const [assignedTo, setAssignedTo] = useState('all');

  // Grant Bonus Modal states
  const [selectedMemberForBonus, setSelectedMemberForBonus] = useState<{ id: string, name: string } | null>(null);
  const [bonusStars, setBonusStars] = useState(25);
  const [bonusGems, setBonusGems] = useState(100);

  // AlertDialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const username = localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'baron';
  const inviteLink = `${window.location.origin}/register?ref=${username}`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Scroll Copied!",
        description: "Recruitment scroll link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        variant: "destructive"
      });
    }
  };

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const nameMatch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = member.email.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || emailMatch;
    });
  }, [teamMembers, searchQuery]);

  const totalPlays = useMemo(() => {
    return teamMembers.reduce((acc, m) => acc + (m.gamesPlayed || 0), 0);
  }, [teamMembers]);

  const handlePromoteClick = (memberId: string, name: string) => {
    if (!promoteToJunior) return;
    setConfirmDialog({
      open: true,
      title: "Commission as Officer?",
      description: `Are you sure you want to promote ${name} to Officer rank? they will be authorized to lead their own sub-squads.`,
      action: async () => {
        setActionInProgress(memberId);
        await promoteToJunior(memberId);
        setActionInProgress(null);
      }
    });
  };

  const handleDemoteClick = (memberId: string, name: string) => {
    if (!demoteToPlayer) return;
    setConfirmDialog({
      open: true,
      title: "Demote to Infantry?",
      description: `Are you sure you want to demote Officer ${name} back to regular Infantry?`,
      action: async () => {
        setActionInProgress(memberId);
        await demoteToPlayer(memberId);
        setActionInProgress(null);
      }
    });
  };

  const handleGrantBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForBonus) return;
    await awardBonus(selectedMemberForBonus.id, selectedMemberForBonus.name, Number(bonusStars), Number(bonusGems));
    setSelectedMemberForBonus(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDesc.trim()) {
      toast({ title: "Invalid Task", description: "Please complete all fields.", variant: "destructive" });
      return;
    }
    const assigneeName = assignedTo === 'all' 
      ? 'All Mercenaries' 
      : teamMembers.find(m => m.id === assignedTo)?.name || 'Mercenary';

    assignTask({
      title: taskTitle,
      description: taskDesc,
      targetCount: Number(taskTarget),
      type: taskType,
      frequency: taskFrequency,
      rewardGems: Number(rewardGems),
      rewardStars: Number(rewardStars),
      rewardShards: 1,
      shardType: 'Socrates',
      assignedTo,
      assignedToName: assigneeName
    });

    setTaskTitle('');
    setTaskDesc('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen stone-wall flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Assembling Roster...</p>
      </div>
    );
  }

  if (!isTeamLeader) {
    return null;
  }

  return (
    <div className="min-h-screen stone-wall text-slate-100 pb-36 relative overflow-x-hidden">
      
      {/* Decorative Torches */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <BurningTorch className="absolute top-16 left-2 scale-50 opacity-40" />
        <BurningTorch className="absolute top-16 right-2 scale-50 opacity-40" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 wooden-door px-4 py-3 flex items-center gap-3 shadow-md">
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/profile')}
          className="p-1.5 rounded-full hover:bg-stone-850"
        >
          <ArrowLeft className="w-5 h-5 text-slate-200" />
        </motion.button>
        <div>
          <h1 className="text-sm font-black uppercase text-white tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>
            Baron War Room
          </h1>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            {isMainTeamLeader ? 'Mercenary Commander' : 'Junior Officer'}
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 relative z-10">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Infantry Size</span>
              <Users className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-black text-white">{teamMembers.length}</p>
              <p className="text-[8px] text-slate-500 uppercase mt-0.5">Battalion count</p>
            </div>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Duty</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-black text-emerald-400">{activeMembers}</p>
              <p className="text-[8px] text-slate-500 uppercase mt-0.5">Online today</p>
            </div>
          </div>
        </div>

        {/* Tactical Navigation Tabs */}
        <div className="flex p-0.5 rounded-xl bg-stone-950 border border-stone-850 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterTab('mercenaries')}
            className={`flex-1 min-w-[75px] text-center py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'mercenaries' 
                ? 'bg-amber-500 text-stone-950 font-black' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            ⚔️ Troops
          </button>
          <button
            onClick={() => setFilterTab('attendance')}
            className={`flex-1 min-w-[85px] text-center py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'attendance' 
                ? 'bg-amber-500 text-stone-950 font-black' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📅 Attendance
          </button>
          {joinRequests.length > 0 && (
            <button
              onClick={() => setFilterTab('requests')}
              className={`flex-1 min-w-[75px] text-center py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all relative ${
                filterTab === 'requests' 
                  ? 'bg-amber-500 text-stone-950 font-black' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              📥 Requests
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-650 text-[8px] font-bold text-white rounded-full flex items-center justify-center border border-stone-900 animate-bounce">
                {joinRequests.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setFilterTab('tasks')}
            className={`flex-1 min-w-[80px] text-center py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'tasks' 
                ? 'bg-amber-500 text-stone-950 font-black' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📜 Quests ({assignedTasks.length})
          </button>
          <button
            onClick={() => setFilterTab('recruit')}
            className={`flex-1 min-w-[70px] text-center py-2 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'recruit' 
                ? 'bg-amber-500 text-stone-950 font-black' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            📢 Recruit
          </button>
        </div>

        {/* Tab content: MERCENARIES LIST */}
        {filterTab === 'mercenaries' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
              <Input
                type="text"
                placeholder="Search mercenary by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9.5 text-xs bg-stone-900 border-stone-800 text-white placeholder-stone-600 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 bg-stone-900 border border-stone-800 rounded-2xl text-slate-500 font-bold uppercase tracking-wider text-xs">
                    No mercenaries found.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-white">{member.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                              member.role === 'baron' ? 'bg-amber-950/40 border-amber-900 text-amber-300' :
                              member.role === 'knight' ? 'bg-blue-950/40 border-blue-900 text-blue-300' :
                              member.role === 'officer' ? 'bg-indigo-950/40 border-indigo-900 text-indigo-300' :
                              'bg-stone-950 border-stone-800 text-slate-400'
                            }`}>
                              {member.role === 'baron' ? 'Baron' :
                               member.role === 'knight' ? 'Knight' :
                               member.role === 'officer' ? 'Officer' : 'Infantry'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{member.email}</span>
                        </div>

                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                          member.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            member.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`} />
                          {member.status === 'active' ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      {/* Stats Table */}
                      <div className="grid grid-cols-3 gap-2 bg-stone-950 p-2 rounded-xl text-center text-[10px]">
                        <div>
                          <p className="font-bold text-white">{member.gamesPlayed}</p>
                          <p className="text-[8px] text-slate-500">Games</p>
                        </div>
                        <div>
                          <p className="font-bold text-emerald-400">{member.activePlayTime}</p>
                          <p className="text-[8px] text-slate-500">Playtime</p>
                        </div>
                        <div>
                          <p className="font-bold text-amber-500 truncate">{member.activeActivity}</p>
                          <p className="text-[8px] text-slate-500">Activity</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-stone-850">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">
                          Last: {member.lastOnline}
                        </span>

                        <div className="flex gap-2">
                          {isMainTeamLeader && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-[10px] font-bold border-stone-700 text-stone-300 bg-stone-850"
                                >
                                  Promote
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-stone-900 border border-stone-800 text-slate-200">
                                <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'officer')} className="hover:bg-stone-850 text-[10px] font-bold cursor-pointer">
                                  Officer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'knight')} className="hover:bg-stone-850 text-[10px] font-bold cursor-pointer">
                                  Knight
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'baron')} className="hover:bg-stone-850 text-[10px] font-bold cursor-pointer">
                                  Baron
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {isMainTeamLeader && member.role !== 'infantry' && (
                            <Button
                              onClick={() => demoteToPlayer(member.id)}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[10px] font-bold border-stone-700 text-stone-300 bg-stone-850"
                            >
                              Demote
                            </Button>
                          )}
                          <Button
                            onClick={() => setSelectedMemberForBonus({ id: member.id, name: member.name })}
                            size="sm"
                            className="h-7 px-2.5 text-[10px] font-black bg-yellow-500 hover:bg-yellow-600 text-stone-950"
                          >
                            Tribute
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Tab content: ATTENDANCE */}
        {filterTab === 'attendance' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">
              📅 Troop Daily Attendance & Check-ins
            </h3>
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2 shadow-md">
              <TeamLeaderAttendanceTracker />
            </div>
          </div>
        )}

        {/* Tab content: JOIN REQUESTS */}
        {filterTab === 'requests' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">
              Pending Join Requests
            </h3>
            
            {joinRequests.length === 0 ? (
              <div className="text-center py-12 bg-stone-900 border border-stone-800 rounded-3xl text-slate-500 font-bold uppercase tracking-wider text-xs">
                No pending requests.
              </div>
            ) : (
              joinRequests.map((req: any) => (
                <div key={req.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex justify-between items-center shadow-md">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {req.profiles?.display_name || req.profiles?.username}
                    </h4>
                    <p className="text-[9px] text-slate-500">
                      Requested: {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveJoinRequest(req.id)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectJoinRequest(req.id)}
                      size="sm"
                      className="bg-red-650 hover:bg-red-700 text-white font-bold h-8 text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab content: CONTRACTS LIST */}
        {filterTab === 'tasks' && (
          <div className="space-y-4">
            {/* Mobile Task Creation Workshop */}
            <div className="bg-stone-900/90 border-2 border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
              <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Assign New Quest
              </h3>

              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Quest Title</label>
                  <Input 
                    placeholder="e.g. Daily Siege" 
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    className="bg-stone-950 border-stone-800 text-white h-8.5 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Description</label>
                  <textarea 
                    placeholder="e.g. Complete 5 trivia battles" 
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-stone-950 border border-stone-800 text-white text-xs rounded-xl p-2 outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Type</label>
                    <select 
                      value={taskType}
                      onChange={e => setTaskType(e.target.value as any)}
                      className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl p-1.5 h-8.5 text-xs outline-none"
                    >
                      <option value="quests">Quests</option>
                      <option value="games">Games</option>
                      <option value="riddles">Riddles</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Recurrence</label>
                    <select 
                      value={taskFrequency}
                      onChange={e => setTaskFrequency(e.target.value as any)}
                      className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl p-1.5 h-8.5 text-xs outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Target</label>
                    <Input 
                      type="number"
                      min={1}
                      value={taskTarget}
                      onChange={e => setTaskTarget(Number(e.target.value))}
                      className="bg-stone-950 border-stone-800 text-white h-8.5 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Reward Gems</label>
                    <Input 
                      type="number"
                      value={rewardGems}
                      onChange={e => setRewardGems(Number(e.target.value))}
                      className="bg-stone-950 border-stone-800 text-white h-8.5 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Assignee</label>
                    <select 
                      value={assignedTo}
                      onChange={e => setAssignedTo(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl p-1.5 h-8.5 text-xs outline-none"
                    >
                      <option value="all">All Troops</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black uppercase h-9 rounded-xl border-0 text-xs">
                  ⚔️ Assign Quest to Troops
                </Button>
              </form>
            </div>

            <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">
              Active Mercenary Quests ({assignedTasks.length})
            </h3>
            
            {assignedTasks.length === 0 ? (
              <div className="text-center py-8 bg-stone-900 border border-stone-800 rounded-2xl text-slate-500 font-bold uppercase tracking-wider text-xs">
                No active contracts. Assign a quest using the form above!
              </div>
            ) : (
              assignedTasks.map(task => (
                <div key={task.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-xs block">{task.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{task.description}</span>
                    </div>
                    <Button 
                      onClick={() => deleteTask(task.id)}
                      variant="ghost" 
                      className="text-red-400 hover:text-red-500 h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase">
                    <span className="bg-stone-950 border border-violet-500/25 px-2 py-0.5 rounded-lg text-violet-400">
                      {task.frequency || 'daily'}
                    </span>
                    <span className="bg-stone-950 border border-amber-500/25 px-2 py-0.5 rounded-lg text-amber-500">
                      Gems: +{task.rewardGems}
                    </span>
                    <span className="bg-stone-950 border border-yellow-500/25 px-2 py-0.5 rounded-lg text-yellow-400">
                      Stars: +{task.rewardStars}
                    </span>
                    <span className="bg-stone-950 border border-blue-500/25 px-2 py-0.5 rounded-lg text-blue-400">
                      {task.shardType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-stone-850 text-slate-500 font-semibold">
                    <span>Assignee: {task.assignedToName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 font-black">Target: {task.targetCount}</span>
                      <Button
                        onClick={() => redistributeTask(task, 'all')}
                        size="sm"
                        className="h-6 px-2 text-[9px] font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg"
                      >
                        ↪️ Cascade to Troops
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab content: RECRUIT */}
        {filterTab === 'recruit' && (
          <Card className="border-4 border-double border-amber-500/25 bg-stone-900/90 text-center p-6 rounded-3xl space-y-4">
            <CardContent className="p-0 space-y-4">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-white uppercase">Recruit Infantry</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Share this recruitment scroll across the realm. New players automatically join your mercenary ranks!
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Input 
                  readOnly 
                  value={inviteLink}
                  className="bg-stone-950 border-stone-800 text-white text-xs h-9 rounded-xl text-center"
                />
                <Button 
                  onClick={copyInviteLink} 
                  className="h-9 font-black bg-yellow-500 hover:bg-yellow-600 text-stone-950 rounded-xl border-0 flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied Ledger' : 'Copy Recruitment Scroll'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* GRANT BONUS TRIBUTE DIALOG */}
      {selectedMemberForBonus && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border-4 border-double border-amber-500/35 rounded-3xl p-5 w-full max-w-xs text-slate-100 space-y-4">
            <div className="text-center">
              <Sparkles className="w-7 h-7 text-yellow-500 mx-auto mb-1 animate-bounce" />
              <h3 className="text-sm font-black uppercase text-amber-500 tracking-wider">
                Grant Tribute
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Reward <span className="text-white font-bold">{selectedMemberForBonus.name}</span> for exception service.</p>
            </div>

            <form onSubmit={handleGrantBonusSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400" /> Star Currency
                </label>
                <Input 
                  type="number"
                  min={1}
                  value={bonusStars}
                  onChange={e => setBonusStars(Number(e.target.value))}
                  className="bg-stone-950 border-stone-800 text-white text-xs h-8.5 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-0.5">
                  <Coins className="w-3.5 h-3.5 text-amber-500" /> Gold Gems
                </label>
                <Input 
                  type="number"
                  min={1}
                  value={bonusGems}
                  onChange={e => setBonusGems(Number(e.target.value))}
                  className="bg-stone-950 border-stone-800 text-white text-xs h-8.5 rounded-lg"
                />
              </div>

              <div className="flex gap-2.5">
                <Button 
                  type="button" 
                  onClick={() => setSelectedMemberForBonus(null)}
                  className="flex-1 bg-stone-850 hover:bg-stone-800 text-slate-300 font-bold uppercase py-1.5 h-8.5 rounded-lg border border-stone-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black uppercase py-1.5 h-8.5 rounded-lg border-0"
                >
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <AlertDialogContent className="w-[90%] max-w-xs rounded-3xl bg-stone-900 border border-stone-800 text-slate-100">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-amber-500 font-black uppercase tracking-wider text-sm">{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 text-xs">{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 mt-4 text-xs">
              <AlertDialogCancel onClick={() => setConfirmDialog(null)} className="flex-1 rounded-xl mt-0 bg-stone-850 hover:bg-stone-800 border-stone-700 text-slate-300">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  const action = confirmDialog.action;
                  setConfirmDialog(null);
                  await action();
                }}
                className="flex-1 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
