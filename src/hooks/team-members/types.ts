
// Define shared types for the team members hooks
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  daysActive: number | string;
  joinDate: string;
  totalEarned: number;
}

export interface TeamMemberStats {
  activeMembers: number;
  inactiveMembers: number;
  suspendedMembers: number;
}
