
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon, Check, Loader2, User, X } from 'lucide-react';
import { format, getDate } from 'date-fns';
import { UserAttendance } from './types';

interface AttendanceCalendarViewProps {
  attendance: UserAttendance[];
  daysInMonth: Date[];
  loading: boolean;
}

const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  attendance,
  daysInMonth,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">Loading attendance data...</span>
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CalendarIcon className="h-16 w-16 mb-4" strokeWidth={1} />
        <p className="text-lg font-medium">No attendance data found for this month</p>
        <p className="text-sm text-muted-foreground mt-1">Select a different month or check your database</p>
      </div>
    );
  }

  return (
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
        </TableBody>
      </Table>
    </div>
  );
};

export default AttendanceCalendarView;
