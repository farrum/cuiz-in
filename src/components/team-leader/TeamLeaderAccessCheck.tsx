
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TeamLeaderAccessCheckProps {
  isTeamLeader: boolean;
  isLoading: boolean;
}

const TeamLeaderAccessCheck: React.FC<TeamLeaderAccessCheckProps> = ({ isTeamLeader, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isTeamLeader) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            Only Team Leaders can access this dashboard. Refer at least 10 active users to become a Team Leader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default TeamLeaderAccessCheck;
