
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { Users, Settings } from 'lucide-react';

interface TeamQuizManagementProps {
  activeTab: string;
}

const TeamQuizManagement: React.FC<TeamQuizManagementProps> = ({ activeTab }) => {
  const [teamChallenges, setTeamChallenges] = useState([]);
  const [teamQuizSettings, setTeamQuizSettings] = useState({
    maxTeamSize: 4,
    pointMultiplier: 1.5,
    allowAITeamMembers: true
  });

  const teamChallengeColumns = [
    { header: 'Challenge Name', accessorKey: 'name' },
    { header: 'Start Date', accessorKey: 'startDate' },
    { header: 'End Date', accessorKey: 'endDate' },
    { header: 'Team Size', accessorKey: 'teamSize' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {activeTab === 'challenges' ? (
            <Users className="mr-2" /> 
          ) : (
            <Settings className="mr-2" />
          )}
          {activeTab === 'challenges' ? 'Team Quiz Challenges' : 'Team Quiz Settings'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <Button>Create Team Challenge</Button>
            <PaginatedDataTable 
              columns={teamChallengeColumns}
              data={teamChallenges}
              pageSize={10}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Team Configuration</h3>
              {/* Add form for team quiz settings */}
              <p>Configure global settings for team quizzes</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamQuizManagement;
