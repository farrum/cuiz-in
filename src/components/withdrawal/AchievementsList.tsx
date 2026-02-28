
import React from 'react';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import { Achievement } from '@/types/achievement';

interface AchievementsListProps {
  achievements: Achievement[];
  onClaimAchievement: (achievement: Achievement) => void;
}

const AchievementsList: React.FC<AchievementsListProps> = ({
  achievements,
  onClaimAchievement
}) => {
  const unclaimedAchievements = achievements.filter(a => !a.claimed);
  
  if (unclaimedAchievements.length === 0) return null;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  return (
    <div className="mb-8">
      <h4 className="font-medium mb-3 flex items-center">
        <Award className="w-5 h-5 mr-2 text-primary" />
        Available Rewards
      </h4>
      
      <div className="space-y-4">
        {unclaimedAchievements.map((achievement) => (
          <div key={achievement.id} className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">Monthly Target Completed</h5>
                <p className="text-sm text-muted-foreground">
                  {formatMonth(achievement.month)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold mb-2">{achievement.reward} pts</div>
                <Button 
                  size="sm" 
                  onClick={() => onClaimAchievement(achievement)}
                  className="btn-shine"
                >
                  Claim Reward
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsList;
