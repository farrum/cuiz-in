
import React from 'react';
import { format, isWeekend } from 'date-fns';
import { Loader2, Users, RotateCcw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getRoleInfo } from './components/MemberSearchDropdown';

interface AttendanceCalendarViewProps {
  attendance: Array<{
    user_id: string;
    username: string;
    role?: string;
    directLeaderUsername?: string;
    status?: string;
    suspended?: boolean;
    dates: Record<string, boolean>;
  }>;
  daysInMonth: Date[];
  loading: boolean;
  onResetFilter?: () => void;
}

const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({ 
  attendance,
  daysInMonth,
  loading,
  onResetFilter
}) => {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12 text-slate-500 gap-2">
        <Loader2 className="animate-spin h-7 w-7 text-amber-500" />
        <span className="text-xs font-semibold">Loading squad attendance logs...</span>
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
          <Users className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No attendance data found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          No team members match the current filter, or no squad check-ins recorded for this month.
        </p>
        {onResetFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilter}
            className="mt-4 h-8 px-3 text-xs font-bold rounded-xl border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Show All Squad Members
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-stone-700">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-stone-700 text-xs border-collapse">
        <thead className="bg-slate-50 dark:bg-stone-850">
          <tr>
            <th className="sticky left-0 bg-slate-50 dark:bg-stone-850 z-20 px-3 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 shadow-[1px_0_0_0_rgba(0,0,0,0.06)] min-w-[160px] sm:min-w-[200px]">
              Troop Member
            </th>
            {daysInMonth.map(day => {
              const weekend = isWeekend(day);
              return (
                <th 
                  key={format(day, 'yyyy-MM-dd')} 
                  className={`px-1.5 py-2 text-center text-[10px] font-bold w-7 ${
                    weekend 
                      ? 'bg-slate-100/80 dark:bg-stone-800 text-slate-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help block">
                          {format(day, 'dd')}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[11px] font-semibold">
                        {format(day, 'EEEE, MMMM d')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </th>
              );
            })}
            <th className="px-3 py-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 min-w-[60px]">
              Days Present
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-stone-900 divide-y divide-slate-100 dark:divide-stone-800">
          {attendance.map(user => {
            let totalPresent = 0;
            const roleInfo = getRoleInfo(user.role);
            
            return (
              <tr key={user.user_id} className="hover:bg-slate-50/80 dark:hover:bg-stone-800/60 transition-colors">
                <td className="sticky left-0 bg-white dark:bg-stone-900 z-10 px-3 py-2 whitespace-nowrap shadow-[1px_0_0_0_rgba(0,0,0,0.06)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs shrink-0">{roleInfo.emoji}</span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs">
                          {user.username}
                        </span>
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 border font-bold shrink-0 ${roleInfo.badgeBg}`}>
                          {roleInfo.label}
                        </Badge>
                      </div>
                      {user.directLeaderUsername && (
                        <div className="text-[9px] text-slate-400 truncate">
                          Under: {user.directLeaderUsername}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                {daysInMonth.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isPresent = user.dates[dateStr] ? true : false;
                  const weekend = isWeekend(day);
                  
                  if (isPresent) totalPresent++;
                  
                  return (
                    <td 
                      key={dateStr} 
                      className={`px-1 py-1.5 text-center text-xs transition-colors ${
                        isPresent 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold' 
                          : weekend 
                            ? 'bg-slate-50/50 dark:bg-stone-850/40 text-slate-300' 
                            : 'bg-transparent text-slate-300'
                      }`}
                    >
                      {isPresent ? '✓' : '·'}
                    </td>
                  );
                })}
                
                <td className="px-3 py-2 text-center whitespace-nowrap">
                  <Badge 
                    variant={totalPresent > daysInMonth.length / 2 ? "default" : "outline"}
                    className={`text-[10px] font-bold h-5 px-2 ${
                      totalPresent > 0 
                        ? 'bg-emerald-600 text-white' 
                        : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    {totalPresent} / {daysInMonth.length}
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

