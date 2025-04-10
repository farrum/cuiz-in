
import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamMember } from '@/hooks/useTeamMembers';

interface TeamMembersTableProps {
  teamMembers: TeamMember[];
  isLoading: boolean;
  onStatusChange: (memberId: string, status: 'active' | 'inactive' | 'suspended') => void;
}

const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  teamMembers,
  isLoading,
  onStatusChange
}) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading team members...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Days Active</TableHead>
            <TableHead>Total Earned</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                No team members found
              </TableCell>
            </TableRow>
          ) : (
            teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  {member.status === 'active' && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                  {member.status === 'inactive' && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                      Inactive
                    </Badge>
                  )}
                  {member.status === 'suspended' && (
                    <Badge variant="destructive">Suspended</Badge>
                  )}
                </TableCell>
                <TableCell>{member.joinDate}</TableCell>
                <TableCell>{member.lastActive}</TableCell>
                <TableCell>{member.daysActive}</TableCell>
                <TableCell>₹{member.totalEarned}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {member.status !== 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-green-600"
                        onClick={() => onStatusChange(member.id, 'active')}
                      >
                        Activate
                      </Button>
                    )}
                    {member.status !== 'suspended' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600"
                        onClick={() => onStatusChange(member.id, 'suspended')}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TeamMembersTable;
