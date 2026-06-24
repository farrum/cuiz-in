
import { useState, useEffect } from 'react';
import { TeamMember, TeamMemberStats } from './types';
import { useFetchTeamMembers } from './useFetchTeamMembers';
import { useTeamMemberStats } from './useTeamMemberStats';
import { useTeamMemberActions } from './useTeamMemberActions';

// Main hook that composes all team member functionality
export const useTeamMembers = (teamLeaderId?: string | null) => {
  const { teamMembers: fetchedMembers, isLoading, error, refreshMembers } = useFetchTeamMembers(teamLeaderId);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Set team members from fetched data
  useEffect(() => {
    setTeamMembers(fetchedMembers);
  }, [fetchedMembers]);
  
  // Get statistics based on team members
  const { activeMembers, inactiveMembers, suspendedMembers } = useTeamMemberStats(teamMembers);
  
  // Get actions for team member management
  const { handleStatusChange, requestAccountAction, actionInProgress } = useTeamMemberActions(teamMembers, setTeamMembers);

  return {
    teamMembers,
    activeMembers,
    inactiveMembers,
    suspendedMembers,
    isLoading,
    error,
    handleStatusChange,
    requestAccountAction,
    actionInProgress,
    refreshMembers
  };
};

export type { TeamMember, TeamMemberStats };
