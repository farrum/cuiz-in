
import React, { useState } from 'react';
import UserAttendanceTracker from './UserAttendanceTracker';
import TeamMembersTable from './TeamMembersTable';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const UserManagementWithAttendance: React.FC = () => {
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const { 
    teamMembers, 
    isLoading, 
    handleStatusChange 
  } = useTeamMembers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex space-x-2">
          <Button 
            variant={view === 'table' ? 'default' : 'outline'} 
            onClick={() => setView('table')}
          >
            <Users className="mr-2 h-4 w-4" />
            Users List
          </Button>
          <Button 
            variant={view === 'calendar' ? 'default' : 'outline'} 
            onClick={() => setView('calendar')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Attendance Calendar
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage your team members and their account status</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMembersTable 
              teamMembers={teamMembers} 
              isLoading={isLoading} 
              onStatusChange={handleStatusChange}
            />
          </CardContent>
        </Card>
      ) : (
        <UserAttendanceTracker />
      )}
    </div>
  );
};

export default UserManagementWithAttendance;
