import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, UserX, Ban, Users, Play, Award } from 'lucide-react';

interface StatsCardsProps {
  activeMembers: number;
  inactiveMembers: number;
  suspendedMembers: number;
  teamMembers: any[];
}

const StatsCards: React.FC<StatsCardsProps> = ({
  activeMembers,
  inactiveMembers,
  suspendedMembers,
  teamMembers = [],
}) => {
  const totalTeamSize = teamMembers.length;
  const totalPlays = teamMembers.reduce((acc, m) => acc + (m.questionsAnswered || 0), 0);
  const totalCorrect = teamMembers.reduce((acc, m) => acc + (m.questionsCorrect || 0), 0);
  const accuracy = totalPlays > 0 ? Math.round((totalCorrect / totalPlays) * 100) : 0;

  const statItems = [
    {
      title: "Total Team Size",
      value: totalTeamSize,
      icon: Users,
      colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      description: "Direct & sub-team members"
    },
    {
      title: "Active Members",
      value: activeMembers,
      icon: UserCheck,
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: "Playing actively"
    },
    {
      title: "Inactive Members",
      value: inactiveMembers,
      icon: UserX,
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      description: "Need re-engagement"
    },
    {
      title: "Suspended",
      value: suspendedMembers,
      icon: Ban,
      colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      description: "Violation flagged"
    },
    {
      title: "Questions Answered",
      value: totalPlays.toLocaleString(),
      icon: Play,
      colorClass: "text-violet-500 bg-violet-500/10 border-violet-500/20",
      description: "Total team play count"
    },
    {
      title: "Team Accuracy",
      value: `${accuracy}%`,
      icon: Award,
      colorClass: "text-teal-500 bg-teal-500/10 border-teal-500/20",
      description: "Correct answer ratio"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className="overflow-hidden border border-border bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between items-center">
                <span>{item.title}</span>
                <span className={`p-1.5 rounded-lg border ${item.colorClass}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold tracking-tight mb-1">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
