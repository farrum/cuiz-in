import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTeamLeaderDashboard } from '@/hooks/useTeamLeaderDashboard';
import { BurningTorch } from '@/components/gamification/BurningTorch';
import { buildReferralLink } from '@/utils/referralLink';
import TeamAnalyticsPanel from '@/components/team-leader/TeamAnalyticsPanel';
import { 
  Users, 
  UserCheck, 
  Play, 
  Award, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ShieldCheck, 
  ShieldAlert,
  Coins,
  Star,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';

const TeamLeaderDashboardPage = () => {
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
    assignedTasks = [],
    assignTask,
    deleteTask,
    awardBonus,
    joinRequests = [],
    approveJoinRequest,
    rejectJoinRequest
  } = useTeamLeaderDashboard();

  const [activeTab, setActiveTab] = useState<'mercenaries' | 'analytics' | 'requests' | 'tasks' | 'invite'>('mercenaries');
  
  // Task creator state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskTarget, setTaskTarget] = useState(5);
  const [taskType, setTaskType] = useState<'quests' | 'games' | 'riddles'>('quests');
  const [taskFrequency, setTaskFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [rewardGems, setRewardGems] = useState(50);
  const [rewardStars, setRewardStars] = useState(10);
  const [rewardShards, setRewardShards] = useState(1);
  const [shardType, setShardType] = useState<'Socrates' | 'Aryabhata' | 'Chanakya' | 'Ramanujan'>('Socrates');
  const [assignedTo, setAssignedTo] = useState('all');

  // Bonus modal/prompt states
  const [selectedMemberForBonus, setSelectedMemberForBonus] = useState<{ id: string, name: string } | null>(null);
  const [bonusStars, setBonusStars] = useState(25);
  const [bonusGems, setBonusGems] = useState(100);

  const [copied, setCopied] = useState(false);
  const username = localStorage.getItem('cuizin_username') || 'baron';
  const inviteLink = buildReferralLink(username);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({ title: "Scroll Copied", description: "Recruitment scroll link copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
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
      rewardShards: Number(rewardShards),
      shardType,
      assignedTo,
      assignedToName: assigneeName
    });

    // Reset Form
    setTaskTitle('');
    setTaskDesc('');
  };

  const handleGrantBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForBonus) return;
    await awardBonus(selectedMemberForBonus.id, selectedMemberForBonus.name, Number(bonusStars), Number(bonusGems));
    setSelectedMemberForBonus(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen stone-wall flex flex-col items-center justify-center text-foreground">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Assembling War Council...</p>
      </div>
    );
  }

  if (!isTeamLeader) {
    return (
      <div className="min-h-screen stone-wall flex flex-col items-center justify-center text-foreground p-6 text-center">
        <MascotSad className="w-24 h-24 mb-4 text-red-500" />
        <h2 className="text-xl font-bold uppercase tracking-wide text-red-500">Access Restricted</h2>
        <p className="text-slate-500 text-sm max-w-sm mt-2">Only recognized Barons may enter the mercenary war room.</p>
        <Button onClick={() => navigate('/profile')} className="mt-4 bg-stone-850 border border-slate-800 text-foreground">Return to Castle</Button>
      </div>
    );
  }

  const officersCount = teamMembers.filter(m => m.role === 'officer').length;

  return (
    <PageLayout showNewsTicker={false}>
      <div className="min-h-screen stone-wall text-foreground pb-16 relative">
        
        {/* WAR ROOM TOP BAR */}
        <div className="wooden-door py-4 px-6 relative z-10 shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                Baron War Room
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Command Mercenaries & Commission Officers</p>
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
            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Infantry</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-white">{teamMembers.length}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">Mercenary Battalion</p>
              </div>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Duty</span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-emerald-400">{activeMembers}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">Online Today</p>
              </div>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Quests</span>
                <ClipboardList className="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-violet-400">{assignedTasks.length}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">Assigned Contracts</p>
              </div>
            </div>

            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Commissioned Officers</span>
                <Award className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-blue-400">{officersCount}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1">Junior Leaders</p>
              </div>
            </div>
          </div>

          {/* TAB TACTICAL SELECTOR */}
          <div className="flex justify-center">
            <div className="flex gap-2 bg-stone-900/90 border border-stone-850 p-1.5 rounded-2xl items-center shadow-lg">
              <button
                onClick={() => setActiveTab('mercenaries')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center ${
                  activeTab === 'mercenaries' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                ⚔️ Mercenaries
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center ${
                  activeTab === 'analytics' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                📊 War Analytics
              </button>
              {joinRequests.length > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center relative ${
                    activeTab === 'requests' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  📥 Requests
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-650 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-stone-900 animate-bounce">
                    {joinRequests.length}
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center ${
                  activeTab === 'tasks' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                📜 Assign Quests
              </button>
              <button
                onClick={() => setActiveTab('invite')}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all h-9 flex items-center ${
                  activeTab === 'invite' ? 'medieval-btn' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                📢 Recruit Scroll
              </button>
            </div>
          </div>

          {/* TAB 1: MERCENARIES ROSTER */}
          {activeTab === 'mercenaries' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-amber-500" style={{ fontFamily: "'Cinzel', serif" }}>
                Battalion Roster
              </h2>
              
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
                    {teamMembers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest">
                          No infantry recruited yet. Share your recruitment scroll!
                        </td>
                      </tr>
                    ) : (
                      teamMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-stone-950/20 transition-colors">
                          <td className="py-4 px-3">
                            <div className="font-bold text-white text-sm">{member.name}</div>
                            <div className="text-[10px] text-slate-400">{member.email}</div>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                              member.role === 'baron' ? 'bg-amber-950/50 border-amber-700 text-amber-300' :
                              member.role === 'knight' ? 'bg-blue-950/50 border-blue-700 text-blue-300' :
                              member.role === 'officer' ? 'bg-indigo-950/50 border-indigo-700 text-indigo-300' :
                              member.role === 'admin' || member.role === 'king' ? 'bg-yellow-950/50 border-yellow-700 text-yellow-500' :
                              'bg-stone-950/50 border-stone-700 text-slate-400'
                            }`}>
                              {member.role === 'admin' || member.role === 'king' ? 'King' :
                               member.role === 'baron' ? 'Baron' :
                               member.role === 'knight' ? 'Knight' :
                               member.role === 'officer' ? 'Officer' : 'Infantry'}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`font-bold flex items-center gap-1.5 ${
                              member.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                member.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                              }`} />
                              {member.status === 'active' ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-slate-300">
                            {member.activeActivity}
                          </td>
                          <td className="py-4 px-3 text-center text-white font-bold">
                            {member.gamesPlayed}
                          </td>
                          <td className="py-4 px-3 text-slate-400">
                            {member.activePlayTime}
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex gap-2">
                              {/* Promotion Dropdown */}
                              {isMainTeamLeader && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 h-7 rounded text-[10px]">
                                      Promote
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-stone-900 border border-stone-800 text-slate-200">
                                    <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'officer')} className="hover:bg-stone-850 text-[11px] font-bold cursor-pointer">
                                      Promote to Officer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'knight')} className="hover:bg-stone-850 text-[11px] font-bold cursor-pointer">
                                      Promote to Knight
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => promoteToJunior(member.id, 'baron')} className="hover:bg-stone-850 text-[11px] font-bold cursor-pointer">
                                      Promote to Baron
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                              
                              {/* Demote Button */}
                              {isMainTeamLeader && member.role !== 'infantry' && (
                                <Button 
                                  onClick={() => demoteToPlayer(member.id)}
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 h-7 rounded text-[10px]"
                                >
                                  Demote
                                </Button>
                              )}
                              
                              {/* Grant Bonus Tribute */}
                              <Button
                                onClick={() => setSelectedMemberForBonus({ id: member.id, name: member.name })}
                                size="sm"
                                className="bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black py-1 h-7 rounded text-[10px]"
                              >
                                Grant Tribute
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

          {/* TAB: TEAM JOIN REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-amber-500" style={{ fontFamily: "'Cinzel', serif" }}>
                Join Requests
              </h2>
              <div className="overflow-x-auto bg-stone-900/90 border-4 border-double border-amber-500/20 rounded-3xl p-4 shadow-xl">
                {joinRequests.length === 0 ? (
                  <p className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest">
                    No pending team join requests at this time.
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
                        <tr key={req.id} className="hover:bg-stone-950/20 transition-colors">
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
                              className="bg-red-650 hover:bg-red-700 text-white font-bold h-8"
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

          {/* TAB 2: ASSIGN QUESTS / CONTRACTS */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
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
                      className="bg-stone-950 border-stone-800 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Mission Description</label>
                    <textarea 
                      placeholder="e.g. Conquer 5 Campaign Quests on the map" 
                      value={taskDesc}
                      onChange={e => setTaskDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Task Type</label>
                      <select 
                        value={taskType}
                        onChange={e => setTaskType(e.target.value as any)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 h-9 outline-none"
                      >
                        <option value="quests">Map Quests</option>
                        <option value="games">Tavern Games</option>
                        <option value="riddles">Riddles</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Recurrence</label>
                      <select 
                        value={taskFrequency}
                        onChange={e => setTaskFrequency(e.target.value as any)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 h-9 outline-none"
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
                        className="bg-stone-950 border-stone-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-0.5"><Coins className="w-3 h-3 text-amber-500" /> Gems</label>
                      <Input 
                        type="number"
                        value={rewardGems}
                        onChange={e => setRewardGems(Number(e.target.value))}
                        className="bg-stone-950 border-stone-800 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400" /> Stars</label>
                      <Input 
                        type="number"
                        value={rewardStars}
                        onChange={e => setRewardStars(Number(e.target.value))}
                        className="bg-stone-950 border-stone-800 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block">Shards</label>
                      <Input 
                        type="number"
                        value={rewardShards}
                        onChange={e => setRewardShards(Number(e.target.value))}
                        className="bg-stone-950 border-stone-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Shard Type</label>
                      <select 
                        value={shardType}
                        onChange={e => setShardType(e.target.value as any)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 h-9 outline-none"
                      >
                        <option value="Socrates">Socrates Shard</option>
                        <option value="Aryabhata">Aryabhata Shard</option>
                        <option value="Chanakya">Chanakya Shard</option>
                        <option value="Ramanujan">Ramanujan Shard</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Assignee</label>
                      <select 
                        value={assignedTo}
                        onChange={e => setAssignedTo(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 text-white rounded-md p-2 h-9 outline-none"
                      >
                        <option value="all">All Mercenaries</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black uppercase py-2 h-10 border-0 flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Assign Contract</span>
                  </Button>
                </form>
              </div>

              {/* ACTIVE CONTRACTS LIST */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-md font-black uppercase text-amber-500 tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                  Active Mercenary Contracts
                </h3>

                <div className="space-y-3">
                  {assignedTasks.length === 0 ? (
                    <div className="text-center py-12 bg-stone-900/90 border border-stone-800 rounded-3xl text-slate-500 font-bold uppercase tracking-widest text-xs">
                      No active quests assigned. Create one in the workshop!
                    </div>
                  ) : (
                    assignedTasks.map((task) => (
                      <div key={task.id} className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md relative overflow-hidden">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{task.title}</h4>
                            <span className="bg-stone-950 border border-stone-800 text-stone-400 px-2 py-0.5 rounded text-[8px] uppercase font-bold">
                              {task.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{task.description}</p>
                          <div className="text-[10px] text-slate-500 font-semibold mt-1">
                            Assignee: <span className="text-amber-500">{task.assignedToName}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                          {/* Reward Badges */}
                          <div className="flex gap-2">
                            <span className="bg-slate-950 border border-amber-500/25 px-2 py-1 rounded-xl text-[10px] font-bold text-amber-500 flex items-center gap-1">
                              <Coins className="w-3 h-3" /> +{task.rewardGems}
                            </span>
                            <span className="bg-slate-950 border border-yellow-500/25 px-2 py-1 rounded-xl text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                              <Star className="w-3 h-3" /> +{task.rewardStars}
                            </span>
                            <span className="bg-slate-950 border border-blue-500/25 px-2 py-1 rounded-xl text-[10px] font-bold text-blue-400 flex items-center gap-1">
                              💎 +{task.rewardShards} {task.shardType}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 w-full justify-between sm:justify-end">
                            <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                              Target: {task.targetCount}
                            </span>
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
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: WAR ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-widest text-amber-500" style={{ fontFamily: "'Cinzel', serif" }}>
                War Analytics
              </h2>
              <TeamAnalyticsPanel
                members={teamMembers.map((m: any) => ({ id: m.id, name: m.name }))}
              />
            </div>
          )}

          {/* TAB 3: RECRUIT SCROLL */}
          {activeTab === 'invite' && (
            <div className="max-w-xl mx-auto bg-stone-900/90 border-4 border-double border-amber-500/20 rounded-3xl p-8 shadow-xl text-center space-y-6">
              <MascotHappy className="w-20 h-20 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase text-amber-500 tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
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
                  className="bg-stone-950 border-stone-800 text-white text-xs h-10 rounded-xl"
                />
                <Button 
                  onClick={copyLink} 
                  className="bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black uppercase py-2 h-10 px-5 shrink-0 border-0 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* GRANT BONUS TRIBUTE DIALOG */}
        {selectedMemberForBonus && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 border-4 border-double border-amber-500/30 rounded-3xl p-6 w-full max-w-sm text-slate-100 space-y-4">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2 animate-bounce" />
                <h3 className="text-md font-black uppercase text-amber-500 tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                  Grant Tribute
                </h3>
                <p className="text-xs text-slate-400 mt-1">Reward <span className="text-white font-bold">{selectedMemberForBonus.name}</span> for exceptional siege service.</p>
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
                    className="bg-stone-950 border-stone-800 text-white"
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
                    className="bg-stone-950 border-stone-800 text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    onClick={() => setSelectedMemberForBonus(null)}
                    className="flex-1 bg-stone-850 hover:bg-stone-800 text-slate-300 font-bold uppercase py-2 h-9 border border-stone-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black uppercase py-2 h-9 border-0"
                  >
                    Send Tribute
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
};

// Mock character mascot components
function MascotSad({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MascotHappy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default TeamLeaderDashboardPage;
