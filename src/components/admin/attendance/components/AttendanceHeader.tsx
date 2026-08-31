
import React from 'react';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  RefreshCw
} from 'lucide-react';
import { 
  CardDescription, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MemberSearchDropdown, { DropdownMember } from './MemberSearchDropdown';

interface AttendanceHeaderProps {
  currentMonth: Date;
  view: 'calendar' | 'list';
  searchTerm: string;
  loading: boolean;
  attendanceCount: number;
  members: DropdownMember[];
  selectedUserId: string | null;
  onSelectUser: (userId: string | null) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onViewChange: (view: 'calendar' | 'list') => void;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  currentMonth,
  view,
  loading,
  attendanceCount,
  members = [],
  selectedUserId,
  onSelectUser,
  onMonthChange,
  onViewChange,
  onRefresh,
  onExport
}) => {
  return (
    <div className="space-y-4">
      {/* Top Row: Title + Month Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <CardTitle className="flex items-center text-base sm:text-lg font-bold">
            <CalendarIcon className="mr-2 h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" /> 
            Troop Attendance Tracker
          </CardTitle>
          <CardDescription className="text-xs">
            Monitor daily check-ins across your entire team hierarchy
          </CardDescription>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center space-x-1.5 self-stretch sm:self-auto justify-between sm:justify-end bg-slate-50 dark:bg-stone-850 p-1 rounded-xl border border-slate-200/80 dark:border-stone-700">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-900"
            onClick={() => onMonthChange('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-bold text-xs sm:text-sm px-2 text-center min-w-[110px] text-slate-800 dark:text-slate-200">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-900"
            onClick={() => onMonthChange('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Controls Row: View Tabs + Member Dropdown + Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2.5 pt-1">
        {/* View Switcher */}
        <Tabs 
          defaultValue="calendar" 
          value={view} 
          onValueChange={(value) => onViewChange(value as 'calendar' | 'list')}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-2 h-9 p-1 bg-slate-100 dark:bg-stone-850 rounded-xl">
            <TabsTrigger value="calendar" className="text-xs font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-stone-900 data-[state=active]:shadow-sm">
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs font-bold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-stone-900 data-[state=active]:shadow-sm">
              User History
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Member Selector Dropdown & Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <MemberSearchDropdown
            members={members}
            selectedUserId={selectedUserId}
            onSelectUser={onSelectUser}
            className="w-full sm:w-auto flex-1 sm:flex-none"
          />
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            title="Refresh attendance records"
            className="h-9 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            disabled={attendanceCount === 0 || loading}
            title="Download CSV export"
            className="h-9 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 shrink-0"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-amber-600 dark:text-amber-400" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeader;

