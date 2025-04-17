
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isValid } from 'date-fns';
import UserHistoryView from './UserHistoryView';
import AttendanceCalendarView from './AttendanceCalendarView';
import ErrorMessage from './ErrorMessage';

interface UserAttendanceTrackerProps {
  userId?: string;
}

const UserAttendanceTracker: React.FC<UserAttendanceTrackerProps> = ({ userId }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(userId || null);
  const [userHistory, setUserHistory] = useState<Record<string, any[]>>({});
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'history' | 'calendar'>('history');
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);
  const [attendance, setAttendance] = useState<Array<{ user_id: string; username: string; dates: Record<string, boolean> }>>([]);
  const [loading, setLoading] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users for attendance tracker...');
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, suspended')
          .order('username');
          
        if (error) throw error;
        console.log(`Fetched ${data?.length} users`);
        setUsers(data || []);
        
        // If userId was passed as prop, select that user automatically
        if (userId && !selectedUser) {
          setSelectedUser(userId);
          fetchUserHistory(userId);
        }
      } catch (error: any) {
        setError(`Error fetching users: ${error.message}`);
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [userId]);

  const fetchUserHistory = async (userId: string) => {
    if (!userId) return;
    
    setUserHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_attendance')
        .select('*')
        .eq('user_id', userId)
        .order('login_time', { ascending: false });
        
      if (error) throw error;
      
      // Store the history by user ID
      setUserHistory(prev => ({
        ...prev,
        [userId]: data || []
      }));
    } catch (error: any) {
      setError(`Error fetching attendance history: ${error.message}`);
      console.error('Error fetching attendance history:', error);
    } finally {
      setUserHistoryLoading(false);
    }
  };

  // Generate calendar data for the selected month
  useEffect(() => {
    if (selectedUser) {
      generateCalendarData(selectedUser);
    }
  }, [selectedUser]);

  const generateCalendarData = async (userId: string) => {
    setLoading(true);
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get all days in the current month
      const days = new Date(year, month + 1, 0).getDate();
      const daysArray = Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
      setDaysInMonth(daysArray);
      
      // Get user attendance data
      if (userId && users.length > 0) {
        const selectedUserData = users.find(u => u.id === userId);
        if (selectedUserData) {
          const userData = userHistory[userId] || [];
          
          // Create attendance record by date
          const userDates: Record<string, boolean> = {};
          userData.forEach(record => {
            const dateStr = record.attendance_date.split('T')[0];
            userDates[dateStr] = true;
          });
          
          setAttendance([{
            user_id: userId,
            username: selectedUserData.username,
            dates: userDates
          }]);
        }
      }
    } catch (error: any) {
      setError(`Error generating calendar data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    fetchUserHistory(userId);
  };

  const handleRefresh = (userId: string) => {
    fetchUserHistory(userId);
  };
  
  const formatAttendanceDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? format(date, 'MMMM d, yyyy') : dateStr;
    } catch (e) {
      return dateStr;
    }
  };
  
  const getLastLoginDate = (userId: string) => {
    const history = userHistory[userId];
    if (!history || history.length === 0) return 'No login history';
    
    return formatAttendanceDate(history[0].attendance_date);
  };

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Attendance Tracker</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setView('history')} 
            className={`px-3 py-1 rounded ${view === 'history' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            History View
          </button>
          <button 
            onClick={() => setView('calendar')} 
            className={`px-3 py-1 rounded ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {view === 'history' ? (
        <UserHistoryView 
          users={users}
          selectedUser={selectedUser}
          userHistory={userHistory}
          userHistoryLoading={userHistoryLoading}
          onUserSelect={handleUserSelect}
          onRefresh={handleRefresh}
          getLastLoginDate={getLastLoginDate}
          formatAttendanceDate={formatAttendanceDate}
        />
      ) : (
        <AttendanceCalendarView 
          attendance={attendance} 
          daysInMonth={daysInMonth} 
          loading={loading}
        />
      )}
    </div>
  );
};

export default UserAttendanceTracker;
