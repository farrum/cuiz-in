
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Loader2, 
  User, 
  X 
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDate } from 'date-fns';
import { ExtendedDatabase } from '@/types/database-extensions';

interface Attendance {
  user_id: string;
  username: string;
  dates: Record<string, boolean>;
}

// Define type for attendance record from database
interface AttendanceRecord {
  user_id: string;
  username: string;
  attendance_date: string;
  login_time: string;
}

const UserAttendanceTracker: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [users, setUsers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchAttendanceData();
    }
  }, [users, currentMonth]);

  useEffect(() => {
    // Get all days in the current month
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
    setDaysInMonth(days);
  }, [currentMonth]);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, username, suspended')
        .order('username');
        
      if (error) throw error;
      
      if (usersData) {
        setUsers(usersData);
        // After fetching users, fetch attendance data for the first time
        console.log("Fetched users:", usersData.length);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      console.log(`Fetching attendance data from ${startDate} to ${endDate}`);
      
      // Type assert the returned data to the specific shape we expect
      const { data: attendanceData, error } = await supabase
        .from('user_attendance')
        .select('user_id, username, attendance_date, login_time')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);
        
      if (error) throw error;
      
      console.log(`Fetched ${attendanceData?.length || 0} attendance records`);
      
      // Process attendance data by user
      const attendanceByUser: Record<string, Record<string, boolean>> = {};
      
      attendanceData?.forEach((record) => {
        if (!attendanceByUser[record.user_id]) {
          attendanceByUser[record.user_id] = {};
        }
        attendanceByUser[record.user_id][record.attendance_date] = true;
      });
      
      // Create attendance records for each user
      const formattedAttendance = users.map(user => ({
        user_id: user.id,
        username: user.username,
        dates: attendanceByUser[user.id] || {}
      }));
      
      setAttendance(formattedAttendance);
      console.log("Processed attendance data:", formattedAttendance.length);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (userId: string) => {
    try {
      console.log(`Fetching attendance history for user: ${userId}`);
      
      const { data: historyData, error } = await supabase
        .from('user_attendance')
        .select('attendance_date, login_time')
        .eq('user_id', userId)
        .order('attendance_date', { ascending: false })
        .limit(90); // Get last 3 months
        
      if (error) throw error;
      
      console.log(`Fetched ${historyData?.length || 0} history records for user`);
      
      const userAttendanceHistory: Record<string, boolean> = {};
      
      historyData?.forEach((record) => {
        userAttendanceHistory[record.attendance_date] = true;
      });
      
      setUserHistory({
        ...userHistory,
        [userId]: userAttendanceHistory
      });
      
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error fetching user history:', error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

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
    a.setAttribute('download', `attendance-${format(currentMonth, 'MMM-yyyy')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="max-w-full overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-6 w-6" /> 
              User Attendance Tracker
            </CardTitle>
            <CardDescription>
              Track daily user logins across your platform
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
        <div className="flex justify-between items-center mt-4">
          <Tabs 
            defaultValue="calendar" 
            value={view} 
            onValueChange={(value) => setView(value as 'calendar' | 'list')}
          >
            <TabsList>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="list">User History</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportAttendance}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Loading attendance data...</span>
          </div>
        ) : (
          <>
            <TabsContent value="calendar" className="block">
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[150px] sticky left-0 bg-background">User</TableHead>
                      {daysInMonth.map(day => (
                        <TableHead key={day.toString()} className="text-center w-[60px]">
                          {getDate(day)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map(user => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium sticky left-0 bg-background">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {user.username}
                          </div>
                        </TableCell>
                        {daysInMonth.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const isPresent = user.dates[dateStr] ? true : false;
                          return (
                            <TableCell key={dateStr} className="text-center">
                              {isPresent ? (
                                <div className="mx-auto flex items-center justify-center bg-green-100 dark:bg-green-900/20 w-8 h-8 rounded-full">
                                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                              ) : (
                                <div className="mx-auto flex items-center justify-center bg-red-100 dark:bg-red-900/20 w-8 h-8 rounded-full">
                                  <X className="h-4 w-4 text-red-500 dark:text-red-400" />
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    {attendance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={daysInMonth.length + 1} className="text-center py-8">
                          No attendance data found for this month
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="list" className="block">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-1">
                  <div className="mb-4">
                    <label className="text-sm font-medium" htmlFor="user-select">
                      Select User
                    </label>
                    <Select 
                      value={selectedUser || ""} 
                      onValueChange={(value) => fetchUserHistory(value)}
                    >
                      <SelectTrigger id="user-select" className="mt-1">
                        <SelectValue placeholder="Choose a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedUser && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-sm font-medium">User Status</h3>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Last Login</span>
                          <span className="text-sm font-medium">
                            {userHistory[selectedUser] && 
                             Object.keys(userHistory[selectedUser]).length > 0 ? 
                              format(new Date(Object.keys(userHistory[selectedUser])[0]), 'dd MMM yyyy') : 
                              'Never'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">Total Days Active</span>
                          <span className="text-sm font-medium">
                            {userHistory[selectedUser] ? Object.keys(userHistory[selectedUser]).length : 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">Status</span>
                          <span className="text-sm font-medium">
                            {users.find(u => u.id === selectedUser)?.suspended ? (
                              <span className="text-red-500">Suspended</span>
                            ) : (
                              <span className="text-green-500">Active</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  {selectedUser ? (
                    Object.keys(userHistory[selectedUser] || {}).length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="font-medium">Login History</h3>
                        <div className="max-h-[400px] overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.keys(userHistory[selectedUser] || {})
                                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                                .map(date => (
                                  <TableRow key={date}>
                                    <TableCell>{format(new Date(date), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <Check className="h-4 w-4 mr-1 text-green-600" />
                                        Present
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Calendar className="h-16 w-16 mb-4" strokeWidth={1} />
                        <p>No login history found for this user</p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <User className="h-16 w-16 mb-4" strokeWidth={1} />
                      <p>Select a user to view their attendance history</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAttendanceTracker;
