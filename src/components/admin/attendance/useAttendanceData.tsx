
import { useState, useEffect } from 'react';
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
    fetchAttendanceData,
    resetAttendance
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

  // Use useEffect to run the fetch when dependencies change
  useEffect(() => {
    if (users.length > 0) {
      fetchAttendanceData();
    } else {
      // No members to report on — clear state instead of hanging on "loading"
      resetAttendance();
    }
  }, [currentMonth, users, fetchAttendanceData, resetAttendance]);

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
