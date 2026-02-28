
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, UserX, Ban } from 'lucide-react';

interface StatsCardsProps {
  activeMembers: number;
  inactiveMembers: number;
  suspendedMembers: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({
  activeMembers,
  inactiveMembers,
  suspendedMembers,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Active Members</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-green-500" />
          <p className="text-3xl font-bold">{activeMembers}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Inactive Members</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <UserX className="h-6 w-6 text-amber-500" />
          <p className="text-3xl font-bold">{inactiveMembers}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Suspended Members</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Ban className="h-6 w-6 text-red-500" />
          <p className="text-3xl font-bold">{suspendedMembers}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
