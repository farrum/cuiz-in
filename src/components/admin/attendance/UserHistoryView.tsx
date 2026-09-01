import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Calendar, User, Flame, Award, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MemberSearchDropdown, { getRoleInfo, DropdownMember } from './components/MemberSearchDropdown';

interface UserHistoryViewProps {
  users: DropdownMember[];
  selectedUser: string | null;
  userHistory: Record<string, any[]>;
  userHistoryLoading: boolean;
  onUserSelect: (userId: string) => void;
  onRefresh: (userId: string) => void;
  getLastLoginDate: (userId: string) => string;
  formatAttendanceDate: (dateStr: string) => string;
}

const UserHistoryView: React.FC<UserHistoryViewProps> = ({
  users,
  selectedUser,
  userHistory,
  userHistoryLoading,
  onUserSelect,
  onRefresh,
  getLastLoginDate,
  formatAttendanceDate
}) => {
  // Find current user object
  const currentMember = users.find(u => u.id === selectedUser) || null;
  const roleInfo = currentMember ? getRoleInfo(currentMember.role) : null;

  // Calculate consecutive days streak if we have history
  const calculateStreak = (history: any[]): number => {
    if (!history || history.length === 0) return 0;
    
    // Sort by date (most recent first)
    const sortedDates = [...history]
      .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime())
      .map(record => String(record.attendance_date).split('T')[0]);
    
    // Get unique dates (in case there are multiple logins per day)
    const uniqueDates = Array.from(new Set(sortedDates));
    
    // Calculate streak
    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i-1]);
      const prev = new Date(uniqueDates[i]);
      
      // If dates are consecutive (difference is 1 day)
      const diffTime = current.getTime() - prev.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (Math.round(diffDays) === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Recruiter / reporting officer lookup (falls back to user_referrals when the
  // member list doesn't carry the leader link)
  const [lineage, setLineage] = useState<{ referrer: string | null; joinDate: string | null }>({
    referrer: null,
    joinDate: null,
  });

  useEffect(() => {
    const fetchLineage = async () => {
      if (!selectedUser) {
        setLineage({ referrer: null, joinDate: null });
        return;
      }
      try {
        const [refRes, profRes] = await Promise.all([
          supabase
            .from('user_referrals')
            .select('referrer_name, date')
            .eq('referred_id', selectedUser)
            .order('date', { ascending: false })
            .limit(1),
          supabase.from('profiles').select('created_at').eq('id', selectedUser).maybeSingle(),
        ]);
        const ref = refRes.data && refRes.data.length > 0 ? refRes.data[0] : null;
        setLineage({
          referrer: ref?.referrer_name || null,
          joinDate: profRes.data?.created_at || ref?.date || null,
        });
      } catch (err) {
        console.error('Error fetching member lineage:', err);
      }
    };
    fetchLineage();
  }, [selectedUser]);

  // Add function to fetch quiz activity
  const [quizActivity, setQuizActivity] = useState<any[]>([]);
  const [loadingQuizActivity, setLoadingQuizActivity] = useState(false);

  useEffect(() => {
    const fetchQuizActivity = async () => {
      if (!selectedUser) return;
      
      setLoadingQuizActivity(true);
      try {
        const { data, error } = await supabase
          .from('quiz_answers')
          .select('*')
          .eq('user_id', selectedUser)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setQuizActivity(data || []);
      } catch (error) {
        console.error('Error fetching quiz activity:', error);
      } finally {
        setLoadingQuizActivity(false);
      }
    };

    fetchQuizActivity();
  }, [selectedUser]);

  return (
    <div className="space-y-5">
      {/* Top Search & Member Selector */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-50 dark:bg-stone-850 p-3 rounded-2xl border border-slate-200/80 dark:border-stone-700">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            Selected Squad Member
          </label>
          <MemberSearchDropdown
            members={users}
            selectedUserId={selectedUser}
            onSelectUser={(id) => {
              if (id) onUserSelect(id);
            }}
            className="w-full"
            placeholder="Select a member from downline..."
          />
        </div>
        
        {selectedUser && (
          <div className="self-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRefresh(selectedUser)}
              disabled={userHistoryLoading}
              className="h-9 px-3 rounded-xl border-slate-200 dark:border-stone-700 text-xs font-bold"
            >
              {userHistoryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-500 mr-1.5" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5 text-slate-500" />
              )}
              Refresh Logs
            </Button>
          </div>
        )}
      </div>
      
      {/* If member is selected and not loading */}
      {selectedUser && !userHistoryLoading && (
        <>
          {/* Member Card Header */}
          {currentMember && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl font-bold">
                  {roleInfo?.emoji || '🏹'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                      {currentMember.name || currentMember.username}
                    </h3>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border font-black ${roleInfo?.badgeBg}`}>
                      {roleInfo?.label}
                    </Badge>
                    {currentMember.suspended && (
                      <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-bold">
                        Suspended
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3 text-purple-500" />
                      Reporting Officer:{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {currentMember.directLeaderUsername || lineage.referrer || 'None (direct signup)'}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Award className="h-3 w-3 text-amber-500" />
                      Recruited by:{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {lineage.referrer || 'Organic (no referral)'}
                      </strong>
                    </span>
                    {lineage.joinDate && (
                      <span>• Joined {formatAttendanceDate(lineage.joinDate)}</span>
                    )}
                    {currentMember.email && (
                      <span>• {currentMember.email}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-3.5 flex items-center space-x-3 rounded-2xl border-slate-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
              <div className="bg-sky-500/10 p-2.5 rounded-xl text-sky-600 dark:text-sky-400 shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-semibold text-slate-400">Last Login Date</p>
                <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                  {getLastLoginDate(selectedUser)}
                </p>
              </div>
            </Card>
            
            <Card className="p-3.5 flex items-center space-x-3 rounded-2xl border-slate-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Attendance Streak</p>
                <p className="font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                  {calculateStreak(userHistory[selectedUser] || [])} Days
                </p>
              </div>
            </Card>
            
            <Card className="p-3.5 flex items-center space-x-3 rounded-2xl border-slate-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Total Check-ins</p>
                <p className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {userHistory[selectedUser]?.length || 0}
                </p>
              </div>
            </Card>
          </div>
          
          {/* Tables: Login History & Quiz Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Login History Table */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 shadow-sm">
              <div className="px-4 py-3 bg-slate-50/80 dark:bg-stone-850/80 border-b border-slate-100 dark:border-stone-800 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  📅 Login Records ({userHistory[selectedUser]?.length || 0})
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-stone-800 text-xs">
                  <thead className="bg-slate-50/50 dark:bg-stone-850/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-slate-500 text-[11px]">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-slate-500 text-[11px]">
                        Login Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                    {userHistory[selectedUser] && userHistory[selectedUser].length > 0 ? (
                      userHistory[selectedUser].map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-stone-800/40">
                          <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                            {formatAttendanceDate(record.attendance_date)}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                            {record.login_time ? new Date(record.login_time).toLocaleTimeString() : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-xs text-slate-400">
                          No login history recorded for this member.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quiz Activity Table */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 shadow-sm">
              <div className="px-4 py-3 bg-slate-50/80 dark:bg-stone-850/80 border-b border-slate-100 dark:border-stone-800 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  ⚔️ Quiz Activity Logs
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-stone-800 text-xs">
                  <thead className="bg-slate-50/50 dark:bg-stone-850/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-slate-500 text-[11px]">
                        Date
                      </th>
                      <th className="px-4 py-2 text-center font-bold text-slate-500 text-[11px]">
                        Questions
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-slate-500 text-[11px]">
                        Gems Earned
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                    {loadingQuizActivity ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center">
                          <Loader2 className="animate-spin h-5 w-5 text-amber-500 mx-auto" />
                        </td>
                      </tr>
                    ) : quizActivity.length > 0 ? (
                      Object.entries(
                        quizActivity.reduce((acc: any, curr) => {
                          const date = new Date(curr.created_at).toLocaleDateString();
                          if (!acc[date]) {
                            acc[date] = { count: 0, gems: 0 };
                          }
                          acc[date].count++;
                          acc[date].gems += curr.points_earned || 0;
                          return acc;
                        }, {})
                      ).map(([date, stats]: [string, any]) => (
                        <tr key={date} className="hover:bg-slate-50/80 dark:hover:bg-stone-800/40">
                          <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                            {date}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-center">
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {stats.count}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap text-right font-bold text-amber-600 dark:text-amber-400">
                            +{stats.gems} 💎
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400">
                          No quiz activity recorded for this member.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
      
      {userHistoryLoading && (
        <div className="flex flex-col justify-center items-center py-16 gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
          <span className="text-xs font-semibold text-slate-500">Loading squad member history...</span>
        </div>
      )}
      
      {!selectedUser && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/30">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
            <User className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Troop Member Selected</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Use the searchable dropdown above to select a squad member and inspect their daily check-ins, attendance streak, and quiz activity.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserHistoryView;

