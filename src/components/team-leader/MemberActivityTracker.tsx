import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  X, Calendar, Award, Activity, FileText, CheckCircle2, 
  XCircle, Crown, Gamepad, Clock, Sparkles, AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberActivityTrackerProps {
  memberId: string;
  memberName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberActivityTracker: React.FC<MemberActivityTrackerProps> = ({
  memberId,
  memberName,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'contracts' | 'quizzes' | 'games'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attendance, setAttendance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !memberId) return;

    const fetchActivityLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Attendance Logs
        const { data: attendanceData, error: attendanceErr } = await supabase
          .rpc('get_member_attendance' as any, { p_member_id: memberId } as any);

        if (attendanceErr) throw attendanceErr;
        setAttendance((attendanceData as any[]) || []);

        // 2. Fetch Tasks (Contracts)
        const { data: tasksData, error: tasksErr } = await supabase
          .rpc('get_member_tasks' as any, { p_member_id: memberId } as any);

        if (tasksErr) throw tasksErr;
        setTasks((tasksData as any[]) || []);

        // 3. Fetch Quiz Answers
        const { data: quizData, error: quizErr } = await supabase
          .rpc('get_member_quiz_answers' as any, { p_member_id: memberId } as any);

        if (quizErr) throw quizErr;
        setQuizzes((quizData as any[]) || []);

        // 4. Fetch Wheel Spins
        const { data: spinsData, error: spinsErr } = await supabase
          .rpc('get_member_wheel_spins' as any, { p_member_id: memberId } as any);

        if (spinsErr) throw spinsErr;
        setGames((spinsData as any[]) || []);

      } catch (err: any) {
        console.error('Error fetching member activities:', err);
        setError(err.message || 'Failed to summon activity scrolls.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityLogs();
  }, [isOpen, memberId]);

  if (!isOpen) return null;

  // Overview Stats Calculation
  const totalQuizzes = quizzes.length;
  const correctQuizzes = quizzes.filter(q => q.correct).length;
  const accuracy = totalQuizzes > 0 ? Math.round((correctQuizzes / totalQuizzes) * 100) : 0;
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'claimed').length;
  const activeTasks = tasks.filter(t => t.status === 'active').length;

  // Determine latest activity date
  let lastActiveStr = 'Never';
  const dates: Date[] = [];
  if (attendance.length > 0) dates.push(new Date(attendance[0].login_time));
  if (quizzes.length > 0) dates.push(new Date(quizzes[0].answered_at));
  if (games.length > 0) dates.push(new Date(games[0].spun_on));

  if (dates.length > 0) {
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    lastActiveStr = latest.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-stone-900 border-2 border-amber-600/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] text-slate-100"
        style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
      >
        {/* Header */}
        <div className="wooden-door px-6 py-4 flex items-center justify-between border-b border-amber-600/20 shadow-md">
          <div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
              <Activity className="w-5 h-5 text-amber-500" />
              War Room Archives
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Tracking Activities of {memberName}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-stone-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: Crown },
            { id: 'attendance', label: 'Attendance', icon: Calendar },
            { id: 'contracts', label: 'Contracts', icon: Award },
            { id: 'quizzes', label: 'Quizzes', icon: FileText },
            { id: 'games', label: 'Tavern Games', icon: Gamepad },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 min-w-[90px] py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all select-none",
                  active 
                    ? "border-amber-500 text-amber-400 bg-stone-900" 
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-stone-900/50"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", active ? "text-amber-500" : "text-slate-500")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 stone-wall bg-stone-900/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Summoning records from scroll vaults...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-black text-sm uppercase">Access Denied</h4>
                <p className="text-xs text-slate-400 mt-0.5">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-stone-950/80 border border-stone-850 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-black text-amber-400">{totalQuizzes}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-1">Questions Answered</p>
                    </div>
                    <div className="bg-stone-950/80 border border-stone-850 rounded-2xl p-4 text-center">
                      <p className={cn(
                        "text-2xl font-black",
                        accuracy >= 70 ? "text-emerald-400" : accuracy >= 40 ? "text-amber-400" : "text-rose-400"
                      )}>{accuracy}%</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-1">Accuracy Rate</p>
                    </div>
                    <div className="bg-stone-950/80 border border-stone-850 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-black text-emerald-400">{completedTasks}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-1">Contracts Fulfilled</p>
                    </div>
                    <div className="bg-stone-950/80 border border-stone-850 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-black text-sky-400">{attendance.length}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-1">Days Active</p>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="bg-stone-950/90 border-2 border-amber-500/20 rounded-2xl p-5 space-y-4">
                    <h3 className="font-black text-xs text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Member Dossier
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-stone-850">
                        <span className="text-slate-400 font-bold uppercase">Latest Active Timestamp:</span>
                        <span className="font-black text-slate-200">{lastActiveStr}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-stone-850">
                        <span className="text-slate-400 font-bold uppercase">Active Mini-Games:</span>
                        <span className="font-black text-slate-200">{games.length} plays recorded</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-stone-850">
                        <span className="text-slate-400 font-bold uppercase">Assigned Contracts:</span>
                        <span className="font-black text-slate-200">{activeTasks} in progress</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-stone-850">
                        <span className="text-slate-400 font-bold uppercase">Accuracy Scorecard:</span>
                        <span className="font-black text-emerald-400">{correctQuizzes} correct / {totalQuizzes} total</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  {attendance.length === 0 ? (
                    <div className="text-center py-10 bg-stone-950/50 border border-stone-850 rounded-2xl">
                      <p className="text-slate-500 font-bold text-xs uppercase">No attendance scrolls logged for this member.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {attendance.map((log, index) => {
                        const dateObj = new Date(log.login_time);
                        return (
                          <div 
                            key={index}
                            className="bg-stone-950/70 border border-stone-850/60 rounded-xl p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-stone-900 border border-amber-600/20 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-amber-500" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-200">
                                  {dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wide">
                                  Check In: {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 uppercase font-bold tracking-widest">
                              Logged
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Contracts Tab */}
              {activeTab === 'contracts' && (
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-10 bg-stone-950/50 border border-stone-850 rounded-2xl">
                      <p className="text-slate-500 font-bold text-xs uppercase">No contracts assigned to this member.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((task) => {
                        const pct = Math.min(Math.round((task.current_count / task.target_count) * 100), 100);
                        const isDone = task.status === 'completed' || task.status === 'claimed';
                        return (
                          <div 
                            key={task.id}
                            className="bg-stone-950/70 border border-stone-850/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[8px] border rounded px-1.5 py-0.5 uppercase font-bold tracking-widest",
                                  task.type === 'quests' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                  task.type === 'games' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                                  "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                )}>
                                  {task.type}
                                </span>
                                <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">{task.title}</h4>
                              </div>
                              {task.description && (
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{task.description}</p>
                              )}
                              
                              {/* Progress bar */}
                              <div className="pt-2 max-w-md">
                                <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-1 uppercase">
                                  <span>Progress</span>
                                  <span>{task.current_count} / {task.target_count} ({pct}%)</span>
                                </div>
                                <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                                  <div 
                                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="shrink-0 flex items-center justify-between md:justify-end gap-4 border-t border-stone-850 pt-3 md:border-t-0 md:pt-0">
                              {/* Rewards */}
                              <div className="text-right">
                                <p className="text-[9px] text-slate-500 uppercase font-black">Bounty</p>
                                <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                                  {task.reward_gems > 0 && <span className="text-[10px] font-black text-blue-400">💎 {task.reward_gems}</span>}
                                  {task.reward_stars > 0 && <span className="text-[10px] font-black text-amber-500">⭐ {task.reward_stars}</span>}
                                </div>
                              </div>
                              
                              {isDone ? (
                                <div className="flex items-center gap-1 text-emerald-400 font-black text-xs uppercase bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Fulfilled
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-amber-400 font-black text-xs uppercase bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5">
                                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                                  Active
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Quizzes Tab */}
              {activeTab === 'quizzes' && (
                <div className="space-y-3">
                  {quizzes.length === 0 ? (
                    <div className="text-center py-10 bg-stone-950/50 border border-stone-850 rounded-2xl">
                      <p className="text-slate-500 font-bold text-xs uppercase">No quiz answers logged for this member.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {quizzes.map((quiz, idx) => {
                        const dateObj = new Date(quiz.answered_at);
                        return (
                          <div 
                            key={idx}
                            className="bg-stone-950/70 border border-stone-850/60 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                {quiz.correct ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                )}
                                <span className="text-[10px] text-amber-500 font-black uppercase tracking-wider">{quiz.category || 'General Knowledge'}</span>
                              </div>
                              <p className="text-xs font-black text-slate-200 leading-snug">{quiz.question}</p>
                              <p className="text-[10px] text-slate-500 font-bold">
                                Selected Answer: <span className="text-slate-350 italic">"{quiz.selected_answer}"</span>
                              </p>
                            </div>
                            
                            <div className="shrink-0 text-[10px] font-bold text-slate-500 text-right uppercase tracking-wider">
                              {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Games Tab */}
              {activeTab === 'games' && (
                <div className="space-y-3">
                  {games.length === 0 ? (
                    <div className="text-center py-10 bg-stone-950/50 border border-stone-850 rounded-2xl">
                      <p className="text-slate-500 font-bold text-xs uppercase">No tavern spins logged for this member.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {games.map((game, index) => {
                        return (
                          <div 
                            key={index}
                            className="bg-stone-950/70 border border-stone-850/60 rounded-xl p-3.5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-stone-900 border border-purple-500/20 flex items-center justify-center shadow-inner">
                                <Gamepad className="w-4.5 h-4.5 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-200">
                                  Prize: {game.prize_label}
                                </p>
                                <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase tracking-wide">
                                  Spun on: {new Date(game.spun_on).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            
                            {Number(game.prize_value) > 0 && (
                              <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 shadow-sm">
                                +{game.prize_value} 💎
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
