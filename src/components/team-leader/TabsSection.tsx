
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import TeamMembersTable from '@/components/admin/TeamMembersTable';
import { TeamLeaderAttendanceTracker } from '@/components/admin/attendance';

interface TabsSectionProps {
  teamMembers: any[];
  earnings: any[];
  membersLoading: boolean;
  handleStatusChange: (userId: string, status: string) => Promise<void>;
  requestAccountAction: (memberId: string, action: 'suspend' | 'reactivate') => Promise<void>;
  earningsColumns: any[];
}

const TabsSection: React.FC<TabsSectionProps> = ({
  teamMembers,
  earnings,
  membersLoading,
  handleStatusChange,
  requestAccountAction,
  earningsColumns,
}) => {
  return (
    <Tabs defaultValue="members" className="mb-8">
      <TabsList className="mb-4">
        <TabsTrigger value="members">
          <Users className="h-4 w-4 mr-2" />
          Team Members
        </TabsTrigger>
        <TabsTrigger value="attendance">
          <CalendarDays className="h-4 w-4 mr-2" />
          Team Attendance
        </TabsTrigger>
        <TabsTrigger value="earnings">
          <CalendarDays className="h-4 w-4 mr-2" />
          Monthly Earnings
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="members">
        <Card>
          <CardHeader>
            <CardTitle>Your Team Members</CardTitle>
            <CardDescription>
              View and manage the status of your referred team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMembersTable 
              teamMembers={teamMembers} 
              isLoading={membersLoading} 
              onStatusChange={handleStatusChange}
              onRequestAction={requestAccountAction}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="attendance">
        <TeamLeaderAttendanceTracker />
      </TabsContent>
      
      <TabsContent value="earnings">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <CardDescription>
              View your monthly earnings from active members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={earningsColumns} 
              data={earnings} 
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default TabsSection;
