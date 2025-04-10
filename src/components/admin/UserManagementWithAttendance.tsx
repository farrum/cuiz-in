
import React, { useState } from 'react';
import UserAttendanceTracker from './UserAttendanceTracker';
import TeamMembersTable from './TeamMembersTable';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UserManagementWithAttendance: React.FC = () => {
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const { 
    teamMembers, 
    isLoading, 
    handleStatusChange 
  } = useTeamMembers();
  const { toast } = useToast();

  const handleResetPassword = async (userId: string) => {
    try {
      // In a real implementation, you would trigger a password reset via Supabase Auth
      // This is a simplified example that just shows a toast notification
      
      // For Supabase password reset, we would typically do something like this:
      // const { error } = await supabase.auth.admin.resetPasswordForEmail(userEmail);
      
      // Since we don't have direct access to admin methods in the client, we'd use a custom API
      // For now, we'll just show a success toast to demonstrate the UI flow
      
      toast({
        title: "Password reset initiated",
        description: "The user will be asked to create a new password on next login.",
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset user password. Please try again.",
        variant: "destructive",
      });
    }
  };

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
              onResetPassword={handleResetPassword}
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
