
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader 
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import ErrorMessage from './ErrorMessage';
import AttendanceCalendarView from './AttendanceCalendarView';
import UserHistoryView from './UserHistoryView';
import { useAttendanceData } from './useAttendanceData';

// Import new components
import AttendanceHeader from './components/AttendanceHeader';
import LoadingState from './components/LoadingState';

const UserAttendanceTracker: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Memoize users array to prevent unnecessary re-renders
  const memoizedUsers = useMemo(() => users, [users]);
  
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
    fetchAttendanceData
  } = useAttendanceData(currentMonth, memoizedUsers);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching users for attendance tracker...');
      
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, username, suspended')
        .order('username');
        
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      if (usersData) {
        console.log(`Fetched ${usersData.length} users`);
        setUsers(usersData);
        setFilteredUsers(usersData);
      } else {
        console.log("No users found");
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(`Failed to load users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [setError]);

  // Handle month navigation
  const handleMonthChange = useCallback((direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    } else {
      setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    }
  }, []);

  const handleUserSelect = useCallback((userId: string) => {
    setSelectedUser(userId);
    fetchUserHistory(userId);
  }, [fetchUserHistory]);

  // Create and download CSV file with attendance data
  const exportAttendance = useCallback(() => {
    // Create CSV content
    let csvContent = "Username,";
    
    // Add headers for each day
    daysInMonth.forEach(day => {
      csvContent += format(day, 'dd/MM/yyyy') + ",";
    });
    csvContent += "Total Days Present\n";
    
    // Add data for each user
    attendance.forEach(user => {
      csvContent += user.username + ",";
      
      let totalPresent = 0;
      daysInMonth.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isPresent = user.dates[dateStr] ? true : false;
        csvContent += (isPresent ? "Present" : "Absent") + ",";
        if (isPresent) totalPresent++;
      });
      
      csvContent += totalPresent + "\n";
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `attendance-${format(currentMonth, 'MMM-yyyy')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [attendance, daysInMonth, currentMonth]);

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
          onViewChange={(newView) => setView(newView)}
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
          <LoadingState />
        ) : (
          <>
            <TabsContent value="calendar" className="mt-0">
              <AttendanceCalendarView 
                attendance={attendance} 
                daysInMonth={daysInMonth} 
                loading={loading} 
              />
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <UserHistoryView 
                users={filteredUsers}
                selectedUser={selectedUser}
                userHistory={userHistory}
                userHistoryLoading={userHistoryLoading}
                onUserSelect={handleUserSelect}
                onRefresh={fetchUserHistory}
                getLastLoginDate={getLastLoginDate}
                formatAttendanceDate={formatAttendanceDate}
              />
            </TabsContent>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAttendanceTracker;
