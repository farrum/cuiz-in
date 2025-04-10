
export interface AttendanceRecord {
  id: string;
  user_id: string;
  username: string;
  attendance_date: string;
  login_time: string;
}

export interface UserAttendance {
  user_id: string;
  username: string;
  dates: Record<string, boolean>;
}
