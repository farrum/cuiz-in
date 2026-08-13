
import React, { useState, useEffect } from 'react';
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

const TeamLeaderAttendanceTracker: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
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
    getUserAttendanceStats,
    fetchAttendanceData,
    loading
  } = useAttendanceData(currentMonth, teamMembers);

  // Fetch team members on component mount
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Filter team members when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMembers(teamMembers);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = teamMembers.filter(member => 
        member.username.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredMembers(filtered);
    }
  }, [searchTerm, teamMembers]);

  const fetchTeamMembers = async () => {
    setError(null);
    try {
      // Prefer the live Supabase session; fall back to the stored id
      const { data: authData } = await supabase.auth.getUser();
      const teamLeaderId = authData?.user?.id || localStorage.getItem(STORAGE_KEYS.USER_ID);

      if (!teamLeaderId) {
        setTeamMembers([]);
        setFilteredMembers([]);
        throw new Error('Team leader session not found. Please sign in again.');
      }

      console.log('Fetching team members for team leader:', teamLeaderId);
      
      const { data: referrals, error } = await supabase
        .from('user_referrals')
        .select('referred_id, referred_name')
        .eq('referrer_id', teamLeaderId);
        
      if (error) throw error;
      
      if (referrals && referrals.length > 0) {
        const memberIds = referrals.map(r => r.referred_id);
        
        // Get the detailed user info from profiles table
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('id, username, suspended')
          .in('id', memberIds);
          
        if (membersError) throw membersError;
        
        console.log(`Fetched ${membersData?.length || 0} team members`);
        setTeamMembers(membersData || []);
        setFilteredMembers(membersData || []);
      } else {
        console.log("No team members found");
        setTeamMembers([]);
        setFilteredMembers([]);
      }
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      setError(`Failed to load team members: ${error.message}`);
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

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    fetchUserHistory(userId);
  };

  // Create and download CSV file with attendance data
  const exportAttendance = () => {
    // Create CSV array with headers and data
    const csvData = [
      ['Username', ...daysInMonth.map(day => day.toISOString().split('T')[0]), 'Total Days Present']
    ];
    
    // Add data for each user
    attendance.forEach(user => {
      const row = [user.username];
      
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
    
    // Download CSV using utility function
    downloadCSV(
      csvData.map(row => {
        const obj: Record<string, string> = {};
        row.forEach((cell, i) => {
          obj[i.toString()] = cell;
        });
        return obj;
      }),
      `team-attendance-${currentMonth.toISOString().split('T')[0].substring(0, 7)}`
    );
  };

  return (
    <Card className="max-w-full overflow-hidden">
      <CardHeader>
        <AttendanceHeader
          currentMonth={currentMonth}
          view={view}
          searchTerm={searchTerm}
          loading={loading}
          attendanceCount={attendance.length}
          onMonthChange={handleMonthChange}
          onViewChange={setView}
          onSearchChange={setSearchTerm}
          onRefresh={fetchAttendanceData}
          onExport={exportAttendance}
        />
      </CardHeader>
      <CardContent>
        {error && (
          <ErrorMessage error={error} onDismiss={() => setError(null)} />
        )}
        
        {loading ? (
          <LoadingState message="Loading team attendance data..." />
        ) : (
          <>
            {view === 'calendar' && (
              <AttendanceCalendarView 
                attendance={attendance} 
                daysInMonth={daysInMonth} 
                loading={loading} 
              />
            )}
            
            {view === 'list' && (
              <UserHistoryView 
                users={filteredMembers}
                selectedUser={selectedUser}
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
