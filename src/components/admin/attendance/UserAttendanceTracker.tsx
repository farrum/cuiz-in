
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
    return <ErrorMessage message={error} />;
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
          users={users}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
        />
      )}
    </div>
  );
};

export default UserAttendanceTracker;
