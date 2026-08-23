import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageLayout from '@/components/layout/PageLayout';
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
  Clock,
  Trash2
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

export default function TeamLeaderDashboardPage() {
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
  const [activeTab, setActiveTab] = useState<'mercenaries' | 'analytics' | 'attendance' | 'requests' | 'tasks' | 'recruit'>('mercenaries');
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

  // Fetch referral stats
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

  const handlePromoteClick = (memberId: string, name: string, role: string = 'officer') => {
    if (!promoteToJunior) return;
    setConfirmDialog({
      open: true,
      title: `Commission as ${role.toUpperCase()}?`,
      description: `Are you sure you want to promote ${name} to ${role.toUpperCase()} rank? They will be authorized to lead their own sub-squads.`,
      action: async () => {
        setActionInProgress(memberId);
        await promoteToJunior(memberId, role);
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
      <div className="min-h-screen stone-wall flex flex-col items-center justify-center text-foreground">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Assembling War Council...</p>
      </div>
    );
  }

  // Role helpers
  const BARON_OR_ABOVE = ['baron', 'team_leader', 'king', 'admin'];
  const hasBaronRank = BARON_OR_ABOVE.includes(String(currentUserRole || '').toLowerCase()) || isTeamLeader || isMainTeamLeader;

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
    admin:              'bg-red-955 border-red-800 text-red-400',
    king:               'bg-amber-955 border-amber-800 text-amber-500',
    baron:              'bg-amber-955 border-amber-800 text-amber-500',
    team_leader:        'bg-amber-955 border-amber-800 text-amber-500',
    knight:             'bg-blue-955 border-blue-800 text-blue-400',
    officer:            'bg-indigo-955 border-indigo-800 text-indigo-400',
    junior_team_leader: 'bg-indigo-955 border-indigo-800 text-indigo-400',
    player:             'bg-stone-955 border-stone-800 text-slate-400',
    infantry:           'bg-stone-955 border-stone-800 text-slate-400',
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

  const officersCount = teamMembers.filter(m => ['officer', 'junior_team_leader', 'knight', 'baron'].includes(m.role)).length;

  // Non-leader landing: Recruit / Squad Search page
  if (!isTeamLeader) {
    return (
      <PageLayout showNewsTicker={false}>
        <div className="min-h-screen stone-wall text-foreground pb-16 relative">
          {/* Header */}
          <div className="wooden-door py-4 px-6 relative z-10 shadow-md flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-500" />
              <div>
                <h1 className="text-lg font-black tracking-tight text-white uppercase font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  Squad Recruitment
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Build your Mercenary Ranks</p>
              </div>
            </div>
            <Button onClick={() => navigate('/profile')} className="medieval-btn text-xs font-black uppercase py-2 h-9 px-4">
              Return to Castle
            </Button>
          </div>

          <div className="max-w-4xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
            {/* Left Column: Squad Pledge or Leader Search */}
            <div className="md:col-span-6 space-y-6">
              {currentTeam ? (
                <div className="bg-stone-900/95 border-4 border-double border-amber-500/20 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-955 border border-emerald-800 flex items-center justify-center text-emerald-500">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wider text-amber-500" style={{ fontFamily: "'Cinzel', serif" }}>Pledged Alliance</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">SQUAD OF @{currentTeam.referrer_name.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-xs font-bold bg-stone-950 border border-stone-850 p-3.5 rounded-2xl flex items-center justify-between text-slate-300">
                    <span>Joined Rank:</span>
                    <span className="text-emerald-500 uppercase tracking-widest font-black">{currentUserRole.replace('_', ' ')}</span>
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
                    className="w-full py-3 font-black bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
                  >
                    Resign from Squad
                  </button>
                </div>
              ) : (
                <div className="bg-stone-900/95 border-4 border-double border-amber-500/20 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-amber-500" style={{ fontFamily: "'Cinzel', serif" }}>Join an Alliance</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 leading-relaxed">
                      Search for a team leader by username to request joining their squad.
                    </p>
                  </div>
                  
                  {pendingRequest ? (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-3 bg-stone-950 border border-stone-850 p-4 rounded-2xl">
                        <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">Pending Alliance Request</p>
                          <p className="text-[10px] text-slate-550 font-black mt-0.5">
                            SENT TO @{(pendingRequest.profiles?.username || pendingRequest.profiles?.display_name || '').toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelJoinRequest(pendingRequest.id)}
                        className="w-full py-2.5 font-black bg-stone-800 hover:bg-stone-700 text-slate-300 rounded-xl text-xs uppercase tracking-widest border border-stone-700 transition-colors"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                          type="text"
                          placeholder="Enter leader's username..."
                          value={leaderSearchQuery}
                          onChange={(e) => handleLeaderSearch(e.target.value)}
                          className="pl-9 bg-stone-950 border-stone-800 text-white shadow-inner"
                        />
                      </div>

                      {searchingLeaders ? (
                        <div className="text-center py-4">
                          <div className="w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                        </div>
                      ) : leaderSearchResults.length > 0 ? (
                        <div className="bg-stone-950 border border-stone-850 rounded-2xl overflow-hidden divide-y divide-stone-900 max-h-48 overflow-y-auto">
                          {leaderSearchResults.map((leader) => (
                            <div key={leader.id} className="p-3 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-black text-white">@{leader.username}</p>
                                {leader.display_name && <p className="text-[9px] text-slate-450 font-bold">{leader.display_name}</p>}
                              </div>
                              <button
                                onClick={() => sendJoinRequest(leader.id, leader.username)}
                                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg text-[9px] uppercase tracking-wider shadow-sm"
                                style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
                              >
                                Join
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : leaderSearchQuery.trim() !== '' && (
                        <p className="text-[10px] text-slate-500 text-center font-bold uppercase">No lords matching this scroll found.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Recruitment Info */}
            <div className="md:col-span-6 space-y-6">
              <div className="bg-stone-900/95 border-4 border-double border-amber-500/20 rounded-3xl p-6 text-center space-y-4 shadow-xl">
                <Sparkles className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                <div>
                  <h2 className="font-black text-base uppercase tracking-wide text-amber-500" style={{ fontFamily: "'Cinzel', serif" }}>Recruit Infantry</h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Share your recruitment scroll across the realm. New players automatically join your ranks and you earn bonus gems when they play!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-stone-950 border border-stone-850 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-amber-500">{referralStats.total}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Enlisted</p>
                  </div>
                  <div className="bg-stone-950 border border-stone-850 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-emerald-500">{referralStats.active}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5">Active Duty</p>
                  </div>
                </div>

                {hasBaronRank ? (
                  <div className="bg-amber-955/20 border border-amber-800/40 rounded-2xl p-3.5 text-center">
                    <p className="text-[11px] font-black uppercase tracking-wide text-amber-400">Baron Rank Unlocked 👑</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">Keep recruiting to grow your squad.</p>
                  </div>
                ) : referralStats.active < 10 && (
                  <div className="bg-amber-955/20 border border-amber-800/30 rounded-2xl p-4">
                    <div className="flex justify-between text-[10px] mb-2 font-bold text-slate-400">
                      <span className="uppercase">Progress to Baron</span>
                      <span className="text-amber-500">{referralStats.active}/10</span>
                    </div>
                    <div className="h-2 bg-stone-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                        style={{ width: `${Math.min((referralStats.active / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2 font-semibold">
                      🎯 {10 - referralStats.active} more active recruits to unlock Baron rank!
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 pt-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="bg-stone-955 border border-stone-850 text-slate-350 text-xs rounded-xl px-3 py-2 text-center w-full outline-none"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="w-full h-11 font-black text-stone-950 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-md"
                    style={{
                      background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                    }}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Link Copied!' : 'Copy Recruitment Scroll'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm dialogue */}
          {confirmDialog && (
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
              <AlertDialogContent className="bg-stone-900 border border-stone-800 text-slate-200 w-[95%] max-w-sm rounded-3xl animate-in fade-in-50 zoom-in-90 duration-200">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-amber-500 font-black uppercase tracking-wider text-sm">{confirmDialog.title}</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400 text-xs font-semibold">{confirmDialog.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row gap-2 mt-4 text-xs">
                  <AlertDialogCancel onClick={() => setConfirmDialog(null)} className="flex-1 rounded-xl mt-0 bg-stone-850 hover:bg-stone-800 border-stone-700 text-slate-350">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const action = confirmDialog.action;
                      setConfirmDialog(null);
                      await action();
                    }}
                    className="flex-1 rounded-xl text-stone-950 font-black"
                    style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </PageLayout>
    );
  }

  // Leader dashboard landing
  return (
    <PageLayout showNewsTicker={false}>
      <div className="min-h-screen stone-wall text-foreground pb-16 relative">
        
        {/* WAR ROOM TOP BAR */}
        <div className="wooden-door py-4 px-6 relative z-10 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                {selfTitle}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selfSubtitle} War Council</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => navigate('/profile')} className="medieval-btn text-xs font-black uppercase py-2 h-9 px-4">
              Return to Castle
            </Button>
          </div>
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8 relative">
          
          {/* BACKGROUND DECORATIVE FLAME TORCHES */}
          <div className="absolute top-0 -left-6 opacity-30 pointer-events-none hidden md:block">
            <BurningTorch className="scale-75" />
          </div>
          <div className="absolute top-0 -right-6 opacity-30 pointer-events-none hidden md:block">
            <BurningTorch className="scale-75" />
          </div>

          {/* STATS BANNER */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-stone-900/90 border border-stone-850 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Infantry</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{teamMembers.length}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">Mercenary Battalion</p>
              </div>
            </div>

            <div className="bg-stone-900/90 border border-stone-850 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Duty</span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400">{activeMembers}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">Online Today</p>
              </div>
            </div>

            <div className="bg-stone-900/90 border border-stone-850 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Quests</span>
                <ClipboardList className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-violet-400">{assignedTasks.length}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">Assigned Contracts</p>
              </div>
            </div>

            <div className="bg-stone-900/90 border border-stone-850 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Officers</span>
                <Award className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-blue-450">{officersCount}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">Junior Leaders</p>
              </div>
            </div>
          </div>

          {/* TAB TACTICAL SELECTOR */}
          <div className="flex justify-center">
            <div className="flex gap-2 bg-stone-900/90 border border-stone-850 p-1.5 rounded-2xl items-center shadow-lg overflow-x-auto scrollbar-none max-w-full">
              <button
                onClick={() => setActiveTab('mercenaries')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center shrink-0 ${
                  activeTab === 'mercenaries' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                ⚔️ Troops
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center shrink-0 ${
                  activeTab === 'analytics' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                📊 Stats
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center shrink-0 ${
                  activeTab === 'attendance' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                📅 Attend
              </button>
              {joinRequests.length > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center relative shrink-0 ${
                    activeTab === 'requests' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  📥 Requests
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-655 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-stone-900 animate-bounce">
                    {joinRequests.length}
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center shrink-0 ${
                  activeTab === 'tasks' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                📜 Assign Quests ({assignedTasks.length})
              </button>
              <button
                onClick={() => setActiveTab('recruit')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center shrink-0 ${
                  activeTab === 'recruit' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                📢 Recruit
              </button>
            </div>
          </div>

          {/* TAB 1: MERCENARIES LIST */}
          {activeTab === 'mercenaries' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-lg font-black uppercase tracking-widest text-amber-500 font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  Mercenary Battalion Roster
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Search troop by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-stone-950 border-stone-850 text-white rounded-xl placeholder:text-slate-550 h-9.5 text-xs shadow-inner"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto bg-stone-900/90 border-4 border-double border-amber-500/20 rounded-3xl p-4 shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-[10px] uppercase font-black tracking-wider text-slate-400">
                      <th className="pb-3 px-3">Mercenary</th>
                      <th className="pb-3 px-3">Rank</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Current Duty</th>
                      <th className="pb-3 px-3 text-center">Games</th>
                      <th className="pb-3 px-3">Playtime</th>
                      <th className="pb-3 px-3">Action Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-850">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest">
                          No infantry recruited matching this search.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-stone-950/20 transition-colors">
                          <td className="py-4 px-3">
                            <div className="font-bold text-white text-sm">{member.name}</div>
                            <div className="text-[10px] text-slate-400">{member.email}</div>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                              ROLE_BADGE_CLASS[member.role] || ROLE_BADGE_CLASS['infantry']
                            }`}>
                              {ROLE_LABEL[member.role] || 'Troop'}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`font-bold flex items-center gap-1.5 ${
                              member.isOnline ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                member.isOnline ? 'bg-emerald-450 animate-pulse' : 'bg-slate-500'
                              }`} />
                              {member.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-slate-355 font-semibold">
                            {member.activeActivity}
                          </td>
                          <td className="py-4 px-3 text-center text-white font-bold">
                            {member.gamesPlayed}
                          </td>
                          <td className="py-4 px-3 text-slate-400 font-semibold">
                            {member.activePlayTime}
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex gap-2">
                              {isMainTeamLeader && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-1 h-7 rounded text-[10px]">
                                      Promote
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-stone-905 border border-stone-800 text-slate-205">
                                    <DropdownMenuItem onClick={() => handlePromoteClick(member.id, member.name, 'officer')} className="hover:bg-stone-850 text-[11px] font-bold cursor-pointer">
                                      Officer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePromoteClick(member.id, member.name, 'knight')} className="hover:bg-stone-850 text-[11px] font-bold cursor-pointer">
                                      Knight
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePromoteClick(member.id, member.name, 'baron')} className="hover:bg-stone-850 text-[11px] font-bold cursor-pointer">
                                      Baron
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              
                              {isMainTeamLeader && member.role !== 'infantry' && (
                                <Button 
                                  onClick={() => handleDemoteClick(member.id, member.name)}
                                  size="sm"
                                  className="bg-amber-605 hover:bg-amber-700 text-white font-bold py-1 h-7 rounded text-[10px]"
                                >
                                  Demote
                                </Button>
                              )}

                              {isMainTeamLeader && (
                                <Button 
                                  onClick={() => handleDismissClick(member.id, member.name)}
                                  size="sm"
                                  className="bg-red-655 hover:bg-red-700 text-white font-bold py-1 h-7 rounded text-[10px]"
                                >
                                  Dismiss
                                </Button>
                              )}
                              
                              <Button
                                onClick={() => setSelectedMemberForActivity({ id: member.id, name: member.name })}
                                size="sm"
                                className="bg-teal-605 hover:bg-teal-700 text-white font-bold py-1 h-7 rounded text-[10px]"
                              >
                                Activity
                              </Button>
                              
                              <Button
                                onClick={() => setSelectedMemberForBonus({ id: member.id, name: member.name })}
                                size="sm"
                                className="bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black py-1 h-7 rounded text-[10px]"
                              >
                                Tribute
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: WAR ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-lg font-black uppercase tracking-widest text-amber-500 font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                War Analytics Panel
              </h2>
              <TeamAnalyticsPanel
                members={teamMembers.map((m: any) => ({ id: m.id, name: m.name }))}
              />
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-lg font-black uppercase tracking-widest text-amber-500 font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                📅 Daily Check-ins & Attendance Logs
              </h2>
              <div className="bg-stone-900/90 border-4 border-double border-amber-500/20 rounded-3xl p-6 shadow-xl text-slate-100">
                <TeamLeaderAttendanceTracker />
              </div>
            </div>
          )}

          {/* TAB 4: JOIN REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h2 className="text-lg font-black uppercase tracking-widest text-amber-500 font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                Pending Join Requests
              </h2>
              <div className="overflow-x-auto bg-stone-900/90 border-4 border-double border-amber-500/20 rounded-3xl p-4 shadow-xl">
                {joinRequests.length === 0 ? (
                  <p className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest">
                    No pending join requests at this time.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-800 text-[10px] uppercase font-black tracking-wider text-slate-400">
                        <th className="pb-3 px-3">Mercenary</th>
                        <th className="pb-3 px-3">Date Requested</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {joinRequests.map((req: any) => (
                        <tr key={req.id} className="hover:bg-stone-955/20 transition-colors">
                          <td className="py-4 px-3 text-sm font-bold text-white">
                            {req.profiles?.display_name || req.profiles?.username}
                          </td>
                          <td className="py-4 px-3 text-slate-400">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-3 text-right flex justify-end gap-2">
                            <Button 
                              onClick={() => approveJoinRequest(req.id)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8"
                            >
                              Approve
                            </Button>
                            <Button 
                              onClick={() => rejectJoinRequest(req.id)}
                              size="sm"
                              className="bg-red-655 hover:bg-red-700 text-white font-bold h-8"
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ASSIGN QUESTS */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
              
              {/* CREATE CONTRACT WORKSHOP */}
              <div className="lg:col-span-1 bg-stone-900/90 border-4 border-double border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-md font-black uppercase text-amber-500 tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                  Contract Workshop
                </h3>
                
                <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Quest Title</label>
                    <Input 
                      placeholder="e.g. Siege of Persia" 
                      value={taskTitle}
                      onChange={e => setTaskTitle(e.target.value)}
                      className="bg-stone-955 border-stone-800 text-white shadow-inner"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Mission Description</label>
                    <textarea 
                      placeholder="e.g. Conquer 5 Campaign Quests on the map" 
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Task Type</label>
                      <select 
                        value={taskType}
                        onChange={e => setTaskType(e.target.value as any)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 h-9 outline-none text-[11px] shadow-inner"
                      >
                        <option value="quests">Quests</option>
                        <option value="games">Games</option>
                        <option value="riddles">Riddles</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Recurrence</label>
                      <select 
                        value={taskFrequency}
                        onChange={e => setTaskFrequency(e.target.value as any)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 h-9 outline-none text-[11px] shadow-inner"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Target Count</label>
                      <Input 
                        type="number"
                        min={1}
                        value={taskTarget}
                        onChange={e => setTaskTarget(Number(e.target.value))}
                        className="bg-stone-950 border-stone-800 text-white shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-0.5"><Coins className="w-3 h-3 text-amber-500" /> Gems</label>
                      <Input 
                        type="number"
                        value={rewardGems}
                        onChange={e => setRewardGems(Number(e.target.value))}
                        className="bg-stone-950 border-stone-800 text-white shadow-inner"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400" /> Stars</label>
                      <Input 
                        type="number"
                        value={rewardStars}
                        onChange={e => setRewardStars(Number(e.target.value))}
                        className="bg-stone-950 border-stone-800 text-white shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Assignee</label>
                    <select 
                      value={assignedTo}
                      onChange={e => setAssignedTo(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 h-9 outline-none text-[11px] shadow-inner"
                    >
                      <option value="all">All Troops</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black uppercase py-2 h-10 border-0 flex items-center justify-center gap-1.5 rounded-xl">
                    <Plus className="w-4 h-4" />
                    <span>Assign Contract</span>
                  </Button>
                </form>
              </div>

              {/* ACTIVE CONTRACTS LIST */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-md font-black uppercase text-amber-500 tracking-wider font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  Active Mercenary Contracts
                </h3>

                <div className="space-y-3">
                  {assignedTasks.length === 0 ? (
                    <div className="text-center py-12 bg-stone-900/90 border border-stone-850 rounded-3xl text-slate-500 font-bold uppercase tracking-widest text-xs">
                      No active quests assigned. Create one in the workshop!
                    </div>
                  ) : (
                    assignedTasks.map((task) => (
                      <div key={task.id} className="bg-stone-900/90 border border-stone-855 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md relative overflow-hidden">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{task.title}</h4>
                            <span className="bg-stone-950 border border-stone-800 text-stone-400 px-2 py-0.5 rounded text-[8px] uppercase font-bold">
                              {task.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-450">{task.description}</p>
                          <div className="text-[10px] text-slate-550 font-semibold mt-1">
                            Assignee: <span className="text-amber-550">{task.assignedToName}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                          <div className="flex gap-2">
                            <span className="bg-stone-950 border border-amber-500/25 px-2.5 py-1 rounded-xl text-[10px] font-bold text-amber-500 flex items-center gap-1">
                              <Coins className="w-3 h-3" /> +{task.rewardGems}
                            </span>
                            <span className="bg-stone-955 border border-yellow-500/25 px-2.5 py-1 rounded-xl text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                              <Star className="w-3 h-3" /> +{task.rewardStars}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 w-full justify-between sm:justify-end">
                            <span className="text-xs font-black uppercase text-amber-550 tracking-wider">
                              Target: {task.targetCount}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => redistributeTask(task, 'all')}
                                size="sm"
                                className="h-7 px-2.5 text-[10px] font-bold bg-amber-955/40 text-amber-500 hover:bg-amber-955/80 border border-amber-800/30 rounded-lg flex items-center gap-1"
                              >
                                ↪️ Cascade to Troops
                              </Button>
                              <Button 
                                onClick={() => deleteTask(task.id)}
                                variant="ghost" 
                                className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 h-8 rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: RECRUIT */}
          {activeTab === 'recruit' && (
            <div className="max-w-xl mx-auto bg-stone-900/90 border-4 border-double border-amber-500/20 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in fade-in duration-200">
              <Sparkles className="w-16 h-16 mx-auto text-yellow-500 animate-pulse" />
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase text-amber-500 tracking-wider font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  Mercenary Recruitment
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Circulate this scroll across the realm. Any player who signs using this ledger will join under your command in the Baron War Room!
                </p>
              </div>

              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={inviteLink}
                  className="bg-stone-955 border-stone-800 text-white text-xs h-10 rounded-xl"
                />
                <Button 
                  onClick={copyInviteLink} 
                  className="bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black uppercase py-2 h-10 px-5 shrink-0 border-0 flex items-center gap-1.5 rounded-xl"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* GRANT TRIBUTE MODAL */}
        {selectedMemberForBonus && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 border-4 border-double border-amber-500/30 rounded-3xl p-6 w-full max-w-sm text-slate-100 space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2 animate-bounce" />
                <h3 className="text-md font-black uppercase text-amber-500 tracking-wider font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
                  Grant Tribute
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold font-serif">Reward <span className="text-white font-bold">{selectedMemberForBonus.name}</span> for exceptional siege service.</p>
              </div>

              <form onSubmit={handleGrantBonusSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400" /> Star Currency
                  </label>
                  <Input 
                    type="number"
                    min={1}
                    value={bonusStars}
                    onChange={e => setBonusStars(Number(e.target.value))}
                    className="bg-stone-955 border-stone-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-0.5">
                    <Coins className="w-3.5 h-3.5 text-amber-500" /> Gold Gems
                  </label>
                  <Input 
                    type="number"
                    min={1}
                    value={bonusGems}
                    onChange={e => setBonusGems(Number(e.target.value))}
                    className="bg-stone-955 border-stone-800 text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    onClick={() => setSelectedMemberForBonus(null)}
                    className="flex-1 bg-stone-850 hover:bg-stone-800 text-slate-350 font-bold uppercase py-2 h-9 border border-stone-700 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-stone-955 font-black uppercase py-2 h-9 border-0 rounded-xl shadow-sm"
                  >
                    Send Tribute
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation dialogue */}
        {confirmDialog && (
          <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
            <AlertDialogContent className="bg-stone-900 border border-stone-800 text-slate-202 w-[95%] max-w-sm rounded-3xl animate-in fade-in-50 zoom-in-95 duration-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-amber-500 font-black uppercase tracking-wider text-sm">{confirmDialog.title}</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400 text-xs font-semibold">{confirmDialog.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-2 mt-4 text-xs">
                <AlertDialogCancel onClick={() => setConfirmDialog(null)} className="flex-1 rounded-xl mt-0 bg-stone-850 hover:bg-stone-800 border-stone-700 text-slate-350">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    const action = confirmDialog.action;
                    setConfirmDialog(null);
                    await action();
                  }}
                  className="flex-1 rounded-xl text-stone-950 font-black"
                  style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Member Activity Tracker Modal */}
        <MemberActivityTracker
          memberId={selectedMemberForActivity?.id || ''}
          memberName={selectedMemberForActivity?.name || ''}
          isOpen={!!selectedMemberForActivity}
          onClose={() => setSelectedMemberForActivity(null)}
        />

      </div>
    </PageLayout>
  );
}
