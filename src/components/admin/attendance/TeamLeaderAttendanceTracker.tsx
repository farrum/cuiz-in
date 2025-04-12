
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { Input } from "@/components/ui/input";
import { STORAGE_KEYS } from '@/utils/quizData';
import ErrorMessage from './ErrorMessage';
import AttendanceCalendarView from './AttendanceCalendarView';
import UserHistoryView from './UserHistoryView';
import { AttendanceRecord } from './types';

const TeamLeaderAttendanceTracker: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<Record<string, AttendanceRecord[]>>({});
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch team members on component mount
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Update days in month and fetch attendance when currentMonth changes
  useEffect(() => {
    // Get all days in the current month
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const days = [];
    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      days.push(new Date(day));
    }
    
    setDaysInMonth(days);
    
    if (teamMembers.length > 0) {
      fetchAttendanceData();
    }
  }, [currentMonth, teamMembers]);

  // Filter team members when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMembers(teamMembers);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = teamMembers.filter(member => 
        member.username.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredMembers(filtered);
    }
  }, [searchTerm, teamMembers]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const teamLeaderId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      if (!teamLeaderId) {
        throw new Error('Team leader ID not found');
      }

      console.log('Fetching team members for team leader:', teamLeaderId);
      
      const { data: referrals, error } = await supabase
        .from('user_referrals')
        .select('referred_id, referred_name')
        .eq('referrer_id', teamLeaderId);
        
      if (error) throw error;
      
      if (referrals && referrals.length > 0) {
        const memberIds = referrals.map(r => r.referred_id);
        
        // Get the detailed user info from profiles table
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select('id, username, suspended')
          .in('id', memberIds);
          
        if (membersError) throw membersError;
        
        console.log(`Fetched ${membersData?.length || 0} team members`);
        setTeamMembers(membersData || []);
        setFilteredMembers(membersData || []);
      } else {
        console.log("No team members found");
        setTeamMembers([]);
        setFilteredMembers([]);
      }
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      setError(`Failed to load team members: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    if (teamMembers.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const startDate = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), 'yyyy-MM-dd');
      const endDate = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0), 'yyyy-MM-dd');
      
      console.log(`Fetching attendance data from ${startDate} to ${endDate}`);
      
      // Get member IDs
      const memberIds = teamMembers.map(member => member.id);
      
      // Fetch attendance data directly from Supabase for current month
      const { data: attendanceData, error } = await supabase
        .from('user_attendance')
        .select('id, user_id, username, attendance_date, login_time')
        .in('user_id', memberIds)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false });
        
      if (error) {
        console.error('Error fetching attendance data:', error);
        throw error;
      }
      
      console.log(`Fetched ${attendanceData?.length || 0} attendance records for current month`);
      
      if (attendanceData && attendanceData.length > 0) {
        // Process attendance data by user
        const attendanceByUser: Record<string, Record<string, boolean>> = {};
        
        // Initialize attendance data for all team members first
        teamMembers.forEach(member => {
          attendanceByUser[member.id] = {};
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
        
        // Create attendance records for each team member
        const formattedAttendance = teamMembers.map(member => ({
          user_id: member.id,
          username: member.username,
          dates: attendanceByUser[member.id] || {}
        }));
        
        setAttendance(formattedAttendance);
        console.log("Processed attendance data for", formattedAttendance.length, "team members");
      } else {
        // If no attendance data, create empty records
        const emptyAttendance = teamMembers.map(member => ({
          user_id: member.id,
          username: member.username,
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
      console.log(`Fetching attendance history for team member: ${userId}`);
      
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
        console.log("No attendance history found for this team member");
      }
    } catch (error: any) {
      console.error('Error fetching user history:', error);
      setError(`Failed to load team member history: ${error.message}`);
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
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? dateStr : format(date, 'dd MMM yyyy');
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
      
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : format(date, 'dd MMM yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateStr || 'Invalid date';
    }
  };

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    fetchUserHistory(userId);
  };

  // Create and download CSV file with attendance data
  const exportAttendance = () => {
    // Create CSV content
    let csvContent = "Username,";
    
    // Add headers for each day
    daysInMonth.forEach(day => {
      csvContent += format(day, 'dd/MM/yyyy') + ",";
    });
    csvContent += "Total Days Present\n";
    
    // Add data for each user
    attendance.forEach(user => {
      csvContent += user.username + ",";
      
      let totalPresent = 0;
      daysInMonth.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const isPresent = user.dates[dateStr] ? true : false;
        csvContent += (isPresent ? "Present" : "Absent") + ",";
        if (isPresent) totalPresent++;
      });
      
      csvContent += totalPresent + "\n";
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `team-attendance-${format(currentMonth, 'MMM-yyyy')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="max-w-full overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-6 w-6" /> 
              Team Members Attendance
            </CardTitle>
            <CardDescription>
              Track daily attendance for your team members
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
          <Tabs 
            defaultValue="calendar" 
            value={view} 
            onValueChange={(value) => setView(value as 'calendar' | 'list')}
          >
            <TabsList>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="list">Member History</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-8 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAttendanceData}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportAttendance}
              disabled={attendance.length === 0 || loading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <ErrorMessage error={error} onDismiss={() => setError(null)} />
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Loading attendance data...</span>
          </div>
        ) : (
          <>
            <TabsContent value="calendar" className="mt-0">
              <AttendanceCalendarView 
                attendance={attendance} 
                daysInMonth={daysInMonth} 
                loading={loading} 
              />
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <UserHistoryView 
                users={filteredMembers}
                selectedUser={selectedUser}
                userHistory={userHistory}
                userHistoryLoading={userHistoryLoading}
                onUserSelect={handleUserSelect}
                onRefresh={fetchUserHistory}
                getLastLoginDate={getLastLoginDate}
                formatAttendanceDate={formatAttendanceDate}
              />
            </TabsContent>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamLeaderAttendanceTracker;
