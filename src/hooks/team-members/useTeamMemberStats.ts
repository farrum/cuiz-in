
import { useState, useEffect } from 'react';
import { TeamMember, TeamMemberStats } from './types';

// Hook for computing team member statistics
export const useTeamMemberStats = (teamMembers: TeamMember[]) => {
  const [stats, setStats] = useState<TeamMemberStats>({
    activeMembers: 0,
    inactiveMembers: 0,
    suspendedMembers: 0
  });

  useEffect(() => {
    // Calculate statistics based on team members array
    const activeCount = teamMembers.filter(m => m.status === 'active').length;
    const inactiveCount = teamMembers.filter(m => m.status === 'inactive').length;
    const suspendedCount = teamMembers.filter(m => m.status === 'suspended').length;
    
    setStats({
      activeMembers: activeCount,
      inactiveMembers: inactiveCount,
      suspendedMembers: suspendedCount
    });
  }, [teamMembers]);

  return stats;
};
