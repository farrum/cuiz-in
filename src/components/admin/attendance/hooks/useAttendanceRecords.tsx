
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface UserAttendance {
  user_id: string;
  username: string;
  dates: Record<string, boolean>;
}

export const useAttendanceRecords = (
  currentMonth: Date, 
  users: any[]
) => {
  const [attendance, setAttendance] = useState<UserAttendance[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceData = useCallback(async () => {
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
  }, [currentMonth, users]);

  return {
    attendance,
    attendanceRecords,
    loading,
    error,
    setError,
    fetchAttendanceData
  };
};
