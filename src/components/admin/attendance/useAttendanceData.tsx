
import { useState } from 'react';
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

  // Run the fetch automatically when users or month changes
  if (users.length > 0) {
    fetchAttendanceData();
  }

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
