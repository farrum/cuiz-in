import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { buildReferralLink } from '@/utils/referralLink';
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
  Plus,
  Clock
} from 'lucide-react';
import { useTeamLeaderDashboard } from '@/hooks/useTeamLeaderDashboard';
import { MemberActivityTracker } from '@/components/team-leader/MemberActivityTracker';
import TeamLeaderAttendanceTracker from '@/components/admin/attendance/TeamLeaderAttendanceTracker';
import TeamAnalyticsPanel from '@/components/team-leader/TeamAnalyticsPanel';
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
import { supabase } from '@/integrations/supabase/client';


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
    removeMember,
    handleStatusChange,
    requestAccountAction,
    assignedTasks = [],
    assignTask,
    redistributeTask,
    deleteTask,
    awardBonus,
    joinRequests = [],
    approveJoinRequest,
    rejectJoinRequest,
    currentUserRole,
    currentTeam,
    pendingRequest,
    teamLoading,
    resignFromTeam,
    cancelJoinRequest,
    sendJoinRequest,
  } = useTeamLeaderDashboard(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'mercenaries' | 'analytics' | 'attendance' | 'requests' | 'tasks' | 'recruit'>('mercenaries');
  const [copied, setCopied] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<{ total: number; active: number }>({ total: 0, active: 0 });

  // Search & Join states
  const [leaderSearchQuery, setLeaderSearchQuery] = useState('');
  const [leaderSearchResults, setLeaderSearchResults] = useState<any[]>([]);
  const [searchingLeaders, setSearchingLeaders] = useState(false);
  const [selectedMemberForActivity, setSelectedMemberForActivity] = useState<{ id: string, name: string } | null>(null);

  const handleLeaderSearch = async (query: string) => {
    setLeaderSearchQuery(query);
    if (!query.trim()) {
      setLeaderSearchResults([]);
      return;
    }
    setSearchingLeaders(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, user_roles(role)')
        .ilike('username', `%${query}%`)
        .limit(10);
      if (!error && data) {
        setLeaderSearchResults(data);
      }
    } catch (e) {
      console.error('Error searching leaders:', e);
    } finally {
      setSearchingLeaders(false);
    }
  };

  // Fetch referral stats for non-leader recruit landing page
  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) return;
    supabase
      .from('user_referrals')
      .select('status')
      .eq('referrer_id', userId)
      .then(({ data }) => {
        if (data) {
          setReferralStats({
            total: data.length,
            active: data.filter((r: any) => r.status === 'active').length,
          });
        }
      });
  }, []);

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

  const username = localStorage.getItem('cuizin_username') || localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'baron';
  const inviteLink = buildReferralLink(username);

  const copyInviteLink = async () => {
    // Robust clipboard copy — works in Capacitor Android WebViews
    let didCopy = false;
    try {
      await navigator.clipboard.writeText(inviteLink);
      didCopy = true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = inviteLink;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        didCopy = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    setCopied(true);
    toast({
      title: didCopy ? 'Scroll Copied!' : 'Copy Failed',
      description: didCopy
        ? 'Recruitment scroll link copied to clipboard.'
        : 'Please copy the link manually.',
      variant: didCopy ? undefined : 'destructive',
    });
    setTimeout(() => setCopied(false), 2000);
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

  const handleDismissClick = (memberId: string, name: string) => {
    if (!removeMember) return;
    setConfirmDialog({
      open: true,
      title: "Dismiss Mercenary?",
      description: `Are you sure you want to dismiss ${name} from your team? This action cannot be undone.`,
      action: async () => {
        setActionInProgress(memberId);
        await removeMember(memberId);
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
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3 mx-auto" />
          <p className="text-amber-800 text-[11px] uppercase font-black tracking-widest">Assembling Roster...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // Role helpers
  // ═══════════════════════════════════════════════
  const ROLE_LABEL: Record<string, string> = {
    admin: 'Admin',
    king: 'King',
    baron: 'Baron',
    knight: 'Knight',
    officer: 'Officer',
    team_leader: 'Baron',
    junior_team_leader: 'Officer',
    player: 'Troop',
    infantry: 'Troop',
  };
  const ROLE_BADGE_CLASS: Record<string, string> = {
    admin:              'bg-red-50 border-red-200 text-red-700',
    king:               'bg-amber-50 border-amber-200 text-amber-800',
    baron:              'bg-amber-50 border-amber-200 text-amber-700',
    team_leader:        'bg-amber-50 border-amber-200 text-amber-700',
    knight:             'bg-blue-50 border-blue-200 text-blue-700',
    officer:            'bg-indigo-50 border-indigo-200 text-indigo-700',
    junior_team_leader: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    player:             'bg-slate-100 border-slate-200 text-slate-600',
    infantry:           'bg-slate-100 border-slate-200 text-slate-600',
  };

  const SELF_ROLE_TITLE: Record<string, string> = {
    admin: 'Supreme Command',
    king: 'High King',
    baron: 'Baron\'s War Room',
    team_leader: 'Baron\'s War Room',
    knight: 'Knight\'s War Room',
    officer: 'Officer\'s War Room',
    junior_team_leader: 'Officer\'s War Room',
  };
  const SELF_ROLE_SUBTITLE: Record<string, string> = {
    admin: 'Supreme Commander',
    king: 'High King',
    baron: 'Mercenary Commander',
    team_leader: 'Mercenary Commander',
    knight: 'Knight Commander',
    officer: 'Junior Officer',
    junior_team_leader: 'Junior Officer',
  };

  const selfTitle = SELF_ROLE_TITLE[currentUserRole] || 'War Room';
  const selfSubtitle = SELF_ROLE_SUBTITLE[currentUserRole] || 'Commander';

  // ═══════════════════════════════════════════════
  // Non-leader landing: Recruit page
  // ═══════════════════════════════════════════════
  if (!isLoading && !isTeamLeader) {
    return (
      <div className="relative min-h-full">
        {/* Ambient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />

        {/* Header */}
        <div 
          className="sticky top-0 z-30 backdrop-blur-md border-b border-amber-200/60 px-4 py-2.5 flex items-center gap-3" 
          style={{ background: 'hsl(38 60% 95% / 0.92)' }}
        >
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-amber-100/60 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-amber-905/70" />
        <div className="px-4 pt-5 pb-6 space-y-5 relative z-10 text-slate-800">
          {/* Pledged Alliance (If in team) */}
          {currentTeam ? (
            <div className="bg-white/80 ring-1 ring-black/[0.06] rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Pledged Alliance</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">SQUAD OF @{currentTeam.referrer_name.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-xs font-bold bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between text-slate-700">
                <span>Joined Rank:</span>
                <span className="text-emerald-600 uppercase tracking-widest">{currentUserRole}</span>
              </div>
              <button
                onClick={() => {
                  setConfirmDialog({
                    open: true,
                    title: 'Resign from Squad',
                    description: 'Are you sure you want to resign from your current squad? You will lose your current squad rank and active contracts.',
                    action: async () => {
                      await resignFromTeam();
                    }
                  });
                }}
                className="w-full py-2.5 font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
              >
                Resign from Squad
              </button>
            </div>
          ) : (
            /* Join an Alliance Search / Pending Request (If NOT in team) */
            <>
              {pendingRequest ? (
                <div className="bg-white/80 ring-1 ring-black/[0.06] rounded-3xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Pending Alliance</h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        SENT TO @{(pendingRequest.profiles?.username || pendingRequest.profiles?.display_name || '').toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelJoinRequest(pendingRequest.id)}
                    className="w-full py-2.5 font-black bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs uppercase tracking-widest border border-slate-200 transition-colors"
                  >
                    Cancel Request
                  </button>
                </div>
              ) : (
                <div className="bg-white/80 ring-1 ring-black/[0.06] rounded-3xl p-5 space-y-4 shadow-sm">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Join an Alliance</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                      Search for a team leader by username to request joining their squad.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter leader's username..."
                      value={leaderSearchQuery}
                      onChange={(e) => handleLeaderSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-xl outline-none focus:border-amber-500"
                    />
                  </div>

                  {searchingLeaders ? (
                    <div className="text-center py-4">
                      <div className="w-5 h-5 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                    </div>
                  ) : leaderSearchResults.length > 0 ? (
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto">
                      {leaderSearchResults.map((leader) => (
                        <div key={leader.id} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-black text-slate-800">@{leader.username}</p>
                            {leader.display_name && <p className="text-[9px] text-slate-450 font-bold">{leader.display_name}</p>}
                          </div>
                          <button
                            onClick={() => sendJoinRequest(leader.id, leader.username)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg text-[9px] uppercase tracking-wider shadow-sm"
                            style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
                          >
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : leaderSearchQuery.trim() !== '' && (
                    <p className="text-[10px] text-slate-400 text-center font-bold uppercase">No lords matching this scroll found.</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Invite Link Card */}
          <div className="bg-white/80 ring-1 ring-black/[0.06] rounded-3xl p-5 space-y-4 shadow-sm text-center">
            <Sparkles className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
            <div>
              <h2 className="font-black text-base uppercase tracking-wide text-slate-800">Recruit Infantry</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Share your recruitment scroll across the realm. New players automatically join your ranks and you earn bonus gems when they play!
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <p className="text-xl font-black text-amber-700">{referralStats.total}</p>
                <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Enlisted</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                <p className="text-xl font-black text-emerald-600">{referralStats.active}</p>
                <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Active Duty</p>
              </div>
            </div>

            {/* Progress to Team Leader */}
            {referralStats.active < 10 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-slate-400 font-bold uppercase">Progress to Baron</span>
                  <span className="font-black text-amber-600">{referralStats.active}/10</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                    style={{ width: `${Math.min((referralStats.active / 10) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 text-center mt-2 font-medium">
                  🎯 {10 - referralStats.active} more active recruits to unlock Baron rank!
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <input
                readOnly
                value={inviteLink}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 text-center w-full outline-none"
              />
              <button
                onClick={copyInviteLink}
                className="w-full h-11 font-black text-white rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-sm"
                style={{
                  background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                  boxShadow: '0 3px 0 hsl(30 80% 35%)'
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Copy Recruitment Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />

      {/* Header */}
      <div 
        className="sticky top-0 z-30 backdrop-blur-md border-b border-amber-200/60 px-4 py-2.5 flex items-center gap-3" 
        style={{ background: 'hsl(38 60% 95% / 0.92)' }}
      >
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-amber-100/60 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-amber-900/70" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-[15px] font-black tracking-tight" style={{ color: 'hsl(30 60% 18%)' }}>
            {selfTitle}
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {selfSubtitle}
          </p>
        </div>
        <button
          onClick={() => navigate('/empire-quests')}
          className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-amber-500 text-white shadow-sm"
          style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
        >
          Quests
        </button>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-4 relative z-10 text-slate-800">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white/80 ring-1 ring-black/[0.06] rounded-2xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Infantry Size</span>
              <Users className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-850">{teamMembers.length}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Battalion count</p>
            </div>
          </div>

          <div className="bg-white/80 ring-1 ring-black/[0.06] rounded-2xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Duty</span>
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-black text-emerald-600">{activeMembers}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Online today</p>
            </div>
          </div>
        </div>

        {/* Tactical Navigation Tabs */}
        <div className="flex p-0.5 rounded-xl bg-slate-200/80 border border-slate-350 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterTab('mercenaries')}
            className={`flex-1 min-w-[65px] text-center py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'mercenaries' 
                ? 'bg-white text-amber-900 shadow-sm font-black' 
                : 'text-slate-655 hover:text-slate-800'
            }`}
          >
            ⚔️ Troops
          </button>
          <button
            onClick={() => setFilterTab('analytics')}
            className={`flex-1 min-w-[70px] text-center py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'analytics'
                ? 'bg-white text-amber-900 shadow-sm font-black'
                : 'text-slate-655 hover:text-slate-800'
            }`}
          >
            📊 Stats
          </button>
          <button
            onClick={() => setFilterTab('attendance')}
            className={`flex-1 min-w-[75px] text-center py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'attendance' 
                ? 'bg-white text-amber-900 shadow-sm font-black' 
                : 'text-slate-655 hover:text-slate-800'
            }`}
          >
            📅 Attend
          </button>
          {joinRequests.length > 0 && (
            <button
              onClick={() => setFilterTab('requests')}
              className={`flex-1 min-w-[65px] text-center py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all relative ${
                filterTab === 'requests' 
                  ? 'bg-white text-amber-900 shadow-sm font-black' 
                  : 'text-slate-655 hover:text-slate-800'
              }`}
            >
              📥 Req
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-[7px] font-bold text-white rounded-full flex items-center justify-center border border-white animate-bounce">
                {joinRequests.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setFilterTab('tasks')}
            className={`flex-1 min-w-[70px] text-center py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'tasks' 
                ? 'bg-white text-amber-900 shadow-sm font-black' 
                : 'text-slate-655 hover:text-slate-800'
            }`}
          >
            📜 Quests ({assignedTasks.length})
          </button>
          <button
            onClick={() => setFilterTab('recruit')}
            className={`flex-1 min-w-[65px] text-center py-2 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
              filterTab === 'recruit' 
                ? 'bg-white text-amber-900 shadow-sm font-black' 
                : 'text-slate-655 hover:text-slate-800'
            }`}
          >
            📢 Recruit
          </button>
        </div>

        {/* Tab content: TEAM ANALYTICS */}
        {filterTab === 'analytics' && (
          <TeamAnalyticsPanel
            compact
            members={(teamMembers || []).map((m: any) => ({ id: m.id, name: m.name }))}
          />
        )}

        {/* Tab content: MERCENARIES LIST */}
        {filterTab === 'mercenaries' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-450" />
              <Input
                type="text"
                placeholder="Search mercenary by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9.5 text-xs bg-white border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 bg-white/60 ring-1 ring-black/[0.05] rounded-2xl text-slate-450 font-bold uppercase tracking-wider text-xs">
                    No mercenaries found.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white/80 ring-1 ring-black/[0.06] rounded-2xl p-3.5 space-y-3 relative overflow-hidden shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-800">{member.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                              ROLE_BADGE_CLASS[member.role] || ROLE_BADGE_CLASS['infantry']
                            }`}>
                              {ROLE_LABEL[member.role] || 'Troop'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-450 font-medium">{member.email}</span>
                        </div>

                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                          member.isOnline ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            member.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'
                          }`} />
                          {member.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      {/* Stats Table */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl text-center text-[10px] text-slate-700">
                        <div>
                          <p className="font-bold text-slate-800">{member.gamesPlayed}</p>
                          <p className="text-[8px] text-slate-450 font-bold uppercase">Games</p>
                        </div>
                        <div>
                          <p className="font-bold text-emerald-600">{member.activePlayTime}</p>
                          <p className="text-[8px] text-slate-450 font-bold uppercase">Playtime</p>
                        </div>
                        <div>
                          <p className="font-bold text-amber-600 truncate">{member.activeActivity}</p>
                          <p className="text-[8px] text-slate-450 font-bold uppercase">Activity</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                          Last: {member.lastOnline}
                        </span>

                        <div className="flex gap-2">
                          {isMainTeamLeader && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-[10px] font-bold border-slate-200 text-slate-600 bg-slate-50"
                                >
                                  Promote
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-white border border-slate-200 text-slate-700">
                                <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'officer')} className="hover:bg-slate-50 text-[10px] font-bold cursor-pointer">
                                  Officer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'knight')} className="hover:bg-slate-50 text-[10px] font-bold cursor-pointer">
                                  Knight
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'baron')} className="hover:bg-slate-50 text-[10px] font-bold cursor-pointer">
                                  Baron
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {isMainTeamLeader && member.role !== 'infantry' && (
                            <Button
                              onClick={() => handleDemoteClick(member.id, member.name)}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[10px] font-bold border-slate-200 text-slate-600 bg-slate-50"
                            >
                              Demote
                            </Button>
                          )}
                          {isMainTeamLeader && (
                            <Button
                              onClick={() => handleDismissClick(member.id, member.name)}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[10px] font-bold border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100/50"
                            >
                              Dismiss
                            </Button>
                          )}
                          <Button
                            onClick={() => setSelectedMemberForActivity({ id: member.id, name: member.name })}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-[10px] font-bold border-sky-200 text-sky-600 bg-sky-50 hover:bg-sky-100/50"
                          >
                            Activity
                          </Button>
                          <Button
                            onClick={() => setSelectedMemberForBonus({ id: member.id, name: member.name })}
                            size="sm"
                            className="h-7 px-2.5 text-[10px] font-black text-white rounded-xl shadow-sm"
                            style={{ background: 'linear-gradient(160deg, #FFD54F 0%, #FFB300 100%)' }}
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
          <div className="space-y-3 text-slate-800">
            <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider">
              📅 Troop Daily Attendance & Check-ins
            </h3>
            <div className="bg-white/80 ring-1 ring-black/[0.06] rounded-2xl p-4 shadow-sm overflow-hidden text-slate-800">
              <TeamLeaderAttendanceTracker />
            </div>
          </div>
        )}

        {/* Tab content: JOIN REQUESTS */}
        {filterTab === 'requests' && (
          <div className="space-y-3 text-slate-800">
            <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider">
              Pending Join Requests
            </h3>
            
            {joinRequests.length === 0 ? (
              <div className="text-center py-12 bg-white/60 ring-1 ring-black/[0.05] rounded-3xl text-slate-400 font-bold uppercase tracking-wider text-xs">
                No pending requests.
              </div>
            ) : (
              joinRequests.map((req: any) => (
                <div key={req.id} className="bg-white/80 ring-1 ring-black/[0.06] rounded-2xl p-4 flex justify-between items-center shadow-sm text-slate-800">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {req.profiles?.display_name || req.profiles?.username}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Requested: {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approveJoinRequest(req.id)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs rounded-xl"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => rejectJoinRequest(req.id)}
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 text-xs rounded-xl"
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
          <div className="space-y-4 text-slate-800">
            {/* Mobile Task Creation Workshop */}
            <div className="bg-white/80 ring-1 ring-black/[0.06] rounded-2xl p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Assign New Quest
              </h3>

              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Quest Title</label>
                  <Input 
                    placeholder="e.g. Daily Siege" 
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-800 h-8.5 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Description</label>
                  <textarea 
                    placeholder="e.g. Complete 5 trivia battles" 
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2 outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Type</label>
                    <select 
                      value={taskType}
                      onChange={e => setTaskType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-1.5 h-8.5 text-xs outline-none"
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
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-1.5 h-8.5 text-xs outline-none"
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
                      className="bg-slate-50 border-slate-200 text-slate-800 h-8.5 text-xs rounded-xl"
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
                      className="bg-slate-50 border-slate-200 text-slate-800 h-8.5 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Reward ⭐ Stars</label>
                    <Input 
                      type="number"
                      value={rewardStars}
                      onChange={e => setRewardStars(Number(e.target.value))}
                      className="bg-slate-50 border-slate-200 text-slate-800 h-8.5 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Assignee</label>
                    <select 
                      value={assignedTo}
                      onChange={e => setAssignedTo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-1.5 h-8.5 text-xs outline-none"
                    >
                      <option value="all">All Troops</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full text-white font-black uppercase h-9 rounded-xl border-0 text-xs shadow-sm"
                  style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}>
                  ⚔️ Assign Quest to Troops
                </Button>
              </form>
            </div>

            <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider">
              Active Mercenary Quests ({assignedTasks.length})
            </h3>
            
            {assignedTasks.length === 0 ? (
              <div className="text-center py-8 bg-white/60 ring-1 ring-black/[0.05] rounded-2xl text-slate-400 font-bold uppercase tracking-wider text-xs">
                No active contracts. Assign a quest using the form above!
              </div>
            ) : (
              assignedTasks.map(task => (
                <div key={task.id} className="bg-white/80 ring-1 ring-black/[0.06] rounded-2xl p-4 space-y-3 shadow-sm text-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-850 text-xs block">{task.title}</span>
                      <span className="text-[10px] text-slate-450 font-medium block mt-0.5">{task.description}</span>
                    </div>
                    <Button 
                      onClick={() => deleteTask(task.id)}
                      variant="ghost" 
                      className="text-rose-550 hover:text-rose-600 h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase">
                    <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600">
                      {task.frequency || 'daily'}
                    </span>
                    <span className="bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-lg text-sky-700">
                      Gems: +{task.rewardGems}
                    </span>
                    <span className="bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-amber-700">
                      Stars: +{task.rewardStars}
                    </span>
                    <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg text-indigo-700">
                      {task.shardType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100 text-slate-450 font-bold">
                    <span>Assignee: {task.assignedToName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-700 font-black">Target: {task.targetCount}</span>
                      <Button
                        onClick={() => redistributeTask(task, 'all')}
                        size="sm"
                        className="h-6 px-2 text-[9px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg"
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
          <Card className="bg-white/80 ring-1 ring-black/[0.06] text-center p-6 rounded-3xl space-y-4 shadow-sm text-slate-800">
            <CardContent className="p-0 space-y-4">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase">Recruit Infantry</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Share this recruitment scroll across the realm. New players automatically join your mercenary ranks!
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Input 
                  readOnly 
                  value={inviteLink}
                  className="bg-slate-50 border-slate-200 text-slate-850 text-xs h-9 rounded-xl text-center"
                />
                <Button 
                  onClick={copyInviteLink} 
                  className="h-9 font-black text-white rounded-xl border-0 flex items-center justify-center gap-1.5 shadow-sm"
                  style={{
                    background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                    boxShadow: '0 3px 0 hsl(30 80% 35%)'
                  }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Recruitment Link'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* GRANT BONUS TRIBUTE DIALOG */}
      {selectedMemberForBonus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 ring-1 ring-black/[0.08] shadow-2xl rounded-3xl p-5 w-full max-w-xs text-slate-800 space-y-4">
            <div className="text-center">
              <Sparkles className="w-7 h-7 text-amber-500 mx-auto mb-1 animate-bounce" />
              <h3 className="text-sm font-black uppercase text-amber-900 tracking-wider">
                Grant Tribute
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Reward <span className="text-slate-850 font-bold">{selectedMemberForBonus.name}</span> for exceptional service.</p>
            </div>

            <form onSubmit={handleGrantBonusSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-450 block flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" /> Star Currency
                </label>
                <Input 
                  type="number"
                  min={1}
                  value={bonusStars}
                  onChange={e => setBonusStars(Number(e.target.value))}
                  className="bg-slate-50 border-slate-205 text-slate-800 text-xs h-8.5 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-450 block flex items-center gap-0.5">
                  <Coins className="w-3.5 h-3.5 text-amber-600" /> Gold Gems
                </label>
                <Input 
                  type="number"
                  min={1}
                  value={bonusGems}
                  onChange={e => setBonusGems(Number(e.target.value))}
                  className="bg-slate-50 border-slate-205 text-slate-800 text-xs h-8.5 rounded-lg"
                />
              </div>

              <div className="flex gap-2.5">
                <Button 
                  type="button" 
                  onClick={() => setSelectedMemberForBonus(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase py-1.5 h-8.5 rounded-lg border border-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 text-white font-black uppercase py-1.5 h-8.5 rounded-lg border-0 shadow-sm"
                  style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
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
          <AlertDialogContent className="w-[90%] max-w-xs rounded-3xl bg-white border border-slate-200 text-slate-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-amber-900 font-black uppercase tracking-wider text-sm">{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500 text-xs font-medium">{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 mt-4 text-xs">
              <AlertDialogCancel onClick={() => setConfirmDialog(null)} className="flex-1 rounded-xl mt-0 bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  const action = confirmDialog.action;
                  setConfirmDialog(null);
                  await action();
                }}
                className="flex-1 rounded-xl text-white font-black"
                style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Activity Tracker */}
      <MemberActivityTracker
        memberId={selectedMemberForActivity?.id || ''}
        memberName={selectedMemberForActivity?.name || ''}
        isOpen={!!selectedMemberForActivity}
        onClose={() => setSelectedMemberForActivity(null)}
      />
    </div>
  );
}
