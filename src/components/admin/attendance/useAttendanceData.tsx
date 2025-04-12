
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isValid, differenceInDays } from 'date-fns';
import { AttendanceRecord, UserAttendance } from './types';

export const useAttendanceData = (currentMonth: Date, users: any[]) => {
  const [attendance, setAttendance] = useState<UserAttendance[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);
  const [userHistory, setUserHistory] = useState<Record<string, AttendanceRecord[]>>({});
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);

  // Update days in month when current month changes
  useEffect(() => {
    // Get all days in the current month
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
    setDaysInMonth(days);
    
    if (users.length > 0) {
      fetchAttendanceData();
    }
  }, [users, currentMonth]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      console.log(`Fetching attendance data from ${startDate} to ${endDate}`);
      
      // Fetch attendance data directly from Supabase for current month
      const { data: attendanceData, error } = await supabase
        .from('user_attendance')
        .select('id, user_id, username, attendance_date, login_time')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching attendance data:', error);
        throw error;
      }
      
      console.log(`Fetched ${attendanceData?.length || 0} attendance records for current month`);
      
      if (attendanceData && attendanceData.length > 0) {
        setAttendanceRecords(attendanceData);
        
        // Process attendance data by user
        const attendanceByUser: Record<string, Record<string, boolean>> = {};
        
        // Initialize attendance data for all users first
        users.forEach(user => {
          attendanceByUser[user.id] = {};
        });
        
        // Fill in attendance records where they exist
        attendanceData.forEach((record) => {
          if (record.user_id && record.attendance_date) {
            if (!attendanceByUser[record.user_id]) {
              attendanceByUser[record.user_id] = {};
            }
            attendanceByUser[record.user_id][record.attendance_date] = true;
          }
        });
        
        // Create attendance records for each user
        const formattedAttendance = users.map(user => ({
          user_id: user.id,
          username: user.username,
          dates: attendanceByUser[user.id] || {}
        }));
        
        setAttendance(formattedAttendance);
        console.log("Processed attendance data for", formattedAttendance.length, "users");
      } else {
        // If no attendance data, create empty records
        const emptyAttendance = users.map(user => ({
          user_id: user.id,
          username: user.username,
          dates: {}
        }));
        setAttendance(emptyAttendance);
        console.log("No attendance data found for current month, creating empty records");
      }
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      setError(`Failed to load attendance data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (userId: string) => {
    setUserHistoryLoading(true);
    setUserHistory(prev => ({...prev, [userId]: []})); // Reset previous data for this user
    setError(null);
    try {
      console.log(`Fetching attendance history for user: ${userId}`);
      
      const { data: historyData, error } = await supabase
        .from('user_attendance')
        .select('id, user_id, username, attendance_date, login_time')
        .eq('user_id', userId)
        .order('attendance_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching user history:', error);
        throw error;
      }
      
      console.log(`Fetched ${historyData?.length || 0} history records for user`);
      
      if (historyData && historyData.length > 0) {
        setUserHistory(prev => ({
          ...prev,
          [userId]: historyData
        }));
      } else {
        // Set empty history if no data found
        setUserHistory(prev => ({
          ...prev,
          [userId]: []
        }));
        console.log("No attendance history found for this user");
      }
    } catch (error: any) {
      console.error('Error fetching user history:', error);
      setError(`Failed to load user history: ${error.message}`);
    } finally {
      setUserHistoryLoading(false);
    }
  };
  
  const getLastLoginDate = (userId: string): string => {
    if (!userHistory[userId] || userHistory[userId].length === 0) {
      return 'Never';
    }
    
    const records = userHistory[userId];
    if (records.length > 0) {
      try {
        const dateStr = records[0].attendance_date;
        if (isValid(parseISO(dateStr))) {
          return format(parseISO(dateStr), 'dd MMM yyyy');
        }
        return dateStr;
      } catch (err) {
        console.error('Date parsing error:', err);
        return 'Invalid date';
      }
    }
    return 'Never';
  };

  const formatAttendanceDate = (dateStr: string): string => {
    try {
      if (!dateStr) return 'Unknown';
      
      const date = parseISO(dateStr);
      if (isValid(date)) {
        return format(date, 'dd MMM yyyy');
      }
      return dateStr;
    } catch (err) {
      console.error('Error formatting date:', err, dateStr);
      return dateStr || 'Invalid date';
    }
  };

  const getUserAttendanceStats = (userId: string) => {
    if (!userHistory[userId] || userHistory[userId].length === 0) {
      return {
        totalDays: 0,
        currentStreak: 0,
        lastActiveDate: null
      };
    }

    const records = userHistory[userId];
    
    // Get total unique days
    const uniqueDates = new Set(records.map(r => r.attendance_date));
    const totalDays = uniqueDates.size;
    
    // Calculate current streak
    const sortedDates = [...uniqueDates].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    let currentStreak = 1;
    let lastDate = parseISO(sortedDates[0]);
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = parseISO(sortedDates[i]);
      const diff = differenceInDays(lastDate, currentDate);
      
      if (diff === 1) {
        currentStreak++;
        lastDate = currentDate;
      } else {
        break;
      }
    }
    
    return {
      totalDays,
      currentStreak,
      lastActiveDate: sortedDates[0]
    };
  };
  
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
