
import React, { useState } from 'react';
import { UserAttendanceTracker } from './attendance';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import TopPlayersSection from '@/components/TopPlayersSection';
import AdminUserManagementEnhanced from '@/components/admin/AdminUserManagementEnhanced';

const UserManagementWithAttendance: React.FC = () => {
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleResetPassword = async (userId: string) => {
    try {
      // In a real implementation, you would trigger a password reset via Supabase Auth
      // This is a simplified example that just shows a toast notification
      
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
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage all users and their account status</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminUserManagementEnhanced
              onResetPassword={handleResetPassword}
              onUserSelect={(userId) => setSelectedUserId(userId)}
            />
          </CardContent>
        </Card>
      ) : (
        selectedUserId ? (
          <UserAttendanceTracker />
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            Select a user from the table view to see their attendance details
          </div>
        )
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
        <TopPlayersSection className="h-full" limit={5} />
        <TopPlayersSection className="h-full" limit={5} showMonthlyComparison={true} />
      </div>
    </div>
  );
};

export default UserManagementWithAttendance;
