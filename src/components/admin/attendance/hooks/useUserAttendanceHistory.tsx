
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '../types';
import { format, parseISO, isValid } from 'date-fns';

export const useUserAttendanceHistory = () => {
  const [userHistory, setUserHistory] = useState<Record<string, AttendanceRecord[]>>({});
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchUserHistory = async (userId: string) => {
    setUserHistoryLoading(true);
    setUserHistory(prev => ({...prev, [userId]: []})); // Reset previous data for this user
    setHistoryError(null);
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
      setHistoryError(`Failed to load user history: ${error.message}`);
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

  return {
    userHistory,
    userHistoryLoading,
    historyError,
    fetchUserHistory,
    getLastLoginDate,
    formatAttendanceDate,
  };
};
