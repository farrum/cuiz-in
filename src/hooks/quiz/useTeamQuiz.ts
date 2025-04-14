
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  isActive: boolean;
  lastActive: Date;
}

export const useTeamQuiz = (teamSize: number = 2) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isTeamComplete, setIsTeamComplete] = useState(false);
  const [teamScore, setTeamScore] = useState(0);
  const [inviteCode, setInviteCode] = useState('');
  const { toast } = useToast();

  // Generate a unique invite code
  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  }, []);

  // Check if team is complete
  useEffect(() => {
    setIsTeamComplete(teamMembers.length >= teamSize);
  }, [teamMembers, teamSize]);

  // Add a team member
  const addTeamMember = (name: string, avatar?: string) => {
    if (teamMembers.length >= teamSize) {
      toast({
        title: "Team is full",
        description: `Maximum team size is ${teamSize}`,
        variant: "destructive",
      });
      return false;
    }

    const newMember: TeamMember = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      avatar,
      score: 0,
      isActive: true,
      lastActive: new Date()
    };

    setTeamMembers(prev => [...prev, newMember]);
    
    toast({
      title: "New team member",
      description: `${name} has joined your team!`,
    });
    
    return true;
  };

  // Remove a team member
  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id));
    
    toast({
      title: "Team member removed",
      description: "The team member has been removed",
      variant: "default",
    });
  };

  // Update team score
  const updateTeamScore = (points: number) => {
    setTeamScore(prev => prev + points);
    
    // Distribute points to team members
    const pointsPerMember = points / teamMembers.length;
    
    setTeamMembers(prev => 
      prev.map(member => ({
        ...member,
        score: member.score + pointsPerMember
      }))
    );
  };

  // Add AI team members to fill the team
  const addAITeamMembers = () => {
    const aiNames = ["Alex AI", "Jamie Bot", "Quinn Virtual", "Riley Auto"];
    const currentCount = teamMembers.length;
    const neededMembers = teamSize - currentCount;
    
    if (neededMembers <= 0) return;
    
    const newMembers: TeamMember[] = [];
    
    for (let i = 0; i < neededMembers; i++) {
      newMembers.push({
        id: `ai-${i}`,
        name: aiNames[i % aiNames.length],
        score: 0,
        isActive: true,
        lastActive: new Date()
      });
    }
    
    setTeamMembers(prev => [...prev, ...newMembers]);
    setIsTeamComplete(true);
    
    toast({
      title: "AI team members added",
      description: `${neededMembers} AI members have joined your team!`,
    });
  };

  return {
    teamMembers,
    isTeamComplete,
    teamScore,
    inviteCode,
    addTeamMember,
    removeTeamMember,
    updateTeamScore,
    addAITeamMembers
  };
};
