
import { useState, useEffect, useMemo } from 'react';
import { 
  useAttendanceRecords, 
  useUserAttendanceHistory, 
  useAttendanceStats, 
  useDaysInMonth 
} from './hooks';

export const useAttendanceData = (currentMonth: Date, users: any[]) => {
  const [error, setError] = useState<string | null>(null);

  // Use our new focused hooks
  const { 
    attendance, 
    attendanceRecords, 
    loading, 
    fetchAttendanceData 
  } = useAttendanceRecords(currentMonth, users);

  const { 
    userHistory, 
    userHistoryLoading, 
    fetchUserHistory, 
    getLastLoginDate, 
    formatAttendanceDate 
  } = useUserAttendanceHistory();

  const { getUserAttendanceStats } = useAttendanceStats(userHistory);

  const { daysInMonth } = useDaysInMonth(currentMonth);

  // Memoize users to avoid unnecessary re-renders
  const memoizedUsers = useMemo(() => users, [JSON.stringify(users.map(user => user.id))]);

  // Run fetch only when dependencies change, not on every render
  useEffect(() => {
    if (memoizedUsers.length > 0) {
      fetchAttendanceData();
    }
  }, [currentMonth, memoizedUsers, fetchAttendanceData]);

  return {
    attendance,
    attendanceRecords,
    loading,
    error,
    daysInMonth,
    userHistory,
    userHistoryLoading,
    fetchUserHistory,
    getLastLoginDate,
    formatAttendanceDate,
    getUserAttendanceStats,
    setError,
    fetchAttendanceData
  };
};
