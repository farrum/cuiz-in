
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { format, parse, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Check, X, Search, Download } from 'lucide-react';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { useToast } from '@/hooks/use-toast';
import { AttendanceRecord } from '@/types/database-extensions';

interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  profile_picture?: string;
}

interface UserAttendanceData {
  user: UserProfile;
  attendanceDates: string[];
  presentDays: number;
  absentDays: number;
}

const UserAttendanceTracker: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userAttendanceData, setUserAttendanceData] = useState<UserAttendanceData[]>([]);
  
  // Get dates for the selected month
  const monthStart = parse(selectedMonth, 'yyyy-MM', new Date());
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(monthStart),
    end: endOfMonth(monthStart)
  });
  
  // Fetch users and their attendance data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all users
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, display_name, profile_picture')
          .order('username');
          
        if (profileError) throw profileError;
        
        setUsers(profileData || []);
        
        // Parse the selected month to get date range
        const startDate = startOfMonth(parse(selectedMonth, 'yyyy-MM', new Date()));
        const endDate = endOfMonth(parse(selectedMonth, 'yyyy-MM', new Date()));
        
        // Fetch attendance records for the selected month
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('user_attendance')
          .select('user_id, username, attendance_date, login_time')
          .gte('attendance_date', format(startDate, 'yyyy-MM-dd'))
          .lte('attendance_date', format(endDate, 'yyyy-MM-dd')) as { data: AttendanceRecord[] | null, error: any };
          
        if (attendanceError) throw attendanceError;
        
        setAttendanceRecords(attendanceData || []);
        
        // Process data for displaying
        processAttendanceData(profileData || [], attendanceData || [], daysInMonth);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedMonth, toast]);
  
  // Process and transform the attendance data
  const processAttendanceData = (
    users: UserProfile[],
    records: AttendanceRecord[],
    daysInMonth: Date[]
  ) => {
    const userData: UserAttendanceData[] = users.map(user => {
      // Find all attendance records for this user
      const userRecords = records.filter(record => record.user_id === user.id);
      
      // Get unique dates the user was present
      const attendanceDates = userRecords.map(record => record.attendance_date);
      
      // Calculate present and absent days
      const presentDays = new Set(attendanceDates).size;
      const absentDays = daysInMonth.length - presentDays;
      
      return {
        user,
        attendanceDates,
        presentDays,
        absentDays
      };
    });
    
    setUserAttendanceData(userData);
  };
  
  // Handle month selection
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };
  
  // Check if user was present on a specific date
  const wasUserPresent = (userId: string, date: Date): boolean => {
    const userData = userAttendanceData.find(data => data.user.id === userId);
    if (!userData) return false;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    return userData.attendanceDates.includes(formattedDate);
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Create months list for the dropdown (last 12 months)
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = format(d, 'yyyy-MM');
      const label = format(d, 'MMMM yyyy');
      options.push({ value, label });
    }
    
    return options;
  };
  
  // Export attendance data to CSV
  const exportToCSV = () => {
    const headers = [
      'Username', 
      'Display Name', 
      'Present Days', 
      'Absent Days', 
      ...daysInMonth.map(day => format(day, 'dd MMM'))
    ];
    
    const rows = userAttendanceData.map(data => {
      return [
        data.user.username,
        data.user.display_name || '',
        data.presentDays.toString(),
        data.absentDays.toString(),
        ...daysInMonth.map(day => 
          wasUserPresent(data.user.id, day) ? 'Present' : 'Absent'
        )
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `attendance-${selectedMonth}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Column configuration for the data table
  const columns = [
    {
      header: "User",
      accessorKey: "user.id",
      cell: (row: any) => {
        const userId = row.getValue();
        const userData = userAttendanceData.find(data => data.user.id === userId);
        if (!userData) return null;
        
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {userData.user.profile_picture ? (
                <AvatarImage src={userData.user.profile_picture} alt={userData.user.username} />
              ) : null}
              <AvatarFallback>
                {userData.user.display_name?.[0] || userData.user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{userData.user.display_name || userData.user.username}</div>
              {userData.user.display_name && (
                <div className="text-xs text-muted-foreground">@{userData.user.username}</div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Present",
      accessorKey: "presentDays",
      cell: (row: any) => (
        <span className="font-medium text-green-600">{row.getValue()} days</span>
      )
    },
    {
      header: "Absent",
      accessorKey: "absentDays",
      cell: (row: any) => (
        <span className="font-medium text-red-600">{row.getValue()} days</span>
      )
    },
    {
      header: "Attendance",
      accessorKey: "user.id",
      cell: (row: any) => {
        const userId = row.getValue();
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedUser(userId === selectedUser ? null : userId)}
          >
            View Details
          </Button>
        );
      }
    }
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Attendance Tracker</CardTitle>
              <CardDescription>
                Track daily user logins and attendance records
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={exportToCSV}
                title="Export to CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <PaginatedDataTable
                  columns={columns}
                  data={userAttendanceData}
                  pageSize={10}
                  isLoading={isLoading}
                />
                
                {selectedUser && (
                  <Card className="mt-8">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {format(monthStart, 'MMMM yyyy')} Daily Attendance
                      </CardTitle>
                      <CardDescription>
                        {(() => {
                          const userData = userAttendanceData.find(data => data.user.id === selectedUser);
                          return userData 
                            ? `${userData.user.display_name || userData.user.username}'s daily attendance`
                            : 'User attendance details';
                        })()}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {daysInMonth.map((day, i) => (
                                i < 16 && (
                                  <TableHead key={i} className="text-center p-2">
                                    <div className="font-bold">{format(day, 'd')}</div>
                                    <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                                  </TableHead>
                                )
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              {daysInMonth.map((day, i) => (
                                i < 16 && (
                                  <TableCell key={i} className="text-center p-2">
                                    {wasUserPresent(selectedUser, day) ? (
                                      <Check className="mx-auto h-5 w-5 text-green-500" />
                                    ) : (
                                      <X className="mx-auto h-5 w-5 text-red-500" />
                                    )}
                                  </TableCell>
                                )
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                        
                        {daysInMonth.length > 16 && (
                          <Table className="mt-2">
                            <TableHeader>
                              <TableRow>
                                {daysInMonth.map((day, i) => (
                                  i >= 16 && (
                                    <TableHead key={i} className="text-center p-2">
                                      <div className="font-bold">{format(day, 'd')}</div>
                                      <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                                    </TableHead>
                                  )
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                {daysInMonth.map((day, i) => (
                                  i >= 16 && (
                                    <TableCell key={i} className="text-center p-2">
                                      {wasUserPresent(selectedUser, day) ? (
                                        <Check className="mx-auto h-5 w-5 text-green-500" />
                                      ) : (
                                        <X className="mx-auto h-5 w-5 text-red-500" />
                                      )}
                                    </TableCell>
                                  )
                                ))}
                              </TableRow>
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  // Helper functions
  function handleMonthChange(month: string) {
    setSelectedMonth(month);
  }
  
  function wasUserPresent(userId: string, date: Date): boolean {
    const userData = userAttendanceData.find(data => data.user.id === userId);
    if (!userData) return false;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    return userData.attendanceDates.includes(formattedDate);
  }
  
  function getMonthOptions() {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = format(d, 'yyyy-MM');
      const label = format(d, 'MMMM yyyy');
      options.push({ value, label });
    }
    
    return options;
  }
  
  function exportToCSV() {
    const headers = [
      'Username', 
      'Display Name', 
      'Present Days', 
      'Absent Days', 
      ...daysInMonth.map(day => format(day, 'dd MMM'))
    ];
    
    const rows = userAttendanceData.map(data => {
      return [
        data.user.username,
        data.user.display_name || '',
        data.presentDays.toString(),
        data.absentDays.toString(),
        ...daysInMonth.map(day => 
          wasUserPresent(data.user.id, day) ? 'Present' : 'Absent'
        )
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `attendance-${selectedMonth}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  // Column definition for the data table
  const columns = [
    {
      header: "User",
      accessorKey: "user.id",
      cell: (row: any) => {
        const userId = row.getValue();
        const userData = userAttendanceData.find(data => data.user.id === userId);
        if (!userData) return null;
        
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {userData.user.profile_picture ? (
                <AvatarImage src={userData.user.profile_picture} alt={userData.user.username} />
              ) : null}
              <AvatarFallback>
                {userData.user.display_name?.[0] || userData.user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{userData.user.display_name || userData.user.username}</div>
              {userData.user.display_name && (
                <div className="text-xs text-muted-foreground">@{userData.user.username}</div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: "Present",
      accessorKey: "presentDays",
      cell: (row: any) => (
        <span className="font-medium text-green-600">{row.getValue()} days</span>
      )
    },
    {
      header: "Absent",
      accessorKey: "absentDays",
      cell: (row: any) => (
        <span className="font-medium text-red-600">{row.getValue()} days</span>
      )
    },
    {
      header: "Attendance",
      accessorKey: "user.id",
      cell: (row: any) => {
        const userId = row.getValue();
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedUser(userId === selectedUser ? null : userId)}
          >
            View Details
          </Button>
        );
      }
    }
  ];
};

export default UserAttendanceTracker;
