
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  daysActive: number | string;
  joinDate: string;
  totalEarned: number;
  role?: string;
  directLeaderId?: string;
  directLeaderUsername?: string;
  questionsAnswered?: number;
  questionsCorrect?: number;
}

export interface TeamMemberStats {
  activeMembers: number;
  inactiveMembers: number;
  suspendedMembers: number;
}

export interface TeamMemberActionsProps {
  handleStatusChange: (memberId: string, newStatus: 'active' | 'inactive' | 'suspended') => Promise<void>;
  requestAccountAction: (memberId: string, action: 'suspend' | 'reactivate', teamLeaderId?: string) => Promise<void>;
  actionInProgress: boolean;
}
