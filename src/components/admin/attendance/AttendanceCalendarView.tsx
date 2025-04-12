
import React from 'react';
import { format, isWeekend } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AttendanceCalendarViewProps {
  attendance: Array<{
    user_id: string;
    username: string;
    dates: Record<string, boolean>;
  }>;
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
      <div className="flex justify-center items-center py-8">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        <span>Loading attendance data...</span>
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No attendance data available for this month.
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium">Username</th>
            {daysInMonth.map(day => (
              <th 
                key={format(day, 'yyyy-MM-dd')} 
                className={`px-2 py-2 text-center text-xs font-medium w-8 ${
                  isWeekend(day) ? 'bg-gray-100' : ''
                }`}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {format(day, 'dd')}
                    </TooltipTrigger>
                    <TooltipContent>
                      {format(day, 'EEEE, MMMM d')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
            ))}
            <th className="px-4 py-2 text-center text-sm font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {attendance.map(user => {
            let totalPresent = 0;
            
            return (
              <tr key={user.user_id} className="hover:bg-muted/50">
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  {user.username}
                </td>
                
                {daysInMonth.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isPresent = user.dates[dateStr] ? true : false;
                  const isWeekendDay = isWeekend(day);
                  
                  if (isPresent) totalPresent++;
                  
                  return (
                    <td 
                      key={dateStr} 
                      className={`px-2 py-2 text-center ${
                        isPresent 
                          ? 'bg-green-100' 
                          : isWeekendDay 
                            ? 'bg-gray-50' 
                            : 'bg-white'
                      }`}
                    >
                      {isPresent ? '✓' : ''}
                    </td>
                  );
                })}
                
                <td className="px-4 py-2 text-center">
                  <Badge variant={totalPresent > daysInMonth.length / 2 ? "default" : "outline"}>
                    {totalPresent}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceCalendarView;
