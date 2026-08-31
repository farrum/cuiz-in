
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecord } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface UserAttendance {
  user_id: string;
  username: string;
  role?: string;
  directLeaderUsername?: string;
  status?: string;
  suspended?: boolean;
  dates: Record<string, boolean>;
}

export const useAttendanceRecords = (
  currentMonth: Date, 
  users: any[]
) => {
  const [attendance, setAttendance] = useState<UserAttendance[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
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
      
      // Process attendance data by user
      const attendanceByUser: Record<string, Record<string, boolean>> = {};
      
      // Initialize attendance data for all users first
      users.forEach(user => {
        attendanceByUser[user.id] = {};
      });
      
      if (attendanceData && attendanceData.length > 0) {
        setAttendanceRecords(attendanceData);
        
        // Fill in attendance records where they exist (normalize date to YYYY-MM-DD)
        attendanceData.forEach((record) => {
          if (record.user_id && record.attendance_date) {
            if (!attendanceByUser[record.user_id]) {
              attendanceByUser[record.user_id] = {};
            }
            const cleanDate = String(record.attendance_date).split('T')[0];
            attendanceByUser[record.user_id][cleanDate] = true;
          }
        });
      } else {
        setAttendanceRecords([]);
      }

      // Create attendance records for each user
      const formattedAttendance: UserAttendance[] = users.map(user => ({
        user_id: user.id,
        username: user.name || user.username || user.display_name || 'Mercenary',
        role: user.role || 'infantry',
        directLeaderUsername: user.directLeaderUsername || '',
        status: user.status || 'active',
        suspended: user.suspended || user.status === 'suspended',
        dates: attendanceByUser[user.id] || {}
      }));
      
      setAttendance(formattedAttendance);
      console.log("Processed attendance data for", formattedAttendance.length, "users");
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      setError(`Failed to load attendance data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, users]);

  const resetAttendance = useCallback(() => {
    setAttendance([]);
    setAttendanceRecords([]);
    setLoading(false);
  }, []);

  return {
    attendance,
    attendanceRecords,
    loading,
    error,
    setError,
    fetchAttendanceData,
    resetAttendance
  };
};
