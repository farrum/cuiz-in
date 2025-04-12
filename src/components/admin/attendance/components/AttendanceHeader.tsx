
import React from 'react';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  RefreshCw,
  Search
} from 'lucide-react';
import { 
  Card, 
  CardDescription, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';

interface AttendanceHeaderProps {
  currentMonth: Date;
  view: 'calendar' | 'list';
  searchTerm: string;
  loading: boolean;
  attendanceCount: number;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onViewChange: (view: 'calendar' | 'list') => void;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  currentMonth,
  view,
  searchTerm,
  loading,
  attendanceCount,
  onMonthChange,
  onViewChange,
  onSearchChange,
  onRefresh,
  onExport
}) => {
  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-6 w-6" /> 
            User Attendance Tracker
          </CardTitle>
          <CardDescription>
            Track daily user logins across your platform
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onMonthChange('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={() => onMonthChange('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
        <Tabs 
          defaultValue="calendar" 
          value={view} 
          onValueChange={(value) => onViewChange(value as 'calendar' | 'list')}
        >
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">User History</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            disabled={attendanceCount === 0 || loading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </>
  );
};

export default AttendanceHeader;
