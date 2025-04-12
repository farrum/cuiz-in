
export interface AttendanceRecord {
  id: string;
  user_id: string;
  username: string;
  attendance_date: string;
  login_time: string;
  created_at?: string;
}

export interface UserAttendance {
  user_id: string;
  username: string;
  dates: Record<string, boolean>; // Map of dates to attendance status
}

export interface AttendanceCalendarProps {
  month: Date;
  userId?: string;
  teamView?: boolean;
}

export interface TeamMemberAttendance {
  userId: string;
  username: string;
  attendanceDates: string[];
  lastActive: string | null;
  totalDaysActive: number;
  activeDaysThisMonth: number;
}
