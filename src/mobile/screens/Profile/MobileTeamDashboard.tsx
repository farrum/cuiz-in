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
  CheckCircle, 
  RefreshCw,
  Mail,
  User,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { useTeamLeaderDashboard } from '@/hooks/useTeamLeaderDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
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
    inactiveMembers,
    suspendedMembers,
    teamMembers = [],
    isLoading,
    isMainTeamLeader,
    promoteToJunior,
    demoteToPlayer,
    handleStatusChange,
    requestAccountAction,
    refreshMembers
  } = useTeamLeaderDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'subteam'>('all');
  const [copied, setCopied] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // AlertDialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const username = localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
  const inviteLink = `${window.location.origin}/register?ref=${username}`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Team invitation link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please manually copy it.",
        variant: "destructive"
      });
    }
  };

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      // 1. Search Query Filter
      const nameMatch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = member.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = nameMatch || emailMatch;

      if (!matchesSearch) return false;

      // 2. Tab Filter
      if (filterTab === 'direct') {
        return !member.directLeaderUsername;
      }
      if (filterTab === 'subteam') {
        return !!member.directLeaderUsername;
      }

      return true;
    });
  }, [teamMembers, searchQuery, filterTab]);

  const totalPlays = useMemo(() => {
    return teamMembers.reduce((acc, m) => acc + (m.questionsAnswered || 0), 0);
  }, [teamMembers]);

  const totalCorrect = useMemo(() => {
    return teamMembers.reduce((acc, m) => acc + (m.questionsCorrect || 0), 0);
  }, [teamMembers]);

  const accuracy = totalPlays > 0 ? Math.round((totalCorrect / totalPlays) * 100) : 0;

  const handlePromoteClick = (memberId: string, name: string) => {
    if (!promoteToJunior) return;
    setConfirmDialog({
      open: true,
      title: "Promote to Junior Team Leader?",
      description: `Are you sure you want to promote ${name} to a Junior Team Leader? They will be able to recruit their own players, and their team's statistics will roll up to you.`,
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
      title: "Demote to Player?",
      description: `Are you sure you want to demote ${name} back to a regular Player? They will lose their team leader privileges.`,
      action: async () => {
        setActionInProgress(memberId);
        await demoteToPlayer(memberId);
        setActionInProgress(null);
      }
    });
  };

  const handleStatusChangeClick = (memberId: string, name: string, currentStatus: string) => {
    const isSuspended = currentStatus === 'suspended';
    const action = isSuspended ? 'reactivate' : 'suspend';
    
    setConfirmDialog({
      open: true,
      title: isSuspended ? "Reactivate Member Account?" : "Suspend Member Account?",
      description: isSuspended 
        ? `Are you sure you want to request reactivation for ${name}?` 
        : `Are you sure you want to request suspension for ${name}? They will be blocked from answering quizzes.`,
      action: async () => {
        setActionInProgress(memberId);
        if (requestAccountAction) {
          await requestAccountAction(memberId, action);
        } else {
          // Fallback if request action is not implemented directly on client/hook
          await handleStatusChange(memberId, isSuspended ? 'active' : 'suspended');
        }
        setActionInProgress(null);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-2" />
        <p className="text-muted-foreground text-sm font-semibold">Loading team statistics...</p>
      </div>
    );
  }

  if (!isTeamLeader) {
    return null; // The hook will redirect to /profile
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-36">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3.5 flex items-center gap-3">
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/profile')}
          className="p-1.5 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-lg font-bold">Team Control Center</h1>
          <p className="text-xs text-muted-foreground">
            {isMainTeamLeader ? 'Main Team Leader' : 'Junior Team Leader'}
          </p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => refreshMembers()}
          className="ml-auto p-1.5 rounded-full hover:bg-muted"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Invite Card */}
        <Card className="border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50/50 to-purple-50/20 dark:from-indigo-950/20 dark:to-purple-950/5 overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-200">Invite Members to Join Your Team</h3>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/85 mt-0.5">
                Share this referral link. New members automatically join under your hierarchy.
              </p>
            </div>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={inviteLink}
                className="bg-background text-xs h-9 border-indigo-200 dark:border-indigo-900"
              />
              <Button 
                onClick={copyInviteLink} 
                size="sm" 
                className="h-9 gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">Team Size</span>
              <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">{teamMembers.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Direct & sub-team</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">Active (DAU)</span>
              <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                <UserCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{activeMembers}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Playing today</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">Total Plays</span>
              <span className="p-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-500">
                <Play className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">{totalPlays.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Questions answered</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">Team Acc.</span>
              <span className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-500">
                <Award className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-teal-600 dark:text-teal-400">{accuracy}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Correct answer ratio</p>
            </div>
          </div>
        </div>

        {/* Search & Tabs Header */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search member by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 text-sm bg-card border-border"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Custom Mobile Filter Tabs */}
          <div className="flex p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setFilterTab('all')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterTab === 'all' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({teamMembers.length})
            </button>
            <button
              onClick={() => setFilterTab('direct')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterTab === 'direct' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Direct ({teamMembers.filter(m => !m.directLeaderUsername).length})
            </button>
            <button
              onClick={() => setFilterTab('subteam')}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                filterTab === 'subteam' 
                  ? 'bg-background shadow text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sub-Team ({teamMembers.filter(m => !!m.directLeaderUsername).length})
            </button>
          </div>
        </div>

        {/* Member Cards List */}
        <div className="space-y-2 pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Members ({filteredMembers.length})
          </h2>
          
          <AnimatePresence mode="popLayout">
            {filteredMembers.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 bg-card border border-border rounded-2xl text-muted-foreground text-sm"
              >
                No members match the search or filter
              </motion.div>
            ) : (
              filteredMembers.map((member) => {
                const memberPlays = member.questionsAnswered || 0;
                const memberCorrect = member.questionsCorrect || 0;
                const memberAcc = memberPlays > 0 ? Math.round((memberCorrect / memberPlays) * 100) : 0;
                const isLoadingMember = actionInProgress === member.id;

                return (
                  <motion.div
                    key={member.id}
                    layoutId={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border border-border rounded-2xl p-3.5 space-y-3 relative overflow-hidden"
                  >
                    {/* Top Row: User Meta */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-foreground truncate">{member.name}</p>
                          {member.role === 'junior_team_leader' ? (
                            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 text-[10px] px-1.5 py-0">
                              Junior TL
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 text-[10px] px-1.5 py-0">
                              Player
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {member.status === 'active' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                        {member.status === 'inactive' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                        {member.status === 'suspended' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Referral context & Statistics */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl text-center">
                      <div>
                        <p className="text-xs font-bold text-foreground">{memberPlays.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground">Plays</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{memberAcc}%</p>
                        <p className="text-[9px] text-muted-foreground">Accuracy</p>
                      </div>
                      <div className="flex flex-col justify-center items-center truncate px-0.5">
                        {member.directLeaderUsername ? (
                          <>
                            <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-full">
                              @{member.directLeaderUsername}
                            </p>
                            <p className="text-[9px] text-muted-foreground">Leader</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Direct</p>
                            <p className="text-[9px] text-muted-foreground">Referral</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Actions (Only for Main Team Leader, or if status suspension request is allowed) */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                      <div className="text-[10px] text-muted-foreground">
                        Joined: {new Date(member.joinDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </div>

                      <div className="flex gap-1.5">
                        {/* 1. Request Suspension / Reactivation (Available to all TLs) */}
                        <Button
                          disabled={isLoadingMember}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChangeClick(member.id, member.name, member.status)}
                          className={`h-7 px-2 text-[11px] gap-1 hover:bg-slate-100 ${
                            member.status === 'suspended' 
                              ? 'text-emerald-600 hover:text-emerald-700' 
                              : 'text-rose-600 hover:text-rose-700'
                          }`}
                        >
                          <Ban className="w-3 h-3" />
                          <span>{member.status === 'suspended' ? 'Reactivate' : 'Suspend'}</span>
                        </Button>

                        {/* 2. Promote / Demote Actions (Available only to Main Team Leader for direct players) */}
                        {isMainTeamLeader && !member.directLeaderUsername && (
                          <>
                            {member.role !== 'junior_team_leader' ? (
                              <Button
                                disabled={isLoadingMember}
                                variant="outline"
                                size="sm"
                                onClick={() => handlePromoteClick(member.id, member.name)}
                                className="h-7 px-2 text-[11px] gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                Promote
                              </Button>
                            ) : (
                              <Button
                                disabled={isLoadingMember}
                                variant="outline"
                                size="sm"
                                onClick={() => handleDemoteClick(member.id, member.name)}
                                className="h-7 px-2 text-[11px] gap-1 border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/30"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                Demote
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Loader overlay */}
                    {isLoadingMember && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <AlertDialogContent className="w-[90%] max-w-sm rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-2 mt-4">
              <AlertDialogCancel onClick={() => setConfirmDialog(null)} className="flex-1 rounded-xl mt-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  const action = confirmDialog.action;
                  setConfirmDialog(null);
                  await action();
                }}
                className="flex-1 rounded-xl"
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
