
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { STORAGE_KEYS } from '@/utils/quizData';
import ErrorMessage from './ErrorMessage';
import AttendanceCalendarView from './AttendanceCalendarView';
import UserHistoryView from './UserHistoryView';
import { useAttendanceData } from './useAttendanceData';
import AttendanceHeader from './components/AttendanceHeader';
import LoadingState from './components/LoadingState';
import { downloadCSV } from '@/utils/excelUtils';
import { DropdownMember } from './components/MemberSearchDropdown';

interface TeamLeaderAttendanceTrackerProps {
  members?: any[];
}

const TeamLeaderAttendanceTracker: React.FC<TeamLeaderAttendanceTrackerProps> = ({ members: propMembers }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [teamMembers, setTeamMembers] = useState<DropdownMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  // Sync propMembers if provided by parent dashboard
  useEffect(() => {
    if (propMembers && propMembers.length > 0) {
      const formatted: DropdownMember[] = propMembers.map(m => ({
        id: m.id || m.member_id,
        name: m.name || m.display_name || m.username || 'Mercenary',
        username: m.username || m.name || 'Mercenary',
        role: m.role || 'infantry',
        status: m.status || 'active',
        suspended: m.suspended || m.status === 'suspended',
        directLeaderUsername: m.directLeaderUsername || m.direct_leader_username || '',
        directLeaderId: m.directLeaderId || m.direct_leader_id || '',
        email: m.email || '',
        lastActive: m.lastActive || m.last_active || '-'
      }));
      setTeamMembers(formatted);
    } else {
      fetchTeamMembers();
    }
  }, [propMembers]);

  // Use the shared attendance data hook
  const { 
    attendance,
    daysInMonth,
    error,
    setError,
    userHistory,
    userHistoryLoading,
    fetchUserHistory,
    getLastLoginDate,
    formatAttendanceDate,
    fetchAttendanceData,
    loading: attendanceLoading
  } = useAttendanceData(currentMonth, teamMembers);

  // Filter attendance for Calendar view based on selected user or search term
  const displayedAttendance = useMemo(() => {
    if (selectedUser) {
      return attendance.filter(a => a.user_id === selectedUser);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      return attendance.filter(a => 
        a.username.toLowerCase().includes(q) ||
        (a.role && a.role.toLowerCase().includes(q)) ||
        (a.directLeaderUsername && a.directLeaderUsername.toLowerCase().includes(q))
      );
    }
    return attendance;
  }, [attendance, selectedUser, searchTerm]);

  // Recursive downline fetch function
  const fetchTeamMembers = async () => {
    setError(null);
    setFetchingMembers(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || localStorage.getItem(STORAGE_KEYS.USER_ID);

      if (!currentUserId) {
        setTeamMembers([]);
        setFetchingMembers(false);
        return;
      }

      console.log('[Attendance] Fetching full team hierarchy for user:', currentUserId);
      let hierarchyMembers: DropdownMember[] = [];

      // 1. Try PostgreSQL RPC get_my_team_hierarchy for fast recursive tree fetch
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_my_team_hierarchy' as any);

        if (!rpcError && rpcData && (rpcData as any).length > 0) {
          hierarchyMembers = (rpcData as any).map((m: any) => ({
            id: m.member_id || m.id,
            name: m.display_name || m.username || 'Mercenary',
            username: m.username || m.display_name || 'Mercenary',
            role: m.role || 'infantry',
            status: m.status || 'active',
            suspended: m.status === 'suspended',
            directLeaderUsername: m.direct_leader_username || '',
            directLeaderId: m.direct_leader_id || '',
            email: m.email || '',
            lastActive: m.last_active_date || '-'
          }));
        }
      } catch (e) {
        console.warn('[Attendance] RPC get_my_team_hierarchy error, using recursive fallback:', e);
      }

      // 2. Fallback: Recursive multi-level client traversal of user_referrals
      if (hierarchyMembers.length === 0) {
        console.log('[Attendance] Executing multi-level downline traversal fallback...');
        const allReferredIds = new Set<string>();
        let currentLevelIds = [currentUserId];
        const allReferralRecords: any[] = [];
        let depth = 0;
        const MAX_DEPTH = 10;

        while (currentLevelIds.length > 0 && depth < MAX_DEPTH) {
          const { data: refData } = await supabase
            .from('user_referrals')
            .select('*')
            .in('referrer_id', currentLevelIds);

          if (!refData || refData.length === 0) break;

          const nextLevelIds: string[] = [];
          for (const ref of refData) {
            if (ref.referred_id && !allReferredIds.has(ref.referred_id) && ref.referred_id !== currentUserId) {
              allReferredIds.add(ref.referred_id);
              allReferralRecords.push(ref);
              nextLevelIds.push(ref.referred_id);
            }
          }
          currentLevelIds = nextLevelIds;
          depth++;
        }

        if (allReferralRecords.length > 0) {
          const uniqueIds = Array.from(allReferredIds);
          const [profilesRes, rolesRes] = await Promise.all([
            supabase.from('profiles').select('id, username, display_name, suspended, created_at').in('id', uniqueIds),
            supabase.from('user_roles' as any).select('user_id, role').in('user_id', uniqueIds)
          ]);

          const profilesMap = new Map<string, any>();
          const rolesMap = new Map<string, string>();

          if (profilesRes.data) {
            profilesRes.data.forEach(p => profilesMap.set(p.id, p));
          }
          if (rolesRes.data) {
            (rolesRes.data as any[]).forEach(r => rolesMap.set(r.user_id, r.role));
          }

          hierarchyMembers = allReferralRecords.map(ref => {
            const prof = profilesMap.get(ref.referred_id);
            const userRole = rolesMap.get(ref.referred_id) || 'infantry';
            return {
              id: ref.referred_id,
              name: prof?.display_name || prof?.username || ref.referred_name || 'Mercenary',
              username: prof?.username || prof?.display_name || ref.referred_name || 'Mercenary',
              role: userRole,
              status: ref.status || (prof?.suspended ? 'suspended' : 'active'),
              suspended: prof?.suspended || ref.status === 'suspended',
              directLeaderUsername: ref.referrer_name || '',
              directLeaderId: ref.referrer_id || '',
              email: ref.referred_email || '',
              lastActive: ref.last_active_date || prof?.created_at || '-'
            };
          });
        }
      }

      console.log(`[Attendance] Successfully loaded ${hierarchyMembers.length} team members across all downline levels.`);
      setTeamMembers(hierarchyMembers);
    } catch (error: any) {
      console.error('[Attendance] Error fetching team members:', error);
      setError(`Failed to load squad members: ${error.message}`);
    } finally {
      setFetchingMembers(false);
    }
  };

  // Handle month navigation
  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleUserSelect = (userId: string | null) => {
    setSelectedUser(userId);
    if (userId) {
      fetchUserHistory(userId);
    }
  };

  // Create and download CSV file with attendance data
  const exportAttendance = () => {
    const csvData = [
      ['Username', 'Role', 'Direct Commander', ...daysInMonth.map(day => day.toISOString().split('T')[0]), 'Total Days Present']
    ];
    
    displayedAttendance.forEach(user => {
      const row = [user.username, user.role || 'infantry', user.directLeaderUsername || '-'];
      let totalPresent = 0;
      daysInMonth.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        const isPresent = user.dates[dateStr] ? true : false;
        row.push(isPresent ? 'Present' : 'Absent');
        if (isPresent) totalPresent++;
      });
      row.push(totalPresent.toString());
      csvData.push(row);
    });
    
    downloadCSV(
      csvData.map(row => {
        const obj: Record<string, string> = {};
        row.forEach((cell, i) => {
          obj[i.toString()] = cell;
        });
        return obj;
      }),
      `squad-attendance-${currentMonth.toISOString().split('T')[0].substring(0, 7)}`
    );
  };

  const isLoading = attendanceLoading || fetchingMembers;

  return (
    <Card className="max-w-full overflow-hidden border-0 shadow-none bg-transparent">
      <CardHeader className="p-0 pb-4">
        <AttendanceHeader
          currentMonth={currentMonth}
          view={view}
          searchTerm={searchTerm}
          loading={isLoading}
          attendanceCount={displayedAttendance.length}
          members={teamMembers}
          selectedUserId={selectedUser}
          onSelectUser={handleUserSelect}
          onMonthChange={handleMonthChange}
          onViewChange={setView}
          onSearchChange={setSearchTerm}
          onRefresh={() => {
            fetchTeamMembers();
            fetchAttendanceData();
            if (selectedUser) fetchUserHistory(selectedUser);
          }}
          onExport={exportAttendance}
        />
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="mb-4">
            <ErrorMessage error={error} onDismiss={() => setError(null)} />
          </div>
        )}
        
        {isLoading && teamMembers.length === 0 ? (
          <LoadingState message="Loading squad hierarchy and attendance logs..." />
        ) : teamMembers.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/30">
            <p className="text-xs font-semibold text-slate-500">
              No squad members found under your command yet. Recruits will appear here automatically across all tiers.
            </p>
          </div>
        ) : (
          <>
            {view === 'calendar' && (
              <AttendanceCalendarView 
                attendance={displayedAttendance} 
                daysInMonth={daysInMonth} 
                loading={attendanceLoading}
                onResetFilter={() => {
                  setSelectedUser(null);
                  setSearchTerm('');
                }}
              />
            )}
            
            {view === 'list' && (
              <UserHistoryView 
                users={teamMembers}
                selectedUser={selectedUser || (teamMembers.length > 0 ? teamMembers[0].id : null)}
                userHistory={userHistory}
                userHistoryLoading={userHistoryLoading}
                onUserSelect={handleUserSelect}
                onRefresh={fetchUserHistory}
                getLastLoginDate={getLastLoginDate}
                formatAttendanceDate={formatAttendanceDate}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamLeaderAttendanceTracker;

